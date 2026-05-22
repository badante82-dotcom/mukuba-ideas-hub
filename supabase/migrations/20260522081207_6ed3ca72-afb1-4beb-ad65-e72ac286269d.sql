
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('student', 'staff', 'stakeholder', 'admin', 'super_admin');
CREATE TYPE public.suggestion_category AS ENUM ('academics', 'hostel', 'cafeteria', 'security', 'administration', 'ict', 'infrastructure', 'sports', 'other');
CREATE TYPE public.suggestion_status AS ENUM ('submitted', 'under_review', 'in_progress', 'resolved', 'rejected');
CREATE TYPE public.suggestion_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.account_status AS ENUM ('pending', 'approved', 'rejected', 'banned');
CREATE TYPE public.sentiment_label AS ENUM ('positive', 'neutral', 'negative');

-- =========================================================
-- DEPARTMENTS
-- =========================================================
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.departments (name, slug, description) VALUES
  ('Academics', 'academics', 'Academic affairs and teaching'),
  ('Student Affairs', 'student-affairs', 'Welfare and student life'),
  ('Hostel & Accommodation', 'hostel', 'Residential services'),
  ('Cafeteria & Dining', 'cafeteria', 'Food services'),
  ('Security', 'security', 'Campus security'),
  ('ICT', 'ict', 'Information technology'),
  ('Infrastructure', 'infrastructure', 'Buildings and grounds'),
  ('Sports & Recreation', 'sports', 'Sports facilities'),
  ('Administration', 'administration', 'General administration');

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  student_id TEXT,
  university_email TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  avatar_url TEXT,
  status public.account_status NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_status ON public.profiles(status);

-- =========================================================
-- USER ROLES (separate table for security)
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- Security-definer role check (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'super_admin')
  )
$$;

-- =========================================================
-- SUGGESTIONS
-- =========================================================
CREATE TABLE public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category public.suggestion_category NOT NULL DEFAULT 'other',
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  priority public.suggestion_priority NOT NULL DEFAULT 'medium',
  status public.suggestion_status NOT NULL DEFAULT 'submitted',
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  sentiment_label public.sentiment_label,
  sentiment_score NUMERIC(4,3),
  spam_score NUMERIC(4,3) DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  duplicate_of_id UUID REFERENCES public.suggestions(id) ON DELETE SET NULL,
  upvotes_count INTEGER NOT NULL DEFAULT 0,
  responses_count INTEGER NOT NULL DEFAULT 0,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_suggestions_author ON public.suggestions(author_id);
CREATE INDEX idx_suggestions_status ON public.suggestions(status);
CREATE INDEX idx_suggestions_category ON public.suggestions(category);
CREATE INDEX idx_suggestions_department ON public.suggestions(department_id);
CREATE INDEX idx_suggestions_created ON public.suggestions(created_at DESC);

-- Suggestion embeddings (separate table to keep main table light)
CREATE TABLE public.suggestion_embeddings (
  suggestion_id UUID PRIMARY KEY REFERENCES public.suggestions(id) ON DELETE CASCADE,
  embedding JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- ATTACHMENTS
-- =========================================================
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID NOT NULL REFERENCES public.suggestions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attachments_suggestion ON public.attachments(suggestion_id);

-- =========================================================
-- RESPONSES
-- =========================================================
CREATE TABLE public.responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID NOT NULL REFERENCES public.suggestions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_internal_note BOOLEAN NOT NULL DEFAULT FALSE,
  mass_reply_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_responses_suggestion ON public.responses(suggestion_id);

-- =========================================================
-- MASS REPLIES
-- =========================================================
CREATE TABLE public.mass_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  filter_snapshot JSONB NOT NULL DEFAULT '{}',
  recipients_count INTEGER NOT NULL DEFAULT 0,
  also_set_status public.suggestion_status,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.mass_reply_targets (
  mass_reply_id UUID NOT NULL REFERENCES public.mass_replies(id) ON DELETE CASCADE,
  suggestion_id UUID NOT NULL REFERENCES public.suggestions(id) ON DELETE CASCADE,
  PRIMARY KEY (mass_reply_id, suggestion_id)
);

-- =========================================================
-- UPVOTES
-- =========================================================
CREATE TABLE public.upvotes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_id UUID NOT NULL REFERENCES public.suggestions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, suggestion_id)
);

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read_at);

-- =========================================================
-- ACTIVITY LOG
-- =========================================================
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at DESC);

-- =========================================================
-- TRIGGERS
-- =========================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_suggestions_updated BEFORE UPDATE ON public.suggestions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Update response counts
CREATE OR REPLACE FUNCTION public.bump_response_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NOT NEW.is_internal_note THEN
    UPDATE public.suggestions SET responses_count = responses_count + 1 WHERE id = NEW.suggestion_id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_responses_count AFTER INSERT ON public.responses
  FOR EACH ROW EXECUTE FUNCTION public.bump_response_count();

-- Update upvote counts
CREATE OR REPLACE FUNCTION public.bump_upvote_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.suggestions SET upvotes_count = upvotes_count + 1 WHERE id = NEW.suggestion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.suggestions SET upvotes_count = GREATEST(0, upvotes_count - 1) WHERE id = OLD.suggestion_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER trg_upvotes_count AFTER INSERT OR DELETE ON public.upvotes
  FOR EACH ROW EXECUTE FUNCTION public.bump_upvote_count();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, university_email, student_id, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'student_id',
    'approved'
  );
  -- Default everyone to 'student' role; admin can promote
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- RLS
-- =========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestion_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mass_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mass_reply_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Departments: public read
CREATE POLICY "departments_read_all" ON public.departments FOR SELECT USING (true);
CREATE POLICY "departments_admin_write" ON public.departments FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Profiles
CREATE POLICY "profiles_self_read" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin(auth.uid()));
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_admin_update" ON public.profiles FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- User roles
CREATE POLICY "user_roles_self_read" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "user_roles_admin_write" ON public.user_roles FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Suggestions
CREATE POLICY "suggestions_public_resolved" ON public.suggestions FOR SELECT
  USING (status = 'resolved' AND is_public = true AND deleted_at IS NULL);
CREATE POLICY "suggestions_author_read" ON public.suggestions FOR SELECT
  USING (auth.uid() = author_id);
CREATE POLICY "suggestions_admin_read" ON public.suggestions FOR SELECT
  USING (public.is_admin(auth.uid()));
CREATE POLICY "suggestions_auth_insert" ON public.suggestions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (auth.uid() = author_id OR is_anonymous = true));
CREATE POLICY "suggestions_author_update" ON public.suggestions FOR UPDATE
  USING (auth.uid() = author_id AND status = 'submitted');
CREATE POLICY "suggestions_admin_update" ON public.suggestions FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Embeddings: admin only direct access
CREATE POLICY "embeddings_admin_all" ON public.suggestion_embeddings FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Attachments
CREATE POLICY "attachments_read" ON public.attachments FOR SELECT
  USING (
    public.is_admin(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.suggestions s WHERE s.id = suggestion_id AND s.author_id = auth.uid())
  );
CREATE POLICY "attachments_insert" ON public.attachments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.suggestions s WHERE s.id = suggestion_id AND s.author_id = auth.uid())
  );

-- Responses
CREATE POLICY "responses_read" ON public.responses FOR SELECT
  USING (
    (NOT is_internal_note AND EXISTS (
      SELECT 1 FROM public.suggestions s WHERE s.id = suggestion_id
        AND (s.author_id = auth.uid() OR s.status = 'resolved')
    ))
    OR public.is_admin(auth.uid())
  );
CREATE POLICY "responses_admin_insert" ON public.responses FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()) AND auth.uid() = author_id);

-- Mass replies: admin only
CREATE POLICY "mass_replies_admin_all" ON public.mass_replies FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "mass_reply_targets_admin_all" ON public.mass_reply_targets FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Upvotes
CREATE POLICY "upvotes_read_all" ON public.upvotes FOR SELECT USING (true);
CREATE POLICY "upvotes_self_write" ON public.upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upvotes_self_delete" ON public.upvotes FOR DELETE
  USING (auth.uid() = user_id);

-- Notifications: private per user
CREATE POLICY "notifications_self_read" ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "notifications_self_update" ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Activity logs: admin only
CREATE POLICY "activity_logs_admin_read" ON public.activity_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

-- =========================================================
-- STORAGE BUCKET
-- =========================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('suggestion-attachments', 'suggestion-attachments', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "attachments_storage_auth_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'suggestion-attachments' AND auth.uid() IS NOT NULL);
CREATE POLICY "attachments_storage_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'suggestion-attachments' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid())));

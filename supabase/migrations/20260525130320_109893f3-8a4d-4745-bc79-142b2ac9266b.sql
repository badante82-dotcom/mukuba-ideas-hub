CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION private.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'super_admin')
  )
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid) TO authenticated;

DROP POLICY IF EXISTS "activity_logs_admin_read" ON public.activity_logs;
DROP POLICY IF EXISTS "attachments_read" ON public.attachments;
DROP POLICY IF EXISTS "attachments_owner_or_admin_read" ON public.attachments;
DROP POLICY IF EXISTS "departments_admin_write" ON public.departments;
DROP POLICY IF EXISTS "mass_replies_admin_all" ON public.mass_replies;
DROP POLICY IF EXISTS "mass_reply_targets_admin_all" ON public.mass_reply_targets;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_write" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
DROP POLICY IF EXISTS "responses_admin_insert" ON public.responses;
DROP POLICY IF EXISTS "responses_admin_update" ON public.responses;
DROP POLICY IF EXISTS "responses_read" ON public.responses;
DROP POLICY IF EXISTS "embeddings_admin_all" ON public.suggestion_embeddings;
DROP POLICY IF EXISTS "suggestions_admin_read" ON public.suggestions;
DROP POLICY IF EXISTS "suggestions_admin_update" ON public.suggestions;
DROP POLICY IF EXISTS "suggestions_read" ON public.suggestions;
DROP POLICY IF EXISTS "suggestions_update_staff" ON public.suggestions;
DROP POLICY IF EXISTS "user_roles_admin_read" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_write" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_self_read" ON public.user_roles;
DROP POLICY IF EXISTS "attachments_storage_read" ON storage.objects;
DROP POLICY IF EXISTS "objects_suggestion_attachments" ON storage.objects;

CREATE POLICY "activity_logs_admin_read" ON public.activity_logs
FOR SELECT TO authenticated
USING (private.is_admin(auth.uid()));

CREATE POLICY "attachments_read" ON public.attachments
FOR SELECT TO authenticated
USING (
  private.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.suggestions s
    WHERE s.id = attachments.suggestion_id
      AND s.author_id = auth.uid()
  )
);

CREATE POLICY "departments_admin_write" ON public.departments
FOR ALL TO authenticated
USING (private.is_admin(auth.uid()))
WITH CHECK (private.is_admin(auth.uid()));

CREATE POLICY "mass_replies_admin_all" ON public.mass_replies
FOR ALL TO authenticated
USING (private.is_admin(auth.uid()))
WITH CHECK (private.is_admin(auth.uid()));

CREATE POLICY "mass_reply_targets_admin_all" ON public.mass_reply_targets
FOR ALL TO authenticated
USING (private.is_admin(auth.uid()))
WITH CHECK (private.is_admin(auth.uid()));

CREATE POLICY "profiles_self_read" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id OR private.is_admin(auth.uid()));

CREATE POLICY "profiles_admin_update" ON public.profiles
FOR UPDATE TO authenticated
USING (private.is_admin(auth.uid()));

CREATE POLICY "responses_read" ON public.responses
FOR SELECT TO authenticated
USING (
  ((NOT is_internal_note) AND EXISTS (
    SELECT 1 FROM public.suggestions s
    WHERE s.id = responses.suggestion_id
      AND (s.author_id = auth.uid() OR s.status = 'resolved'::public.suggestion_status)
  ))
  OR private.is_admin(auth.uid())
  OR private.has_role(auth.uid(), 'staff')
);

CREATE POLICY "responses_admin_insert" ON public.responses
FOR INSERT TO authenticated
WITH CHECK ((private.is_admin(auth.uid()) OR private.has_role(auth.uid(), 'staff')) AND auth.uid() = author_id);

CREATE POLICY "embeddings_admin_all" ON public.suggestion_embeddings
FOR ALL TO authenticated
USING (private.is_admin(auth.uid()))
WITH CHECK (private.is_admin(auth.uid()));

CREATE POLICY "suggestions_admin_read" ON public.suggestions
FOR SELECT TO authenticated
USING (private.is_admin(auth.uid()) OR private.has_role(auth.uid(), 'staff') OR private.has_role(auth.uid(), 'stakeholder'));

CREATE POLICY "suggestions_admin_update" ON public.suggestions
FOR UPDATE TO authenticated
USING (private.is_admin(auth.uid()) OR private.has_role(auth.uid(), 'staff'));

CREATE POLICY "user_roles_self_read" ON public.user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "user_roles_admin_read" ON public.user_roles
FOR SELECT TO authenticated
USING (private.is_admin(auth.uid()));

CREATE POLICY "user_roles_admin_write" ON public.user_roles
FOR ALL TO authenticated
USING (private.is_admin(auth.uid()))
WITH CHECK (private.is_admin(auth.uid()));

CREATE POLICY "attachments_storage_read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'suggestion-attachments' AND ((auth.uid())::text = (storage.foldername(name))[1] OR private.is_admin(auth.uid())));

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon, authenticated;
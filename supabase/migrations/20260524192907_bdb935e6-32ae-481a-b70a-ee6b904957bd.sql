
-- 1. Storage attachments: enforce folder ownership
DROP POLICY IF EXISTS attachments_storage_auth_upload ON storage.objects;
CREATE POLICY attachments_storage_auth_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'suggestion-attachments'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2. Upvotes: restrict row reads to authenticated users; do not leak user_id to anon
DROP POLICY IF EXISTS upvotes_read_all ON public.upvotes;
CREATE POLICY upvotes_self_read ON public.upvotes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 3. Anonymous suggestions: strip author_id on insert/update when is_anonymous
CREATE OR REPLACE FUNCTION public.anonymize_suggestion_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_anonymous THEN
    NEW.author_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_anonymize_suggestion_author ON public.suggestions;
CREATE TRIGGER trg_anonymize_suggestion_author
  BEFORE INSERT OR UPDATE OF is_anonymous, author_id ON public.suggestions
  FOR EACH ROW EXECUTE FUNCTION public.anonymize_suggestion_author();

-- Backfill: clear author_id on existing anonymous rows
UPDATE public.suggestions SET author_id = NULL WHERE is_anonymous = true AND author_id IS NOT NULL;

-- Adjust insert policy to allow null author when anonymous
DROP POLICY IF EXISTS suggestions_auth_insert ON public.suggestions;
CREATE POLICY suggestions_auth_insert ON public.suggestions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      (is_anonymous = false AND auth.uid() = author_id)
      OR (is_anonymous = true)
    )
  );

-- 4. Realtime: scope channel subscriptions to the user's own notification topic
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_own_topic_read" ON realtime.messages;
CREATE POLICY "notifications_own_topic_read" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    realtime.topic() = 'notifications-' || auth.uid()::text
  );

DROP TRIGGER IF EXISTS trg_suggestions_touch_updated_at ON public.suggestions;
CREATE TRIGGER trg_suggestions_touch_updated_at
  BEFORE UPDATE ON public.suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_touch_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_touch_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_anonymize_suggestion_author ON public.suggestions;
CREATE TRIGGER trg_anonymize_suggestion_author
  BEFORE INSERT OR UPDATE OF is_anonymous, author_id ON public.suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.anonymize_suggestion_author();

DROP TRIGGER IF EXISTS trg_notify_status_change ON public.suggestions;
CREATE TRIGGER trg_notify_status_change
  AFTER UPDATE OF status ON public.suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_status_change();

DROP TRIGGER IF EXISTS trg_bump_response_count ON public.responses;
CREATE TRIGGER trg_bump_response_count
  AFTER INSERT ON public.responses
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_response_count();

DROP TRIGGER IF EXISTS trg_notify_response_added ON public.responses;
CREATE TRIGGER trg_notify_response_added
  AFTER INSERT ON public.responses
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_response_added();

DROP TRIGGER IF EXISTS trg_bump_upvote_count_insert ON public.upvotes;
CREATE TRIGGER trg_bump_upvote_count_insert
  AFTER INSERT ON public.upvotes
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_upvote_count();

DROP TRIGGER IF EXISTS trg_bump_upvote_count_delete ON public.upvotes;
CREATE TRIGGER trg_bump_upvote_count_delete
  AFTER DELETE ON public.upvotes
  FOR EACH ROW
  EXECUTE FUNCTION public.bump_upvote_count();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'suggestions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.suggestions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'responses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.responses;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
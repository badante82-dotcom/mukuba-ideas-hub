
-- Notify author on status change
CREATE OR REPLACE FUNCTION public.notify_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.author_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.author_id,
      'status_change',
      'Status updated: ' || replace(NEW.status::text, '_', ' '),
      NEW.title,
      '/app/suggestions/' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_status_change ON public.suggestions;
CREATE TRIGGER trg_notify_status_change
  AFTER UPDATE OF status ON public.suggestions
  FOR EACH ROW EXECUTE FUNCTION public.notify_status_change();

-- Notify author on new public response
CREATE OR REPLACE FUNCTION public.notify_response_added()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_author uuid;
  v_title text;
BEGIN
  IF NEW.is_internal_note THEN RETURN NEW; END IF;
  SELECT author_id, title INTO v_author, v_title FROM public.suggestions WHERE id = NEW.suggestion_id;
  IF v_author IS NOT NULL AND v_author <> NEW.author_id THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      v_author,
      'response',
      'New response from administration',
      v_title,
      '/app/suggestions/' || NEW.suggestion_id::text
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_response_added ON public.responses;
CREATE TRIGGER trg_notify_response_added
  AFTER INSERT ON public.responses
  FOR EACH ROW EXECUTE FUNCTION public.notify_response_added();

-- Enable realtime
ALTER TABLE public.suggestions REPLICA IDENTITY FULL;
ALTER TABLE public.responses REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.suggestions; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.responses; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

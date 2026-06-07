CREATE OR REPLACE FUNCTION public.notify_new_suggestion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT DISTINCT ur.user_id,
    'new_suggestion',
    'New suggestion submitted',
    NEW.title,
    '/app/suggestions/' || NEW.id::text
  FROM public.user_roles ur
  WHERE ur.role IN ('staff', 'admin', 'super_admin')
    AND (NEW.author_id IS NULL OR ur.user_id <> NEW.author_id);

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_new_suggestion() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_new_suggestion() TO service_role;

DROP TRIGGER IF EXISTS trg_notify_new_suggestion ON public.suggestions;
CREATE TRIGGER trg_notify_new_suggestion
  AFTER INSERT ON public.suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_suggestion();
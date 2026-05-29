CREATE POLICY "suggestions_auth_read_public" ON public.suggestions
FOR SELECT TO authenticated
USING (is_public = true AND deleted_at IS NULL);
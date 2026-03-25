ALTER TABLE public.analytics_reports 
ADD COLUMN IF NOT EXISTS manager_comment text DEFAULT '',
ADD COLUMN IF NOT EXISTS share_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');

CREATE POLICY "public_read_by_share_token"
ON public.analytics_reports
FOR SELECT
TO anon
USING (share_token IS NOT NULL);
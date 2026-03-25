ALTER TABLE public.analytics_reports
  ADD COLUMN IF NOT EXISTS complete_view_rate numeric,
  ADD COLUMN IF NOT EXISTS search_terms jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS comment_images text[] DEFAULT '{}'::text[];
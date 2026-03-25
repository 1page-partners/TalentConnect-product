
CREATE TABLE public.analytics_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES public.influencer_submissions(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT '',
  impressions BIGINT,
  views BIGINT,
  ctr NUMERIC(6,4),
  avg_watch_time TEXT,
  total_watch_time TEXT,
  retention_rate NUMERIC(6,4),
  likes BIGINT,
  like_rate NUMERIC(6,4),
  traffic_sources JSONB DEFAULT '{}'::jsonb,
  audience_age JSONB DEFAULT '{}'::jsonb,
  audience_gender JSONB DEFAULT '{}'::jsonb,
  audience_region JSONB DEFAULT '{}'::jsonb,
  devices JSONB DEFAULT '{}'::jsonb,
  raw_text TEXT,
  source_images TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.analytics_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_member_manage_reports" ON public.analytics_reports
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'member'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'member'::app_role));

CREATE TRIGGER update_analytics_reports_updated_at
  BEFORE UPDATE ON public.analytics_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

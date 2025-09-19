-- キャンペーンテーブル
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
  slug TEXT UNIQUE NOT NULL,
  management_sheet_url TEXT,
  report_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- インフルエンサー応募テーブル
CREATE TABLE public.influencer_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  influencer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  preferred_fee TEXT,
  contact_methods TEXT[] NOT NULL DEFAULT '{}',
  contact_email TEXT,
  instagram_followers INTEGER,
  instagram_engagement_rate DECIMAL(5,2),
  tiktok_followers INTEGER,
  tiktok_views BIGINT,
  youtube_subscribers INTEGER,
  youtube_views BIGINT,
  notes TEXT,
  portfolio_files TEXT[] DEFAULT '{}',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- クリエイターテーブル
CREATE TABLE public.campaign_creators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_url TEXT NOT NULL,
  deliverable_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS有効化
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_creators ENABLE ROW LEVEL SECURITY;

-- 管理者アクセス用のポリシー（一旦全てのデータにアクセス可能に設定）
CREATE POLICY "Admin can manage campaigns" 
ON public.campaigns 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Admin can manage submissions" 
ON public.influencer_submissions 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Admin can manage creators" 
ON public.campaign_creators 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 公開キャンペーン閲覧用ポリシー
CREATE POLICY "Public can view open campaigns" 
ON public.campaigns 
FOR SELECT 
USING (status = 'open');

-- インフルエンサーが応募できるポリシー
CREATE POLICY "Anyone can submit applications" 
ON public.influencer_submissions 
FOR INSERT 
WITH CHECK (true);

-- 更新用の関数とトリガー
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON public.influencer_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Create campaigns table
CREATE TABLE public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    summary TEXT,
    platforms TEXT[] DEFAULT '{}',
    deadline DATE NOT NULL,
    status TEXT DEFAULT 'open',
    management_sheet_url TEXT,
    report_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create influencer_submissions table
CREATE TABLE public.influencer_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
    influencer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    instagram_followers INTEGER,
    instagram_engagement_rate NUMERIC,
    tiktok_followers INTEGER,
    tiktok_views INTEGER,
    youtube_subscribers INTEGER,
    youtube_views INTEGER,
    contact_methods TEXT[] DEFAULT '{}',
    contact_email TEXT,
    portfolio_files TEXT[],
    preferred_fee TEXT,
    notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign_creators table
CREATE TABLE public.campaign_creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    account_url TEXT NOT NULL,
    deliverable_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
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

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to auto-create role for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- RLS Policies for campaigns
CREATE POLICY "Authenticated users can read campaigns"
ON public.campaigns FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Public can read campaigns"
ON public.campaigns FOR SELECT TO anon
USING (true);

CREATE POLICY "Authenticated users can insert campaigns"
ON public.campaigns FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaigns"
ON public.campaigns FOR UPDATE TO authenticated
USING (true);

-- RLS Policies for influencer_submissions
CREATE POLICY "Authenticated users can read submissions"
ON public.influencer_submissions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Anyone can insert submissions"
ON public.influencer_submissions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update submissions"
ON public.influencer_submissions FOR UPDATE TO authenticated
USING (true);

-- RLS Policies for campaign_creators
CREATE POLICY "Authenticated users can read creators"
ON public.campaign_creators FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert creators"
ON public.campaign_creators FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update creators"
ON public.campaign_creators FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete creators"
ON public.campaign_creators FOR DELETE TO authenticated
USING (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON public.influencer_submissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
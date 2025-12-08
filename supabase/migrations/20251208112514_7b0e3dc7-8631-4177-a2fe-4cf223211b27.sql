-- =====================================================
-- TalentConnect Production Database Schema Replication
-- =====================================================

-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'member',
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  description TEXT,
  target_platforms TEXT[] DEFAULT '{}',
  deliverables JSONB DEFAULT '{}',
  video_production_only BOOLEAN DEFAULT false,
  secondary_usage BOOLEAN DEFAULT false,
  secondary_usage_period TEXT,
  secondary_usage_purpose TEXT,
  ad_appearance BOOLEAN DEFAULT false,
  posting_date TEXT,
  ng_items TEXT,
  nda_template TEXT DEFAULT 'PlanC',
  nda_url TEXT,
  image_materials TEXT[] DEFAULT '{}',
  attachments TEXT[] DEFAULT '{}',
  requires_consent BOOLEAN DEFAULT true,
  contact_email TEXT,
  management_sheet_url TEXT,
  report_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- 4. Create influencer_submissions table
CREATE TABLE public.influencer_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  line_id TEXT,
  preferred_contact TEXT DEFAULT 'email',
  main_sns TEXT,
  main_account TEXT,
  instagram TEXT,
  tiktok TEXT,
  youtube TEXT,
  x_twitter TEXT,
  red TEXT,
  other_sns JSONB DEFAULT '[]',
  desired_fee TEXT,
  portfolio_urls TEXT[] DEFAULT '{}',
  insight_screenshots TEXT[] DEFAULT '{}',
  notes TEXT,
  status TEXT DEFAULT 'pending',
  can_participate BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.influencer_submissions ENABLE ROW LEVEL SECURITY;

-- 5. Create campaign_creators table
CREATE TABLE public.campaign_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  submission_id UUID REFERENCES public.influencer_submissions(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_creators ENABLE ROW LEVEL SECURITY;

-- 6. Create creator_lists table
CREATE TABLE public.creator_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_lists ENABLE ROW LEVEL SECURITY;

-- 7. Create creator_list_items table
CREATE TABLE public.creator_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.creator_lists(id) ON DELETE CASCADE NOT NULL,
  submission_id UUID REFERENCES public.influencer_submissions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (list_id, submission_id)
);

ALTER TABLE public.creator_list_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Security Definer Functions
-- =====================================================

-- has_role function for RLS policies
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
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

-- Check if user is admin or member
CREATE OR REPLACE FUNCTION public.is_admin_or_member(_user_id UUID)
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
      AND role IN ('admin', 'member')
  )
$$;

-- =====================================================
-- RLS Policies
-- =====================================================

-- user_roles policies
CREATE POLICY "Admins can view all user roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage user roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- campaigns policies (admin and member can manage)
CREATE POLICY "Admin and member can view all campaigns"
ON public.campaigns FOR SELECT
TO authenticated
USING (public.is_admin_or_member(auth.uid()));

CREATE POLICY "Admin and member can create campaigns"
ON public.campaigns FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_member(auth.uid()));

CREATE POLICY "Admin and member can update campaigns"
ON public.campaigns FOR UPDATE
TO authenticated
USING (public.is_admin_or_member(auth.uid()));

CREATE POLICY "Admin and member can delete campaigns"
ON public.campaigns FOR DELETE
TO authenticated
USING (public.is_admin_or_member(auth.uid()));

-- influencer_submissions policies
CREATE POLICY "Admin and member can view all submissions"
ON public.influencer_submissions FOR SELECT
TO authenticated
USING (public.is_admin_or_member(auth.uid()));

CREATE POLICY "Anyone can create submissions"
ON public.influencer_submissions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admin and member can update submissions"
ON public.influencer_submissions FOR UPDATE
TO authenticated
USING (public.is_admin_or_member(auth.uid()));

CREATE POLICY "Admin and member can delete submissions"
ON public.influencer_submissions FOR DELETE
TO authenticated
USING (public.is_admin_or_member(auth.uid()));

-- campaign_creators policies
CREATE POLICY "Admin and member can view all campaign creators"
ON public.campaign_creators FOR SELECT
TO authenticated
USING (public.is_admin_or_member(auth.uid()));

CREATE POLICY "Admin and member can manage campaign creators"
ON public.campaign_creators FOR ALL
TO authenticated
USING (public.is_admin_or_member(auth.uid()))
WITH CHECK (public.is_admin_or_member(auth.uid()));

-- creator_lists policies
CREATE POLICY "Admin and member can view all creator lists"
ON public.creator_lists FOR SELECT
TO authenticated
USING (public.is_admin_or_member(auth.uid()));

CREATE POLICY "Admin and member can manage creator lists"
ON public.creator_lists FOR ALL
TO authenticated
USING (public.is_admin_or_member(auth.uid()))
WITH CHECK (public.is_admin_or_member(auth.uid()));

-- creator_list_items policies
CREATE POLICY "Admin and member can view all creator list items"
ON public.creator_list_items FOR SELECT
TO authenticated
USING (public.is_admin_or_member(auth.uid()));

CREATE POLICY "Admin and member can manage creator list items"
ON public.creator_list_items FOR ALL
TO authenticated
USING (public.is_admin_or_member(auth.uid()))
WITH CHECK (public.is_admin_or_member(auth.uid()));

-- =====================================================
-- Triggers
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply update trigger to tables
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_influencer_submissions_updated_at
BEFORE UPDATE ON public.influencer_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creator_lists_updated_at
BEFORE UPDATE ON public.creator_lists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-assign member role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, email)
  VALUES (NEW.id, 'member', NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Storage Bucket
-- =====================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for attachments bucket
CREATE POLICY "Anyone can view attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'attachments');

CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Authenticated users can update their attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'attachments');

CREATE POLICY "Authenticated users can delete attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'attachments');

-- Anonymous users can upload (for influencer submissions)
CREATE POLICY "Anonymous users can upload attachments"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'attachments');
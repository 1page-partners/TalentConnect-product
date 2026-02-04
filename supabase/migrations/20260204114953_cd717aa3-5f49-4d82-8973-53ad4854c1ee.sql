-- Add new columns to influencer_submissions for Phase1 completion
ALTER TABLE public.influencer_submissions
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS average_views INTEGER,
ADD COLUMN IF NOT EXISTS follower_demographics JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
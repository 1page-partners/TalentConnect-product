-- Add line_id column to influencer_submissions table
ALTER TABLE public.influencer_submissions
ADD COLUMN line_id text;
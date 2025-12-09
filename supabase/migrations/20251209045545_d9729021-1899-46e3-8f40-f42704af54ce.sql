-- Add deadline column to campaigns table
ALTER TABLE public.campaigns
ADD COLUMN deadline text;
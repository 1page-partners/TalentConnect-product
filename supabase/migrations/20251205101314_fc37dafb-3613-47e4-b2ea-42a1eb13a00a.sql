-- Drop existing RLS policy for campaigns
DROP POLICY IF EXISTS "admin_all_campaigns" ON public.campaigns;

-- Create new policy using has_role function
CREATE POLICY "admin_all_campaigns" 
ON public.campaigns 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'member'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'member'));
-- 1. influencer_submissionsへの匿名SELECTを拒否
CREATE POLICY "deny_anon_select_submissions" 
ON public.influencer_submissions 
FOR SELECT 
TO anon 
USING (false);

-- 2. campaignsの匿名SELECT全許可ポリシーを削除
DROP POLICY IF EXISTS "anon_select_campaigns" ON public.campaigns;
-- 管理者のみがcampaign_creatorsを閲覧可能にする
CREATE POLICY "admin_select_creators" 
ON public.campaign_creators 
FOR SELECT 
USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
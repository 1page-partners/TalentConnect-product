-- campaigns テーブルのポリシーを修正（RESTRICTIVEからPERMISSIVEへ）
DROP POLICY IF EXISTS "admin_all_campaigns" ON public.campaigns;

CREATE POLICY "admin_member_all_campaigns" ON public.campaigns
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'member'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'member'::app_role)
);

-- storage.objects のポリシーも修正
DROP POLICY IF EXISTS "member_admin_all_storage" ON storage.objects;

CREATE POLICY "member_admin_storage" ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'attachments' 
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'member')
    )
  )
)
WITH CHECK (
  bucket_id = 'attachments' 
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'member')
    )
  )
);
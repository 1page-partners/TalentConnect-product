-- member権限でのファイルアップロードを許可するRLSポリシーを追加

-- 既存のadmin_all_storageポリシーを削除して、member含むように更新
DROP POLICY IF EXISTS "admin_all_storage" ON storage.objects;

-- admin/memberがattachmentsバケットで全操作可能なポリシー
CREATE POLICY "member_admin_all_storage" ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'attachments' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'member')
  )
)
WITH CHECK (
  bucket_id = 'attachments' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'member')
  )
);
-- 既存のRESTRICTIVEポリシーを削除
DROP POLICY IF EXISTS "anon_insert_submissions" ON public.influencer_submissions;

-- PERMISSIVEポリシーとして再作成（匿名ユーザーがINSERTできるように）
CREATE POLICY "allow_public_insert_submissions"
ON public.influencer_submissions
FOR INSERT
TO public
WITH CHECK (true);

-- 管理者用のSELECTポリシーも追加（PERMISSIVEとして）
-- 既存のadmin_all_submissionsがRESTRICTIVEなので、SELECTも許可されない問題を修正
DROP POLICY IF EXISTS "admin_all_submissions" ON public.influencer_submissions;

CREATE POLICY "admin_manage_submissions"
ON public.influencer_submissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'member')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'member')
  )
);
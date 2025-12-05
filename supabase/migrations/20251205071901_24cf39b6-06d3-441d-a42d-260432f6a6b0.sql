-- 匿名ユーザーがadmin_usersテーブルを読み取れないようにする
CREATE POLICY "deny_anon_admin_users" 
ON public.admin_users 
FOR SELECT 
TO anon 
USING (false);
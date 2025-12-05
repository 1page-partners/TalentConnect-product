-- 1. user_rolesにemail列を追加
ALTER TABLE public.user_roles ADD COLUMN email text;

-- 2. user_roles挿入時にauth.usersからemailを自動取得するトリガー関数
CREATE OR REPLACE FUNCTION public.set_user_role_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT email INTO NEW.email
  FROM auth.users
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- 3. トリガー作成
CREATE TRIGGER on_user_role_insert
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_role_email();

-- 4. 既存のuser_rolesレコードのemailを更新（もしあれば）
UPDATE public.user_roles ur
SET email = (SELECT email FROM auth.users WHERE id = ur.user_id)
WHERE ur.email IS NULL;
-- 1. ロール用のenum作成
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- 2. user_rolesテーブル作成
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- 3. RLS有効化
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. ロール確認用のセキュリティ定義関数
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. RLSポリシー
-- 管理者は全レコード閲覧可能
CREATE POLICY "admin_select_user_roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- ユーザーは自分のロールのみ閲覧可能
CREATE POLICY "users_select_own_role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 管理者のみINSERT/UPDATE/DELETE可能
CREATE POLICY "admin_manage_user_roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
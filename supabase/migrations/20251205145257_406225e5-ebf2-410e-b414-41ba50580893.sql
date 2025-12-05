-- マイリストテーブル
CREATE TABLE public.creator_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- マイリストのアイテムテーブル
CREATE TABLE public.creator_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.creator_lists(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.influencer_submissions(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(list_id, submission_id)
);

-- RLSを有効化
ALTER TABLE public.creator_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_list_items ENABLE ROW LEVEL SECURITY;

-- creator_lists のRLSポリシー（adminとmemberのみ）
CREATE POLICY "admin_member_manage_lists" ON public.creator_lists
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'member'::app_role)
) WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'member'::app_role)
);

-- ユーザーは自分のリストのみ操作可能
CREATE POLICY "users_manage_own_lists" ON public.creator_lists
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- creator_list_items のRLSポリシー
CREATE POLICY "admin_member_manage_list_items" ON public.creator_list_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.creator_lists
    WHERE creator_lists.id = creator_list_items.list_id
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'member'::app_role))
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.creator_lists
    WHERE creator_lists.id = creator_list_items.list_id
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'member'::app_role))
  )
);

-- ユーザーは自分のリストのアイテムのみ操作可能
CREATE POLICY "users_manage_own_list_items" ON public.creator_list_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.creator_lists
    WHERE creator_lists.id = creator_list_items.list_id
    AND creator_lists.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.creator_lists
    WHERE creator_lists.id = creator_list_items.list_id
    AND creator_lists.user_id = auth.uid()
  )
);

-- インデックス
CREATE INDEX idx_creator_lists_user_id ON public.creator_lists(user_id);
CREATE INDEX idx_creator_list_items_list_id ON public.creator_list_items(list_id);
CREATE INDEX idx_creator_list_items_submission_id ON public.creator_list_items(submission_id);
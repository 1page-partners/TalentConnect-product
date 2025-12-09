-- キャンペーンの募集終了フラグを追加
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS is_closed boolean DEFAULT false;
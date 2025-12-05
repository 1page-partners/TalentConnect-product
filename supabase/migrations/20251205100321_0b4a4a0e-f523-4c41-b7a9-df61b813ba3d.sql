-- campaignsテーブルに参加許諾要否フラグを追加
ALTER TABLE public.campaigns 
ADD COLUMN requires_consent boolean NOT NULL DEFAULT true;

-- コメント追加
COMMENT ON COLUMN public.campaigns.requires_consent IS '参加許諾取得が必要かどうか（true: NDA同意フロー有り、false: 案件詳細のみ表示）';
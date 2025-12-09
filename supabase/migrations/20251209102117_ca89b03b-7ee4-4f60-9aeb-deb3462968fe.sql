-- ステータスが「終了」に変更された際に自動的に募集停止フラグを設定するトリガー関数
CREATE OR REPLACE FUNCTION public.auto_close_campaign_on_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- ステータスが 'completed' に変更された場合、is_closed を true に設定
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.is_closed = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- トリガーを作成
CREATE TRIGGER set_closed_on_completed_status
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_close_campaign_on_completed();
-- 既存のRESTRICTIVE SELECTポリシーを削除（PERMISSIVEポリシーで管理者のみSELECT可能にしたため不要）
DROP POLICY IF EXISTS "deny_anon_select_submissions" ON public.influencer_submissions;
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { submissionApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface OptInFormProps {
  onNext: () => void;
  onBack?: () => void;
  campaignId: string;
  isPreview?: boolean;
}

const OptInForm = ({ onNext, onBack, campaignId, isPreview = false }: OptInFormProps) => {
  const [wantsContact, setWantsContact] = useState(false);
  const [email, setEmail] = useState("");
  const [lineId, setLineId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (wantsContact && !email && !lineId) {
      newErrors.contact = "連絡を希望する場合、メールアドレスまたはLINE IDのいずれかが必要です";
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "有効なメールアドレスを入力してください";
    }

    if (wantsContact && !privacyAgreed) {
      newErrors.privacyAgreed = "プライバシーポリシーに同意してください";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // プレビューモードの場合はDB保存をスキップ
      if (isPreview) {
        toast({
          title: "プレビューモード",
          description: "プレビューのため、データは保存されません",
        });
        onNext();
        return;
      }

      // 連絡を希望しない場合もレコードを作成（status: declined）
      const submission = {
        campaign_id: campaignId,
        influencer_name: wantsContact ? '連絡希望者' : '辞退者',
        email: email || 'declined@example.com',
        line_id: lineId || null,
        notes: wantsContact ? '今後の連絡を希望' : '今回は辞退',
        status: 'declined',
      };

      await submissionApi.create(submission);
      
      toast({
        title: "送信完了",
        description: "ご回答ありがとうございました",
      });

      onNext();
    } catch (error) {
      console.error('OptIn submission error:', error);
      toast({
        title: "送信エラー",
        description: "送信に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            今後のご案内について
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-muted-foreground">
            今回の案件は対応いただけないとのことですが、今後類似の案件がございましたら
            ご連絡させていただいてもよろしいでしょうか？
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="wants-contact"
                checked={wantsContact}
                onCheckedChange={(checked) => {
                  setWantsContact(checked === true);
                  if (!checked) {
                    setEmail("");
                    setLineId("");
                    setPrivacyAgreed(false);
                    setErrors({});
                  }
                }}
              />
              <div className="flex-1">
                <label 
                  htmlFor="wants-contact" 
                  className="text-sm text-foreground cursor-pointer"
                >
                  今後の案件情報の連絡を受け取る
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  類似の案件がある場合にご連絡いたします
                </p>
              </div>
            </div>

            {wantsContact && (
              <div className="ml-6 space-y-4 border-l-2 border-primary/20 pl-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    メールアドレス
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email || errors.contact) {
                        setErrors({});
                      }
                    }}
                    placeholder="example@email.com"
                    className="w-full"
                  />
                </div>

                <div className="text-center text-xs text-muted-foreground">
                  または
                </div>

                <div className="space-y-2">
                  <Label htmlFor="line-id" className="text-sm font-medium">
                    LINE ID
                  </Label>
                  <Input
                    id="line-id"
                    value={lineId}
                    onChange={(e) => {
                      setLineId(e.target.value);
                      if (errors.contact) {
                        setErrors({});
                      }
                    }}
                    placeholder="LINE ID"
                    className="w-full"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  ※ メールアドレスまたはLINE IDのいずれかをご入力ください
                </p>

                {(errors.contact || errors.email) && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    {errors.contact || errors.email}
                  </div>
                )}

                {/* プライバシーポリシー同意 */}
                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="privacy-agreed-optin"
                      checked={privacyAgreed}
                      onCheckedChange={(checked) => {
                        setPrivacyAgreed(checked as boolean);
                        if (errors.privacyAgreed) setErrors(prev => ({ ...prev, privacyAgreed: '' }));
                      }}
                      className={errors.privacyAgreed ? "border-destructive" : ""}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="privacy-agreed-optin" className="text-sm font-medium cursor-pointer leading-relaxed">
                        <button
                          type="button"
                          onClick={() => setShowPrivacyModal(true)}
                          className="text-primary underline hover:text-primary/80 transition-colors"
                        >
                          プライバシーポリシー
                        </button>
                        に同意します <span className="text-destructive">*</span>
                      </Label>
                      {errors.privacyAgreed && (
                        <p className="text-xs text-destructive">{errors.privacyAgreed}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {onBack && (
          <div className="flex justify-start">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
            >
              ← 前へ
            </Button>
          </div>
        )}
        
        <div className="flex justify-end">
          <Button 
            variant="wizard"
            onClick={handleSubmit}
            disabled={isSubmitting || (wantsContact && !privacyAgreed)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                送信中...
              </>
            ) : (
              "送信する"
            )}
          </Button>
        </div>
      </div>

      {/* プライバシーポリシーモーダル */}
      <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>プライバシーポリシー</DialogTitle>
            <DialogDescription>
              以下の内容をご確認ください
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6 text-sm">
              <section className="space-y-2">
                <h3 className="font-semibold text-base">1. 個人情報の取得について</h3>
                <p className="text-muted-foreground leading-relaxed">
                  当社は、本フォームを通じて以下の個人情報を取得します。
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  <li>氏名・活動名</li>
                  <li>電話番号</li>
                  <li>メールアドレス</li>
                  <li>LINE ID</li>
                  <li>SNSアカウント情報（フォロワー数等を含む）</li>
                  <li>ポートフォリオ・実績資料</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-base">2. 個人情報の利用目的</h3>
                <p className="text-muted-foreground leading-relaxed">
                  取得した個人情報は、以下の目的で利用します。
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  <li>タイアップ案件のご連絡・調整</li>
                  <li>報酬のお支払いに関する手続き</li>
                  <li>今後の案件のご案内</li>
                  <li>サービス改善のための統計分析（個人を特定しない形式）</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-base">3. 個人情報の第三者提供</h3>
                <p className="text-muted-foreground leading-relaxed">
                  当社は、以下の場合を除き、取得した個人情報を第三者に提供することはありません。
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  <li>ご本人の同意がある場合</li>
                  <li>法令に基づく場合</li>
                  <li>タイアップ案件の遂行に必要な範囲で、クライアント企業に提供する場合</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-base">4. 個人情報の管理</h3>
                <p className="text-muted-foreground leading-relaxed">
                  当社は、個人情報の漏洩、滅失又は毀損の防止その他の個人情報の安全管理のために必要かつ適切な措置を講じます。
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-base">5. 個人情報の開示・訂正・削除</h3>
                <p className="text-muted-foreground leading-relaxed">
                  ご本人から個人情報の開示、訂正、削除等のご請求があった場合は、適切に対応いたします。お問い合わせは下記連絡先までご連絡ください。
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-base">6. お問い合わせ</h3>
                <p className="text-muted-foreground leading-relaxed">
                  個人情報の取り扱いに関するお問い合わせは、本サービス運営者までご連絡ください。
                </p>
              </section>
            </div>
          </ScrollArea>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setShowPrivacyModal(false)}>
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OptInForm;
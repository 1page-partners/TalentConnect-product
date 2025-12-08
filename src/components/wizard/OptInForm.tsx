import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (wantsContact && !email && !lineId) {
      newErrors.contact = "連絡を希望する場合、メールアドレスまたはLINE IDのいずれかが必要です";
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "有効なメールアドレスを入力してください";
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
        name: wantsContact ? '連絡希望者' : '辞退者',
        email: email || 'declined@example.com',
        line_id: lineId || null,
        notes: wantsContact ? '今後の連絡を希望' : '今回は辞退',
        status: 'declined',
        can_participate: false,
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
            disabled={isSubmitting}
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
    </div>
  );
};

export default OptInForm;
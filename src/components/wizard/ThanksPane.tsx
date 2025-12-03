import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Heart } from "lucide-react";

interface ThanksPaneProps {
  isAccepted: boolean;
  onBackToStart: () => void;
}

const ThanksPane = ({ isAccepted, onBackToStart }: ThanksPaneProps) => {
  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            {isAccepted ? (
              <CheckCircle className="w-16 h-16 text-success" />
            ) : (
              <Heart className="w-16 h-16 text-primary" />
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">
              {isAccepted ? 'ご応募ありがとうございます！' : 'ご回答ありがとうございます！'}
            </h2>
            
            <div className="text-muted-foreground space-y-2">
              {isAccepted ? (
                <>
                  <p>
                    案件へのご対応ありがとうございます。<br />
                    内容を確認のうえ、担当者より追ってご連絡いたします。
                  </p>
                  <p className="text-sm">
                    通常、1-2営業日以内にご連絡いたします。<br />
                    お急ぎの場合は直接お問い合わせください。
                  </p>
                </>
              ) : (
                <>
                  <p>
                    今回の案件へのご回答ありがとうございました。<br />
                    今後のご案内の可否をご設定いただき、ありがとうございました。
                  </p>
                  <p className="text-sm">
                    設定いただいた内容に基づき、<br />
                    今後適切な案件がございましたらご連絡させていただきます。
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <Button 
              variant="outline"
              onClick={onBackToStart}
              className="px-8"
            >
              完了
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            TalentConnect をご利用いただきありがとうございました
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThanksPane;
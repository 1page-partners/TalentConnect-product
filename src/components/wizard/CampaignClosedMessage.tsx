import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const CampaignClosedMessage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">この案件は募集終了しました</h2>
          <p className="text-muted-foreground text-sm">
            ご興味をお持ちいただきありがとうございます。<br />
            残念ながら、この案件の募集は終了いたしました。
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignClosedMessage;

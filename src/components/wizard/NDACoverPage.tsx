import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ShieldCheck, ArrowRight } from "lucide-react";

interface NDACoverPageProps {
  tentativeTitle?: string;
  onNext: () => void;
}

const NDACoverPage = ({ tentativeTitle, onNext }: NDACoverPageProps) => {
  return (
    <Card className="shadow-card overflow-hidden border-primary/20">
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <CardContent className="p-10 md:p-14">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>

            <div className="space-y-3">
              <div className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
                Non-Disclosure Agreement
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                機密保持契約書
              </h1>
              <p className="text-sm text-muted-foreground">
                本案件の詳細をご確認いただく前に、機密保持契約へのご同意をお願いいたします。
              </p>
            </div>

            <div className="w-full max-w-md border-t border-b border-border/60 py-6 space-y-2">
              <div className="text-xs text-muted-foreground">仮案件名</div>
              <div className="text-lg md:text-xl font-semibold text-foreground break-words">
                {tentativeTitle?.trim() || "（仮案件名は設定されていません）"}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="w-4 h-4" />
              次のページから契約内容をご確認いただけます
            </div>

            <Button variant="wizard" size="lg" onClick={onNext} className="min-w-[200px]">
              NDAを確認する
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default NDACoverPage;

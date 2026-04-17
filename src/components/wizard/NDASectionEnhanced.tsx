import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getNdaTextByUrl, PLANC_NDA_TEXT } from "@/data/ndaTexts";
import NDAContent from "./NDAContent";

interface NDASectionEnhancedProps {
  onNext: () => void;
  ndaUrl?: string;
}

const NDASectionEnhanced = ({ onNext, ndaUrl }: NDASectionEnhancedProps) => {
  const [agreed, setAgreed] = useState(false);
  const [showError, setShowError] = useState(false);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);

  const handleNext = () => {
    if (!agreed) {
      setShowError(true);
      return;
    }
    onNext();
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    // 95%以上スクロールしたら同意チェックを有効化
    if (scrollPercentage >= 0.95 && !hasScrolledToEnd) {
      setHasScrolledToEnd(true);
    }
  };

  // ndaUrlに応じて表示するNDA本文を選択（フォールバックはPlan C）
  const ndaText = getNdaTextByUrl(ndaUrl) ?? PLANC_NDA_TEXT;

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            機密保持契約（NDA）について
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              案件詳細をご確認いただく前に、機密保持契約への同意が必要です。
              下記の内容を最後までスクロールしてご確認ください。
            </p>

            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <ScrollArea
                  className="h-96"
                  onScrollCapture={handleScroll}
                >
                  <div className="text-sm text-foreground whitespace-pre-wrap pr-4 leading-relaxed">
                    {ndaText}
                  </div>
                </ScrollArea>
                {!hasScrolledToEnd && (
                  <div className="mt-2 text-xs text-warning bg-warning/10 p-2 rounded">
                    ※ 最後まで読み進めてから同意チェックが可能になります
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="border-t pt-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="nda-agreement"
                  checked={agreed}
                  disabled={!hasScrolledToEnd}
                  onCheckedChange={(checked) => {
                    setAgreed(checked === true);
                    setShowError(false);
                  }}
                />
                <label
                  htmlFor="nda-agreement"
                  className={`text-sm flex-1 leading-5 ${
                    hasScrolledToEnd ? 'text-foreground cursor-pointer' : 'text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  上記の機密保持契約の内容を確認し、同意いたします
                </label>
              </div>

              {showError && (
                <div className="mt-3 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  NDAへの同意が必要です
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="wizard"
          onClick={handleNext}
          disabled={!agreed}
          className={!agreed ? "opacity-50 cursor-not-allowed" : ""}
        >
          次へ進む
        </Button>
      </div>
    </div>
  );
};

export default NDASectionEnhanced;

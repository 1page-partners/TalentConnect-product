import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const mockNdaContent = `機密保持契約書

第1条（目的）
本契約は、〇〇株式会社（以下「甲」という）と受託者（以下「乙」という）との間において、甲が乙に開示する機密情報の取扱いについて定めることを目的とします。

第2条（機密情報の定義）
本契約において「機密情報」とは、甲が乙に対して開示する一切の情報をいいます。これには以下が含まれますがこれに限定されません：
- 商品・サービスに関する情報
- マーケティング戦略
- 顧客情報
- 技術情報
- その他甲が機密と指定する情報

第3条（機密保持義務）
乙は、機密情報を第三者に開示、漏洩してはならず、また本契約の目的以外に使用してはなりません。

第4条（期間）
本契約の有効期間は、契約締結日から3年間とします。

第5条（損害賠償）
乙が本契約に違反した場合、甲に生じた損害を賠償する責任を負います。

第6条（準拠法）
本契約は、日本法に準拠し、日本法により解釈されるものとします。

第7条（管轄裁判所）
本契約に関する一切の紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。

第8条（その他）
本契約の変更は、当事者双方の書面による合意によってのみ行うことができます。

第9条（契約の効力）
本契約は、当事者双方が署名した日から効力を生じ、第4条に定める期間中有効とします。

第10条（秘密情報の返還）
契約終了後、乙は甲の要求に応じて、機密情報を含む一切の資料を返還または破棄するものとします。

以上、本契約の成立を証するため、本書2通を作成し、甲乙各1通を保有するものとします。

この契約書をよくお読みいただき、内容に同意いただける場合は下記にチェックをお願いいたします。`;

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
            
            {ndaUrl ? (
              <div className="space-y-3">
                <div className="w-full h-96 border rounded-lg overflow-hidden">
                  <iframe
                    src={ndaUrl}
                    className="w-full h-full"
                    title="NDA契約書"
                    onLoad={() => setHasScrolledToEnd(true)}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  ※PDFを最後まで確認してから同意チェックをお願いします
                </p>
              </div>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <ScrollArea 
                    className="h-64" 
                    onScrollCapture={handleScroll}
                  >
                    <div className="text-xs text-foreground whitespace-pre-line font-mono pr-4">
                      {mockNdaContent}
                    </div>
                  </ScrollArea>
                  {!hasScrolledToEnd && (
                    <div className="mt-2 text-xs text-warning bg-warning/10 p-2 rounded">
                      ※ 最後まで読み進めてから同意チェックが可能になります
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
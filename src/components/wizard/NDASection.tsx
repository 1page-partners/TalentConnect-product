import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NDASectionProps {
  onNext: () => void;
  ndaUrl?: string;
}

const NDASection = ({ onNext, ndaUrl }: NDASectionProps) => {
  const [agreed, setAgreed] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleNext = () => {
    if (!agreed) {
      setShowError(true);
      return;
    }
    onNext();
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

以上、本契約の成立を証するため、本書2通を作成し、甲乙各1通を保有するものとします。`;

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
              下記の内容をご確認ください。
            </p>
            
            {ndaUrl ? (
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  onClick={() => window.open(ndaUrl, '_blank')}
                  className="w-full"
                >
                  NDA文書を開く（PDF）
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  ※新しいタブで開きます
                </p>
              </div>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <ScrollArea className="h-48">
                    <div className="text-xs text-foreground whitespace-pre-line font-mono">
                      {mockNdaContent}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            <div className="border-t pt-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="nda-agreement"
                  checked={agreed}
                  onCheckedChange={(checked) => {
                    setAgreed(checked === true);
                    setShowError(false);
                  }}
                />
                <label 
                  htmlFor="nda-agreement" 
                  className="text-sm text-foreground cursor-pointer flex-1 leading-5"
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

export default NDASection;
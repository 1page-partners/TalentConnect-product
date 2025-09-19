import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SocialIconsList } from "@/components/SocialIcons";
import { Calendar, DollarSign, FileText, AlertTriangle } from "lucide-react";
import { Campaign } from "@/lib/mock-data";

interface CampaignDetailCardProps {
  campaign: Campaign;
}

const CampaignDetailCard = ({ campaign }: CampaignDetailCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl font-semibold text-foreground pr-4">
              {campaign.title}
            </CardTitle>
            <Badge variant={campaign.status === 'open' ? 'default' : 'secondary'}>
              {campaign.status === 'open' ? '募集中' : '募集終了'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* クライアント・案件種別 */}
          {(campaign.clientName || campaign.isTH) && (
            <div className="flex flex-wrap gap-4">
              {campaign.clientName && (
                <div>
                  <h3 className="font-medium text-foreground mb-1">クライアント</h3>
                  <Badge variant="outline">{campaign.clientName}</Badge>
                </div>
              )}
              {campaign.isTH && (
                <div>
                  <h3 className="font-medium text-foreground mb-1">案件種別</h3>
                  <Badge variant="secondary">TH案件</Badge>
                </div>
              )}
            </div>
          )}

          {/* 概要 */}
          <div>
            <h3 className="font-medium text-foreground mb-2">案件概要</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {campaign.summary}
            </p>
          </div>

          {/* プラットフォーム・成果物 */}
          <div>
            <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
              対象SNS・成果物
              <SocialIconsList platforms={campaign.platforms} className="flex gap-1" />
            </h3>
            <div className="space-y-2">
              {campaign.platforms.map((platform) => (
                <div key={platform} className="flex items-center gap-2">
                  <Badge variant="outline">{platform}</Badge>
                  {campaign.platformDeliverables?.[platform] && (
                    <div className="flex flex-wrap gap-1">
                      {campaign.platformDeliverables[platform].map((deliverable) => (
                        <Badge key={deliverable} variant="secondary" className="text-xs">
                          {deliverable}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 成果物・条件 */}
          <div>
            <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              成果物・条件
            </h3>
            <div className="bg-muted/30 p-4 rounded-md">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                {campaign.requirements}
              </pre>
            </div>
          </div>

          {/* スケジュール */}
          <div>
            <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              スケジュール
            </h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">締切日:</span>
                <span className="font-semibold text-destructive">
                  {formatDate(campaign.deadline)}
                </span>
              </div>
              {campaign.plannedPostDate && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">投稿予定:</span>
                  <span className="text-sm">{campaign.plannedPostDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* 注意事項 */}
          {campaign.restrictions && (
            <div>
              <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                注意事項・制約
              </h3>
              <div className="bg-warning/10 border border-warning/20 p-4 rounded-md">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                  {campaign.restrictions}
                </pre>
              </div>
            </div>
          )}

          {/* 契約条件 */}
          {(campaign.isVideoProductionOnly || campaign.secondaryUsage?.hasUsage || campaign.hasAdvertisementAppearance) && (
            <div>
              <h3 className="font-medium text-foreground mb-2">契約条件</h3>
              <div className="space-y-1">
                {campaign.isVideoProductionOnly && (
                  <Badge variant="outline">納品動画制作のみ</Badge>
                )}
                {campaign.secondaryUsage?.hasUsage && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">二次利用あり</Badge>
                    <span className="text-xs text-muted-foreground">
                      ({campaign.secondaryUsage.duration} - {campaign.secondaryUsage.purpose})
                    </span>
                  </div>
                )}
                {campaign.hasAdvertisementAppearance && (
                  <Badge variant="outline">広告出演あり</Badge>
                )}
              </div>
            </div>
          )}

          {/* 連絡先 */}
          {campaign.contactEmail && (
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground">
                お問い合わせ: {campaign.contactEmail}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignDetailCard;
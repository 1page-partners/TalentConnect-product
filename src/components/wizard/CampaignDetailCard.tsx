import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SocialIconsList } from "@/components/SocialIcons";
import { Calendar, DollarSign, FileText, AlertTriangle } from "lucide-react";
import { Campaign } from "@/lib/mock-data";

interface CampaignDetailCardProps {
  campaign: Campaign;
}

const CampaignDetailCard = ({ campaign }: CampaignDetailCardProps) => {
  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

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
          {/* 概要 */}
          <div>
            <h3 className="font-medium text-foreground mb-2">案件概要</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {campaign.summary}
            </p>
          </div>

          {/* プラットフォーム */}
          <div>
            <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
              対象SNS
              <SocialIconsList platforms={campaign.platforms} className="flex gap-1" />
            </h3>
            <div className="flex flex-wrap gap-2">
              {campaign.platforms.map((platform) => (
                <Badge key={platform} variant="outline">
                  {platform}
                </Badge>
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

          {/* 予算・締切 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                予算レンジ
              </h3>
              <p className="text-lg font-semibold text-primary">
                {formatCurrency(campaign.budgetMin)} - {formatCurrency(campaign.budgetMax)}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                締切日
              </h3>
              <p className="text-lg font-semibold text-destructive">
                {formatDate(campaign.deadline)}
              </p>
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
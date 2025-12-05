import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { campaignApi, Campaign } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SocialIcon } from "@/components/SocialIcons";
import { Loader2, Calendar, AlertCircle } from "lucide-react";

const CampaignDetailOnly = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!slug) {
        navigate('/404');
        return;
      }

      try {
        const foundCampaign = await campaignApi.getBySlug(slug);
        if (!foundCampaign) {
          navigate('/404');
          return;
        }
        setCampaign(foundCampaign);
      } catch (error) {
        console.error('キャンペーン取得エラー:', error);
        navigate('/404');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">案件が見つかりません</h2>
          <p className="text-muted-foreground">URLをご確認ください</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const platforms = campaign.platforms || [];
  const platformDeliverables = campaign.platform_deliverables as Record<string, string[]> | null;
  const secondaryUsage = campaign.secondary_usage as { hasUsage: boolean; duration?: string; purpose?: string } | null;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={campaign.status === 'open' ? 'default' : 'secondary'}>
                {campaign.status === 'open' ? '募集中' : '募集終了'}
              </Badge>
              {campaign.is_th && (
                <Badge variant="outline">TH案件</Badge>
              )}
            </div>
            <CardTitle className="text-2xl">{campaign.title}</CardTitle>
            <p className="text-muted-foreground">{campaign.client_name}</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 概要 */}
            <div>
              <h3 className="font-semibold mb-2">概要</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{campaign.summary}</p>
            </div>

            {/* 想定媒体 */}
            {platforms.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">想定媒体</h3>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => (
                    <div key={platform} className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
                      <SocialIcon platform={platform} className="w-4 h-4" />
                      <span className="text-sm">{platform}</span>
                    </div>
                  ))}
                </div>
                
                {/* 成果物詳細 */}
                {platformDeliverables && Object.keys(platformDeliverables).length > 0 && (
                  <div className="mt-3 space-y-2">
                    {Object.entries(platformDeliverables).map(([platform, deliverables]) => (
                      deliverables && deliverables.length > 0 && (
                        <div key={platform} className="text-sm">
                          <span className="font-medium">{platform}:</span>{' '}
                          <span className="text-muted-foreground">{deliverables.join(', ')}</span>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 条件詳細 */}
            {campaign.requirements && (
              <div>
                <h3 className="font-semibold mb-2">成果物・条件詳細</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{campaign.requirements}</p>
              </div>
            )}

            {/* スケジュール */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>締切: {formatDate(campaign.deadline)}</span>
              {campaign.planned_post_date && (
                <span className="text-muted-foreground">
                  （投稿予定: {campaign.planned_post_date}）
                </span>
              )}
            </div>

            {/* 契約条件 */}
            <div className="space-y-2">
              {campaign.is_video_production_only && (
                <Badge variant="outline">納品動画の制作のみ</Badge>
              )}
              {campaign.has_advertisement_appearance && (
                <Badge variant="outline">広告出演あり</Badge>
              )}
              {secondaryUsage?.hasUsage && (
                <div className="text-sm">
                  <span className="font-medium">二次利用:</span>{' '}
                  <span className="text-muted-foreground">
                    {secondaryUsage.duration}
                    {secondaryUsage.purpose && ` / ${secondaryUsage.purpose}`}
                  </span>
                </div>
              )}
            </div>

            {/* NG事項 */}
            {campaign.restrictions && (
              <div>
                <h3 className="font-semibold mb-2 text-destructive">NG事項・制約</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{campaign.restrictions}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Powered by TalentConnect
        </p>
      </main>
    </div>
  );
};

export default CampaignDetailOnly;
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { SocialIconsList } from "@/components/SocialIcons";
import { mockCampaigns } from "@/lib/mock-data";
import { ArrowLeft, ExternalLink, FileText, BarChart3 } from "lucide-react";

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const campaign = mockCampaigns.find(c => c.id === id);

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">案件が見つかりません</h1>
            <Button onClick={() => navigate('/admin/list')} variant="outline">
              案件一覧に戻る
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate('/admin/list')}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              案件一覧に戻る
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">案件詳細</h1>
              <p className="text-muted-foreground">募集終了案件の詳細情報</p>
            </div>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <CardTitle className="text-xl font-semibold text-foreground">
                      {campaign.title}
                    </CardTitle>
                    <Badge variant="secondary">募集終了</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    作成日: {formatDate(campaign.createdAt)}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <SocialIconsList platforms={campaign.platforms} />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">案件概要</h3>
                <p className="text-sm text-foreground leading-relaxed">
                  {campaign.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 border-y">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-muted-foreground">締切:</span>
                  <span className="font-medium text-foreground">
                    {formatDate(campaign.deadline)}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-muted-foreground">プラットフォーム:</span>
                  <div className="flex space-x-1">
                    {campaign.platforms.map((platform) => (
                      <Badge key={platform} variant="outline" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* タイアップクリエイター一覧 */}
              {campaign.creators && campaign.creators.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">タイアップクリエイター一覧</h3>
                  <div className="grid gap-4">
                    {campaign.creators.map((creator) => (
                      <Card key={creator.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <h4 className="font-medium text-foreground">{creator.name}</h4>
                              <div className="flex items-center space-x-4 text-sm">
                                <Link 
                                  to={creator.accountUrl} 
                                  target="_blank"
                                  className="flex items-center space-x-1 text-primary hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>アカウント</span>
                                </Link>
                                <Link 
                                  to={creator.deliverableUrl} 
                                  target="_blank"
                                  className="flex items-center space-x-1 text-primary hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>成果物</span>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* 管理ツールリンク */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">管理ツール</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {campaign.managementSheetUrl && (
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <Link 
                          to={campaign.managementSheetUrl} 
                          target="_blank"
                          className="flex items-center space-x-3 text-foreground hover:text-primary transition-colors"
                        >
                          <div className="p-2 bg-primary/10 rounded-md">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">進行管理シート</h4>
                            <p className="text-sm text-muted-foreground">ディレクター用進行管理</p>
                          </div>
                          <ExternalLink className="w-4 h-4 ml-auto" />
                        </Link>
                      </CardContent>
                    </Card>
                  )}

                  {campaign.reportUrl && (
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <Link 
                          to={campaign.reportUrl} 
                          target="_blank"
                          className="flex items-center space-x-3 text-foreground hover:text-primary transition-colors"
                        >
                          <div className="p-2 bg-primary/10 rounded-md">
                            <BarChart3 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">結果レポート</h4>
                            <p className="text-sm text-muted-foreground">キャンペーン成果レポート</p>
                          </div>
                          <ExternalLink className="w-4 h-4 ml-auto" />
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CampaignDetail;
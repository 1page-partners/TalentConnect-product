import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import { SocialIconsList } from "@/components/SocialIcons";
import { mockCampaigns, generateDistributionUrl, platformOptions } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { Plus, Copy, Eye, Calendar, Check, ArrowLeft, Search, Settings } from "lucide-react";

const CampaignList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copiedUrls, setCopiedUrls] = useState<Set<string>>(new Set());
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  const copyDistributionUrl = async (slug: string, campaignTitle: string) => {
    const url = `${window.location.origin}${generateDistributionUrl(slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrls(prev => new Set([...prev, slug]));
      toast({
        title: "URLをコピーしました",
        description: `${campaignTitle}の配布URLをクリップボードにコピーしました`,
      });
      setTimeout(() => {
        setCopiedUrls(prev => {
          const newSet = new Set(prev);
          newSet.delete(slug);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "コピーに失敗しました",
        description: "手動でURLをコピーしてください",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // フィルタリングされた案件
  const filteredCampaigns = useMemo(() => {
    return mockCampaigns.filter((campaign) => {
      const matchesKeyword = 
        campaign.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        campaign.summary.toLowerCase().includes(searchKeyword.toLowerCase());
      
      const matchesPlatform = 
        selectedPlatform === "all" || 
        campaign.platforms.includes(selectedPlatform);

      return matchesKeyword && matchesPlatform;
    });
  }, [searchKeyword, selectedPlatform]);

  // ステータス別の案件
  const openCampaigns = filteredCampaigns.filter(campaign => campaign.status === 'open');
  const closedCampaigns = filteredCampaigns.filter(campaign => campaign.status === 'closed');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">案件一覧</h1>
                <p className="text-muted-foreground">作成済みの案件と配布URLを管理します</p>
              </div>
            </div>
            
            <Button
              onClick={() => navigate('/admin/new')}
              variant="wizard"
            >
              <Plus className="w-4 h-4 mr-2" />
              新規案件作成
            </Button>
          </div>

          {/* 検索・フィルター */}
          <Card className="shadow-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">案件検索</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">キーワード検索</label>
                  <Input
                    placeholder="案件名・概要で検索..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">プラットフォーム</label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="プラットフォーム選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {platformOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* タブ切り替えで案件一覧 */}
          <Tabs defaultValue="open" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="open">
                募集中案件 ({openCampaigns.length})
              </TabsTrigger>
              <TabsTrigger value="closed">
                募集終了案件 ({closedCampaigns.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="open" className="space-y-4">
              {openCampaigns.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-12 text-center">
                  <div className="space-y-4">
                    <div className="text-muted-foreground">
                      <Plus className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-medium text-foreground">募集中の案件がありません</h3>
                      <p className="text-sm">新しい案件を作成してみましょう</p>
                    </div>
                    <Button
                      onClick={() => navigate('/admin/new')}
                      variant="outline"
                    >
                      案件を作成する
                    </Button>
                  </div>
              </CardContent>
            </Card>
              ) : (
                <div className="grid gap-6">
                  {openCampaigns.map((campaign) => (
                <Card key={campaign.id} className="shadow-card">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <CardTitle className="text-lg font-semibold text-foreground">
                            {campaign.title}
                          </CardTitle>
                          <Badge variant={campaign.status === 'open' ? 'default' : 'secondary'}>
                            {campaign.status === 'open' ? '募集中' : '募集終了'}
                          </Badge>
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
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-foreground leading-relaxed">
                      {campaign.summary}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 border-y">
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-4 h-4 text-destructive" />
                        <span className="text-muted-foreground">締切:</span>
                        <span className="font-medium text-foreground">
                          {formatDate(campaign.deadline)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm">
                        <div className="flex space-x-1">
                          {campaign.platforms.map((platform) => (
                            <Badge key={platform} variant="outline" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-foreground">配布URL</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-md border">
                        <code className="flex-1 text-sm text-foreground">
                          {window.location.origin}{generateDistributionUrl(campaign.slug)}
                        </code>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyDistributionUrl(campaign.slug, campaign.title)}
                          >
                            {copiedUrls.has(campaign.slug) ? (
                              <Check className="w-4 h-4 text-success" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link to={generateDistributionUrl(campaign.slug)} target="_blank">
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        このURLをインフルエンサーに共有してください
                      </p>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
              )}
            </TabsContent>

            <TabsContent value="closed" className="space-y-4">
              {closedCampaigns.length === 0 ? (
                <Card className="shadow-card">
                  <CardContent className="p-12 text-center">
                    <div className="space-y-4">
                      <div className="text-muted-foreground">
                        <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                        <h3 className="text-lg font-medium text-foreground">募集終了案件がありません</h3>
                        <p className="text-sm">まだ終了した案件はありません</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {closedCampaigns.map((campaign) => (
                    <Card key={campaign.id} className="shadow-card">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <CardTitle className="text-lg font-semibold text-foreground">
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
                      
                      <CardContent className="space-y-4">
                        <p className="text-sm text-foreground leading-relaxed">
                          {campaign.summary}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 border-y">
                          <div className="flex items-center space-x-2 text-sm">
                            <Calendar className="w-4 h-4 text-destructive" />
                            <span className="text-muted-foreground">締切:</span>
                            <span className="font-medium text-foreground">
                              {formatDate(campaign.deadline)}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm">
                            <div className="flex space-x-1">
                              {campaign.platforms.map((platform) => (
                                <Badge key={platform} variant="outline" className="text-xs">
                                  {platform}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <div className="text-sm text-muted-foreground">
                            {campaign.creators ? `${campaign.creators.length}名のクリエイターが参加` : 'クリエイター情報なし'}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link to={`/admin/campaign/${campaign.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              詳細を見る
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

// Label component for consistency
const Label = ({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => {
  return (
    <label className={className} {...props}>
      {children}
    </label>
  );
};

export default CampaignList;
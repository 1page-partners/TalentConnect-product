import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { SocialIconsList } from "@/components/SocialIcons";
import { mockCampaigns, getSubmissionsByCampaignId, type InfluencerSubmission } from "@/lib/mock-data";
import { ArrowLeft, ExternalLink, FileText, BarChart3, Users, Mail, Phone, Eye, Download, FileSpreadsheet } from "lucide-react";

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions'>('overview');
  
  const campaign = mockCampaigns.find(c => c.id === id);
  const submissions = campaign ? getSubmissionsByCampaignId(campaign.id) : [];

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

  const getStatusBadgeVariant = (status: InfluencerSubmission['status']) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: InfluencerSubmission['status']) => {
    switch (status) {
      case 'approved': return '承認済み';
      case 'rejected': return '却下';
      default: return '審査中';
    }
  };

  const exportToCSV = () => {
    if (submissions.length === 0) return;

    const headers = [
      'インフルエンサー名',
      '応募日',
      'メールアドレス',
      '電話番号',
      '希望報酬',
      '連絡手段',
      'Instagram フォロワー',
      'Instagram エンゲージメント率',
      'TikTok フォロワー',
      'TikTok 総再生数',
      'YouTube 登録者',
      'YouTube 総再生数',
      '備考'
    ];

    const csvData = submissions.map(submission => [
      submission.influencerName,
      formatDate(submission.submittedAt),
      submission.email,
      submission.phone,
      submission.preferredFee || '',
      submission.contactMethods.join(', '),
      submission.instagram?.followers.toLocaleString() || '',
      submission.instagram?.engagementRate ? `${submission.instagram.engagementRate}%` : '',
      submission.tiktok?.followers.toLocaleString() || '',
      submission.tiktok?.views.toLocaleString() || '',
      submission.youtube?.subscribers.toLocaleString() || '',
      submission.youtube?.views.toLocaleString() || '',
      submission.notes || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${campaign.title}_応募者一覧_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToGoogleSheets = () => {
    if (submissions.length === 0) return;

    const headers = [
      'インフルエンサー名',
      '応募日',
      'メールアドレス',
      '電話番号',
      '希望報酬',
      '連絡手段',
      'Instagram フォロワー',
      'Instagram エンゲージメント率',
      'TikTok フォロワー',
      'TikTok 総再生数',
      'YouTube 登録者',
      'YouTube 総再生数',
      '備考'
    ];

    const csvData = submissions.map(submission => [
      submission.influencerName,
      formatDate(submission.submittedAt),
      submission.email,
      submission.phone,
      submission.preferredFee || '',
      submission.contactMethods.join(', '),
      submission.instagram?.followers.toLocaleString() || '',
      submission.instagram?.engagementRate ? `${submission.instagram.engagementRate}%` : '',
      submission.tiktok?.followers.toLocaleString() || '',
      submission.tiktok?.views.toLocaleString() || '',
      submission.youtube?.subscribers.toLocaleString() || '',
      submission.youtube?.views.toLocaleString() || '',
      submission.notes || ''
    ]);

    const allData = [headers, ...csvData];
    const csvContent = allData
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Google Sheetsで開く用のCSVファイルをダウンロード
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${campaign.title}_GoogleSheets用_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Google Sheetsのインポート画面を開く
    const googleSheetsUrl = 'https://docs.google.com/spreadsheets/create';
    window.open(googleSheetsUrl, '_blank');
  };

  const renderSubmissionDetail = (submission: InfluencerSubmission) => (
    <Card key={submission.id} className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="text-lg font-semibold text-foreground">{submission.influencerName}</h4>
            <p className="text-sm text-muted-foreground">
              応募日: {formatDate(submission.submittedAt)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{submission.email}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{submission.phone}</span>
            </div>
            {submission.preferredFee && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-muted-foreground">希望報酬:</span>
                <span className="text-foreground font-medium">{submission.preferredFee}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">連絡手段: </span>
              <span className="text-foreground">{submission.contactMethods.join(', ')}</span>
            </div>
            {submission.contactEmail && submission.contactMethods.includes('email') && (
              <div className="text-sm">
                <span className="text-muted-foreground">連絡用メール: </span>
                <span className="text-foreground">{submission.contactEmail}</span>
              </div>
            )}
          </div>
        </div>

        {/* SNS Statistics and Insights */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            {submission.instagram && (
              <div className="text-center">
                <div className="text-sm font-medium text-foreground">Instagram</div>
                <div className="text-lg font-bold text-primary">{submission.instagram.followers.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">フォロワー</div>
                <div className="text-xs text-muted-foreground">エンゲージメント率: {submission.instagram.engagementRate}%</div>
              </div>
            )}
            {submission.tiktok && (
              <div className="text-center">
                <div className="text-sm font-medium text-foreground">TikTok</div>
                <div className="text-lg font-bold text-primary">{submission.tiktok.followers.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">フォロワー</div>
                <div className="text-xs text-muted-foreground">総再生数: {submission.tiktok.views.toLocaleString()}</div>
              </div>
            )}
            {submission.youtube && (
              <div className="text-center">
                <div className="text-sm font-medium text-foreground">YouTube</div>
                <div className="text-lg font-bold text-primary">{submission.youtube.subscribers.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">登録者</div>
                <div className="text-xs text-muted-foreground">総再生数: {submission.youtube.views.toLocaleString()}</div>
              </div>
            )}
          </div>

          {/* SNS Insights Upload Section */}
          <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg">
            <div className="text-sm font-medium text-foreground mb-2">SNSインサイト</div>
            <div className="text-xs text-muted-foreground mb-3">
              Instagram、TikTok、YouTubeのインサイト画像・データをアップロード
            </div>
            {submission.portfolioFiles && submission.portfolioFiles.some(file => 
              file.toLowerCase().includes('insight') || 
              file.toLowerCase().includes('analytics') ||
              file.toLowerCase().includes('インサイト')
            ) ? (
              <div className="flex flex-wrap gap-2">
                {submission.portfolioFiles.filter(file => 
                  file.toLowerCase().includes('insight') || 
                  file.toLowerCase().includes('analytics') ||
                  file.toLowerCase().includes('インサイト')
                ).map((file, index) => (
                  <Badge key={index} variant="outline" className="cursor-pointer bg-primary/10 text-primary">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    {file}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center py-3">
                <BarChart3 className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <div className="text-xs text-muted-foreground">
                  インサイト画像がアップロードされていません
                </div>
              </div>
            )}
          </div>
        </div>

        {submission.notes && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-sm font-medium text-foreground mb-1">備考</div>
            <div className="text-sm text-muted-foreground">{submission.notes}</div>
          </div>
        )}

        {(submission.portfolioFiles && submission.portfolioFiles.length > 0) && (
          <div className="mt-4">
            <div className="text-sm font-medium text-foreground mb-2">ポートフォリオ</div>
            <div className="flex flex-wrap gap-2">
              {submission.portfolioFiles.map((file, index) => (
                <Badge key={index} variant="outline" className="cursor-pointer">
                  {file}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
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
                <p className="text-muted-foreground">案件の詳細情報と応募者一覧</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant={activeTab === 'overview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('overview')}
              >
                <Eye className="w-4 h-4 mr-2" />
                案件概要
              </Button>
              <Button
                variant={activeTab === 'submissions' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('submissions')}
              >
                <Users className="w-4 h-4 mr-2" />
                応募者一覧 ({submissions.length})
              </Button>
            </div>
          </div>

          {activeTab === 'overview' ? (
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-xl font-semibold text-foreground">
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
          ) : (
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-foreground flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>応募者一覧</span>
                    <Badge variant="outline">{submissions.length}件</Badge>
                  </CardTitle>
                  
                  {submissions.length > 0 && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToCSV}
                        className="flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>CSV出力</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToGoogleSheets}
                        className="flex items-center space-x-2"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>スプレッドシート</span>
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  この案件に応募したインフルエンサーの詳細情報
                </p>
              </CardHeader>
              <CardContent>
                {submissions.length > 0 ? (
                  <div className="space-y-4">
                    {submissions.map(renderSubmissionDetail)}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">応募者がいません</h3>
                    <p className="text-muted-foreground">まだこの案件に応募したインフルエンサーはいません。</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default CampaignDetail;
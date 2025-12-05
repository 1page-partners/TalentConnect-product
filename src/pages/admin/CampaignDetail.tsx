import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { campaignApi, submissionApi, creatorApi, Campaign, InfluencerSubmission, CampaignCreator } from '@/lib/api';
import { ArrowLeft, Copy, ExternalLink, Download, FileSpreadsheet, Users, Mail, Phone, Loader2, FileText } from 'lucide-react';
import { SocialIconsList } from '@/components/SocialIcons';

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [submissions, setSubmissions] = useState<InfluencerSubmission[]>([]);
  const [creators, setCreators] = useState<CampaignCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [campaignData, submissionsData, creatorsData] = await Promise.all([
          campaignApi.getById(id), submissionApi.getByCampaignId(id), creatorApi.getByCampaignId(id)
        ]);
        setCampaign(campaignData);
        setSubmissions(submissionsData);
        setCreators(creatorsData);
      } catch (error) {
        console.error('データ取得エラー:', error);
        toast({ title: 'エラー', description: 'データの取得に失敗しました', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, toast]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });

  const copyDistributionUrl = () => {
    if (!campaign) return;
    navigator.clipboard.writeText(`${window.location.origin}/i/${campaign.slug}`);
    toast({ title: 'URLをコピーしました' });
  };

  // Json型からフォロワー数を取得するヘルパー
  const getFollowers = (data: any, key: string): number | null => {
    if (!data || typeof data !== 'object') return null;
    return data[key] ?? null;
  };

  const exportToCSV = () => {
    if (submissions.length === 0) { toast({ title: 'エクスポートできません', variant: 'destructive' }); return; }
    const headers = ['名前', 'メール', '電話番号', 'Instagram', 'TikTok', 'YouTube', '応募日'];
    const rows = submissions.map(s => [
      s.influencer_name, 
      s.email || '', 
      s.phone || '', 
      getFollowers(s.instagram, 'followers')?.toString() || '', 
      getFollowers(s.tiktok, 'followers')?.toString() || '', 
      getFollowers(s.youtube, 'subscribers')?.toString() || '', 
      formatDate(s.submitted_at)
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${campaign?.title}_応募者.csv`;
    link.click();
    toast({ title: 'エクスポート完了' });
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!campaign) return <div className="text-center py-12"><FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" /><p className="text-muted-foreground mb-4">案件が見つかりません</p><Button asChild><Link to="/admin/list">案件一覧へ</Link></Button></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link to="/admin/list"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold">{campaign.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={campaign.status === 'open' ? 'default' : 'secondary'}>{campaign.status === 'open' ? '募集中' : '終了'}</Badge>
              <span className="text-sm text-muted-foreground">締切: {formatDate(campaign.deadline)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyDistributionUrl}><Copy className="h-4 w-4 mr-2" />URLコピー</Button>
          <Button variant="outline" asChild><Link to={`/i/${campaign.slug}`} target="_blank"><ExternalLink className="h-4 w-4 mr-2" />プレビュー</Link></Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList><TabsTrigger value="overview">概要</TabsTrigger><TabsTrigger value="submissions">応募者 ({submissions.length})</TabsTrigger><TabsTrigger value="creators">クリエイター ({creators.length})</TabsTrigger></TabsList>
        <TabsContent value="overview" className="mt-4">
          <Card><CardHeader><CardTitle>案件情報</CardTitle></CardHeader><CardContent className="space-y-4">
            <div><div className="text-sm font-medium text-muted-foreground mb-1">概要</div><p>{campaign.summary || '未設定'}</p></div>
            <div><div className="text-sm font-medium text-muted-foreground mb-1">プラットフォーム</div><SocialIconsList platforms={campaign.platforms} /></div>
            <div className="grid grid-cols-2 gap-4"><div><div className="text-sm font-medium text-muted-foreground mb-1">作成日</div><p>{formatDate(campaign.created_at)}</p></div><div><div className="text-sm font-medium text-muted-foreground mb-1">締切日</div><p>{formatDate(campaign.deadline)}</p></div></div>
            {campaign.management_sheet_url && <div><div className="text-sm font-medium text-muted-foreground mb-1">管理シート</div><Button variant="outline" size="sm" asChild><a href={campaign.management_sheet_url} target="_blank" rel="noopener noreferrer"><FileSpreadsheet className="h-4 w-4 mr-2" />シートを開く</a></Button></div>}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="submissions" className="mt-4">
          <Card><CardHeader><div className="flex items-center justify-between"><CardTitle>応募者一覧</CardTitle><Button variant="outline" size="sm" onClick={exportToCSV}><Download className="h-4 w-4 mr-2" />CSV</Button></div></CardHeader><CardContent>
            {submissions.length === 0 ? <div className="text-center py-8"><Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" /><p className="text-muted-foreground">応募者はまだいません</p></div> : <div className="space-y-4">{submissions.map(s => {
              const igFollowers = getFollowers(s.instagram, 'followers');
              const ttFollowers = getFollowers(s.tiktok, 'followers');
              const ytSubs = getFollowers(s.youtube, 'subscribers');
              return (
                <Card key={s.id}><CardContent className="p-4"><div className="flex justify-between items-start"><div className="space-y-2"><h3 className="font-semibold">{s.influencer_name}</h3><div className="flex flex-col gap-1 text-sm text-muted-foreground"><div className="flex items-center gap-2"><Mail className="h-4 w-4" />{s.email}</div>{s.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4" />{s.phone}</div>}</div><div className="flex flex-wrap gap-2 text-sm">{igFollowers && <Badge variant="outline">IG: {igFollowers.toLocaleString()}</Badge>}{ttFollowers && <Badge variant="outline">TT: {ttFollowers.toLocaleString()}</Badge>}{ytSubs && <Badge variant="outline">YT: {ytSubs.toLocaleString()}</Badge>}</div></div><div className="text-sm text-muted-foreground">{formatDate(s.submitted_at)}</div></div></CardContent></Card>
              );
            })}</div>}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="creators" className="mt-4">
          <Card><CardHeader><CardTitle>クリエイター</CardTitle></CardHeader><CardContent>
            {creators.length === 0 ? <div className="text-center py-8"><Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" /><p className="text-muted-foreground">クリエイターはまだいません</p></div> : <div className="space-y-4">{creators.map(c => <Card key={c.id}><CardContent className="p-4"><div className="flex justify-between items-center"><div><h3 className="font-semibold">{c.name}</h3><a href={c.account_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{c.account_url}</a></div>{c.deliverable_url && <Button variant="outline" size="sm" asChild><a href={c.deliverable_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-1" />成果物</a></Button>}</div></CardContent></Card>)}</div>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignDetail;

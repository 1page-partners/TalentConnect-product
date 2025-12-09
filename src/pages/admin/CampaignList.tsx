import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { campaignApi, Campaign } from '@/lib/api';
import { Plus, Search, Calendar, Copy, Eye, Filter, Loader2, FileText, Link2, Trash2 } from 'lucide-react';
import { SocialIconsList } from '@/components/SocialIcons';
import { StatusBadge } from '@/components/ui/status-badge';

const platformOptions = [
  { value: 'all', label: 'すべて' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'TikTok', label: 'TikTok' },
  { value: 'YouTube', label: 'YouTube' },
  { value: 'RED', label: 'RED' },
];

const statusFilterOptions = [
  { value: 'all', label: 'すべて' },
  { value: 'active', label: '募集中' },
  { value: 'proposal', label: '提案中' },
  { value: 'production', label: '制作中' },
  { value: 'completed', label: '終了' },
];

const CampaignList = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const data = await campaignApi.getAll();
        setCampaigns(data);
      } catch (error) {
        console.error('キャンペーン取得エラー:', error);
        toast({ title: 'エラー', description: 'キャンペーンの取得に失敗しました', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, [toast]);

  const copyConsentUrl = (slug: string, campaignTitle: string) => {
    const url = `${window.location.origin}/i/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: '可否確認用URLをコピーしました', description: `${campaignTitle}` });
  };

  const copyDetailOnlyUrl = (slug: string, campaignTitle: string) => {
    const url = `${window.location.origin}/c/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: '詳細のみ配布用URLをコピーしました', description: `${campaignTitle}` });
  };

  const handleDelete = async (id: string, title: string) => {
    setDeletingId(id);
    try {
      await campaignApi.delete(id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
      toast({ title: '案件を削除しました', description: title });
    } catch (error) {
      console.error('削除エラー:', error);
      toast({ title: 'エラー', description: '案件の削除に失敗しました', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      // デモ案件を除外
      if (campaign.slug === 'demo-campaign') return false;
      const matchesKeyword = searchKeyword === '' || campaign.title.toLowerCase().includes(searchKeyword.toLowerCase());
      const matchesPlatform = selectedPlatform === 'all' || (campaign.platforms || []).includes(selectedPlatform);
      const matchesStatus = selectedStatus === 'all' || campaign.status === selectedStatus;
      return matchesKeyword && matchesPlatform && matchesStatus;
    });
  }, [campaigns, searchKeyword, selectedPlatform, selectedStatus]);

  // 終了タブはステータスが「completed」の案件のみ
  const openCampaigns = filteredCampaigns.filter(c => c.status !== 'completed');
  const closedCampaigns = filteredCampaigns.filter(c => c.status === 'completed');

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const CampaignCard = ({ campaign }: { campaign: Campaign }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">{campaign.title}</h3>
            {campaign.posting_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>投稿予定: {campaign.posting_date}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={campaign.status} />
            {campaign.is_closed && <Badge variant="destructive">募集停止</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2 mb-4"><SocialIconsList platforms={campaign.platforms || []} /></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/admin/campaign/${campaign.id}`}><Eye className="h-4 w-4 mr-1" />詳細</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => copyConsentUrl(campaign.slug, campaign.title)}>
            <Copy className="h-4 w-4 mr-1" />可否確認用URLコピー
          </Button>
          <Button variant="outline" size="sm" onClick={() => copyDetailOnlyUrl(campaign.slug, campaign.title)}>
            <Link2 className="h-4 w-4 mr-1" />詳細配布用URLコピー
          </Button>
          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" disabled={deletingId === campaign.id}>
                  {deletingId === campaign.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                  削除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>案件を削除しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    「{campaign.title}」を削除します。この操作は取り消せません。関連する応募データも削除される可能性があります。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(campaign.id, campaign.title)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    削除する
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">案件一覧</h1><p className="text-muted-foreground">全 {campaigns.length} 件</p></div>
        <Button asChild><Link to="/admin/new"><Plus className="h-4 w-4 mr-2" />新規作成</Link></Button>
      </div>
      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="キーワードで検索..." value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} className="pl-10" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="ステータス" /></SelectTrigger>
              <SelectContent>{statusFilterOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="プラットフォーム" /></SelectTrigger>
              <SelectContent>{platformOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </CardContent></Card>
      <Tabs defaultValue="open">
        <TabsList><TabsTrigger value="open">進行中 ({openCampaigns.length})</TabsTrigger><TabsTrigger value="closed">終了 ({closedCampaigns.length})</TabsTrigger></TabsList>
        <TabsContent value="open" className="mt-4">
          {openCampaigns.length === 0 ? <div className="text-center py-12"><FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" /><p className="text-muted-foreground">進行中の案件はありません</p></div> : <div className="grid gap-4 md:grid-cols-2">{openCampaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}</div>}
        </TabsContent>
        <TabsContent value="closed" className="mt-4">
          {closedCampaigns.length === 0 ? <div className="text-center py-12"><FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" /><p className="text-muted-foreground">終了した案件はありません</p></div> : <div className="grid gap-4 md:grid-cols-2">{closedCampaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}</div>}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignList;

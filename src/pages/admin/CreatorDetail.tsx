import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { submissionApi, creatorListApi, CreatorList, InfluencerSubmission, campaignApi, Campaign } from '@/lib/api';
import { ArrowLeft, Mail, Phone, Loader2, ExternalLink, ListPlus, Image, FileText, Download } from 'lucide-react';
import { SocialIconsList } from '@/components/SocialIcons';
import FilePreviewModal from '@/components/ui/file-preview-modal';

const CreatorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<InfluencerSubmission | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [myLists, setMyLists] = useState<CreatorList[]>([]);
  const [listItemsMap, setListItemsMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: 'image' | 'video' | 'pdf' | 'other'; name: string } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    try {
      // submissionApiには直接ID取得がないので、supabaseを直接使う
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: subData, error: subError } = await supabase
        .from('influencer_submissions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (subError) throw subError;
      setSubmission(subData);

      // キャンペーン情報を取得
      if (subData.campaign_id) {
        const campaignData = await campaignApi.getById(subData.campaign_id);
        setCampaign(campaignData);
      }

      // リスト情報を取得
      const listsData = await creatorListApi.getAll();
      setMyLists(listsData);

      const itemsMap: Record<string, string[]> = {};
      for (const list of listsData) {
        const items = await creatorListApi.getItems(list.id);
        itemsMap[list.id] = items;
      }
      setListItemsMap(itemsMap);
    } catch (error) {
      console.error('データ取得エラー:', error);
      toast({ title: 'エラー', description: 'データの取得に失敗しました', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleListItem = async (listId: string) => {
    if (!submission) return;
    const currentItems = listItemsMap[listId] || [];
    const isInList = currentItems.includes(submission.id);
    
    try {
      if (isInList) {
        await creatorListApi.removeItem(listId, submission.id);
        setListItemsMap(prev => ({
          ...prev,
          [listId]: prev[listId].filter(itemId => itemId !== submission.id)
        }));
        toast({ title: 'リストから削除しました' });
      } else {
        await creatorListApi.addItem(listId, submission.id);
        setListItemsMap(prev => ({
          ...prev,
          [listId]: [...(prev[listId] || []), submission.id]
        }));
        toast({ title: 'リストに追加しました' });
      }
    } catch (error) {
      console.error('リストアイテム操作エラー:', error);
      toast({ title: 'エラー', description: '操作に失敗しました', variant: 'destructive' });
    }
  };

  const getFollowers = (data: any, key: string): number | null => {
    if (!data || typeof data !== 'object') return null;
    return data[key] ?? null;
  };

  const getAccountUrl = (data: any): string | null => {
    if (!data || typeof data !== 'object') return null;
    return data.account_url || data.url || null;
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });

  const getFileType = (url: string): 'image' | 'video' | 'pdf' | 'other' => {
    const urlWithoutQuery = url.split('?')[0];
    const extension = urlWithoutQuery.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
    if (['mp4', 'mov', 'avi', 'webm'].includes(extension)) return 'video';
    if (extension === 'pdf') return 'pdf';
    return 'other';
  };

  const getFileName = (url: string): string => {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    try {
      return decodeURIComponent(filename.split('?')[0]);
    } catch {
      return filename.split('?')[0];
    }
  };

  const openPreview = (url: string) => {
    const fileType = getFileType(url);
    const fileName = getFileName(url);
    setPreviewFile({ url, type: fileType, name: fileName });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!submission) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground mb-4">クリエイターが見つかりません</p>
        <Button asChild><Link to="/admin/creators">クリエイターリストへ</Link></Button>
      </div>
    );
  }

  const igFollowers = getFollowers(submission.instagram, 'followers');
  const ttFollowers = getFollowers(submission.tiktok, 'followers');
  const ytSubs = getFollowers(submission.youtube, 'subscribers');
  const redFollowers = getFollowers(submission.red, 'followers');

  const igUrl = getAccountUrl(submission.instagram);
  const ttUrl = getAccountUrl(submission.tiktok);
  const ytUrl = getAccountUrl(submission.youtube);
  const redUrl = getAccountUrl(submission.red);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/creators"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{submission.influencer_name}</h1>
            <p className="text-muted-foreground">応募日: {formatDate(submission.submitted_at)}</p>
          </div>
        </div>
        {myLists.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ListPlus className="h-4 w-4 mr-2" />
                リストへ追加
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {myLists.map(list => (
                <DropdownMenuItem key={list.id} onClick={() => handleToggleListItem(list.id)}>
                  <Checkbox checked={listItemsMap[list.id]?.includes(submission.id)} className="mr-2" />
                  {list.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 基本情報 */}
        <Card>
          <CardHeader><CardTitle>基本情報</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">名前</div>
                <p>{submission.influencer_name}</p>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">ステータス</div>
                <Badge variant={submission.status === 'pending' ? 'secondary' : 'default'}>{submission.status}</Badge>
              </div>
            </div>
            {submission.email && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">メールアドレス</div>
                <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{submission.email}</p>
              </div>
            )}
            {submission.phone && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">電話番号</div>
                <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{submission.phone}</p>
              </div>
            )}
            {submission.contact_email && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">連絡先メール</div>
                <p>{submission.contact_email}</p>
              </div>
            )}
            {submission.preferred_fee && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">希望報酬</div>
                <p className="font-semibold text-primary">{submission.preferred_fee}</p>
              </div>
            )}
            {submission.notes && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">備考</div>
                <p className="whitespace-pre-wrap">{submission.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 応募案件 */}
        <Card>
          <CardHeader><CardTitle>応募案件</CardTitle></CardHeader>
          <CardContent>
            {campaign ? (
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">案件名</div>
                  <Link to={`/admin/campaign/${campaign.id}`} className="text-primary hover:underline flex items-center gap-1">
                    {campaign.title}
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">クライアント</div>
                  <p>{campaign.client_name}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">締切</div>
                  <p>{formatDate(campaign.deadline)}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">案件情報が取得できません</p>
            )}
          </CardContent>
        </Card>

        {/* SNSアカウント情報 */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>SNSアカウント情報</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {submission.instagram && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <SocialIconsList platforms={['Instagram']} />
                    <span className="font-medium">Instagram</span>
                  </div>
                  {igFollowers && <p className="text-lg font-semibold">{igFollowers.toLocaleString()} フォロワー</p>}
                  {igUrl && <a href={igUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">{igUrl}</a>}
                </div>
              )}
              {submission.tiktok && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <SocialIconsList platforms={['TikTok']} />
                    <span className="font-medium">TikTok</span>
                  </div>
                  {ttFollowers && <p className="text-lg font-semibold">{ttFollowers.toLocaleString()} フォロワー</p>}
                  {ttUrl && <a href={ttUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">{ttUrl}</a>}
                </div>
              )}
              {submission.youtube && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <SocialIconsList platforms={['YouTube']} />
                    <span className="font-medium">YouTube</span>
                  </div>
                  {ytSubs && <p className="text-lg font-semibold">{ytSubs.toLocaleString()} 登録者</p>}
                  {ytUrl && <a href={ytUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">{ytUrl}</a>}
                </div>
              )}
              {submission.red && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <SocialIconsList platforms={['RED']} />
                    <span className="font-medium">RED</span>
                  </div>
                  {redFollowers && <p className="text-lg font-semibold">{redFollowers.toLocaleString()} フォロワー</p>}
                  {redUrl && <a href={redUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">{redUrl}</a>}
                </div>
              )}
              {submission.other_platforms && (
                <div className="p-4 border rounded-lg sm:col-span-2 lg:col-span-4">
                  <div className="font-medium mb-2">その他プラットフォーム</div>
                  <p className="whitespace-pre-wrap">{submission.other_platforms}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* インサイトスクリーンショット */}
        {submission.follower_insight_screenshot && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Image className="h-5 w-5" />フォロワーインサイト</CardTitle></CardHeader>
            <CardContent>
              <div 
                className="relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                onClick={() => openPreview(submission.follower_insight_screenshot!)}
              >
                <img src={submission.follower_insight_screenshot} alt="フォロワーインサイト" className="w-full h-full object-contain" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ポートフォリオファイル */}
        {submission.portfolio_files && submission.portfolio_files.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />ポートフォリオ</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {submission.portfolio_files.map((fileUrl, index) => {
                  const fileType = getFileType(fileUrl);
                  const fileName = getFileName(fileUrl);
                  return (
                    <div 
                      key={index}
                      className="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer group hover:ring-2 hover:ring-primary/50 transition-all"
                      onClick={() => openPreview(fileUrl)}
                    >
                      {fileType === 'image' ? (
                        <img src={fileUrl} alt={`ポートフォリオ ${index + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{fileType.toUpperCase()}</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
                        <span className="text-[10px] text-white/90 truncate block">{fileName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ファイルプレビューモーダル */}
      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url || ''}
        fileType={previewFile?.type || 'other'}
        fileName={previewFile?.name}
      />
    </div>
  );
};

export default CreatorDetail;
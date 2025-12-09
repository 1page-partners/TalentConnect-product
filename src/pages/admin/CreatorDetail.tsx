import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { submissionApi, creatorListApi, CreatorList, InfluencerSubmission, campaignApi, Campaign } from '@/lib/api';
import { ArrowLeft, Mail, Phone, Loader2, ExternalLink, ListPlus, Image, FileText, Download, Trash2 } from 'lucide-react';
import { SocialIconsList } from '@/components/SocialIcons';
import FilePreviewModal from '@/components/ui/file-preview-modal';

interface SubmissionWithCampaign extends InfluencerSubmission {
  campaign?: Campaign | null;
}

const CreatorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<InfluencerSubmission | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<SubmissionWithCampaign[]>([]);
  const [myLists, setMyLists] = useState<CreatorList[]>([]);
  const [listItemsMap, setListItemsMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: 'image' | 'video' | 'pdf' | 'other'; name: string } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: subData, error: subError } = await supabase
        .from('influencer_submissions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (subError) throw subError;
      setSubmission(subData);

      // 同じインフルエンサー名のすべての応募を取得
      const { data: allSubs } = await supabase
        .from('influencer_submissions')
        .select('*')
        .eq('name', subData.name)
        .order('created_at', { ascending: false });

      // 各応募のキャンペーン情報を取得
      const subsWithCampaigns: SubmissionWithCampaign[] = [];
      for (const sub of allSubs || []) {
        let campaign: Campaign | null = null;
        if (sub.campaign_id) {
          try {
            campaign = await campaignApi.getById(sub.campaign_id);
          } catch (e) {
            console.error('キャンペーン取得エラー:', e);
          }
        }
        subsWithCampaigns.push({ ...sub, campaign });
      }
      setAllSubmissions(subsWithCampaigns);

      // リスト情報を取得（テーブルが存在しない場合はスキップ）
      let listsData: CreatorList[] = [];
      try {
        listsData = await creatorListApi.getAll();
      } catch (error) {
        console.error('リストデータ取得エラー（テーブルが存在しない可能性）:', error);
      }
      setMyLists(listsData);

      const itemsMap: Record<string, string[]> = {};
      for (const list of listsData) {
        try {
          const items = await creatorListApi.getItems(list.id);
          itemsMap[list.id] = items;
        } catch (error) {
          console.error(`リストアイテム取得エラー（list_id: ${list.id}）:`, error);
          itemsMap[list.id] = [];
        }
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

  const handleDelete = async () => {
    if (!submission) return;
    setDeleting(true);
    try {
      await submissionApi.delete(submission.id);
      toast({ title: '削除しました', description: 'クリエイター情報を削除しました' });
      navigate('/admin/creators');
    } catch (error) {
      console.error('削除エラー:', error);
      toast({ title: 'エラー', description: '削除に失敗しました', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const getFollowers = (data: any, key: string): number | null => {
    if (!data || typeof data !== 'object') return null;
    return data[key] ?? null;
  };

  const getAccountHandle = (data: any): string | null => {
    if (!data || typeof data !== 'object') return null;
    return data.url || data.handle || data.account_url || null;
  };

  const formatContactMethod = (method: string): string => {
    const map: Record<string, string> = {
      'email': 'メール',
      'phone': '電話',
      'instagram': 'Instagram DM',
      'tiktok': 'TikTok DM',
      'x': 'X DM',
      'line': 'LINE',
      'other': 'その他'
    };
    return map[method] || method;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">採用</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">不採用</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary">提案中</Badge>;
    }
  };

  const hasSnsData = (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    const url = data.url || data.handle || data.account_url;
    return !!url;
  };

  const buildPlatformUrl = (platform: string, handle: string | null): string | null => {
    if (!handle) return null;
    // Remove @ if present
    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
    
    switch (platform) {
      case 'instagram':
        return `https://instagram.com/${cleanHandle}`;
      case 'tiktok':
        return `https://tiktok.com/@${cleanHandle}`;
      case 'youtube':
        // If it's already a URL, return as-is
        if (handle.includes('youtube.com') || handle.includes('youtu.be')) return handle;
        return `https://youtube.com/${cleanHandle}`;
      case 'x':
        return `https://x.com/${cleanHandle}`;
      default:
        return null;
    }
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

  const igHandle = submission.instagram;
  const ttHandle = submission.tiktok;
  const ytHandle = submission.youtube;
  const redHandle = submission.red;
  const xHandle = submission.x_twitter;

  const igUrl = buildPlatformUrl('instagram', igHandle);
  const ttUrl = buildPlatformUrl('tiktok', ttHandle);
  const ytUrl = buildPlatformUrl('youtube', ytHandle);
  const xUrl = buildPlatformUrl('x', xHandle);

  // other_sns をパース
  const parseOtherPlatforms = (): Array<{platform: string; url: string}> => {
    if (!submission.other_sns) return [];
    try {
      if (Array.isArray(submission.other_sns)) {
        return submission.other_sns as Array<{platform: string; url: string}>;
      }
      return [];
    } catch {
      return [];
    }
  };
  const otherPlatforms = parseOtherPlatforms();

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/creators"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{submission.name}</h1>
            <p className="text-muted-foreground">応募日: {formatDate(submission.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                削除
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>クリエイター情報を削除</DialogTitle>
                <DialogDescription>
                  「{submission.name}」の情報を削除します。この操作は取り消せません。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button variant="outline">キャンセル</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  削除する
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 基本情報 */}
        <Card>
          <CardHeader><CardTitle>基本情報</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">名前</div>
              <p>{submission.name}</p>
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
            {submission.desired_fee && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">希望報酬</div>
                <p className="font-semibold text-primary">{submission.desired_fee}</p>
              </div>
            )}
            {submission.preferred_contact && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">連絡手段</div>
                <Badge variant="outline">{formatContactMethod(submission.preferred_contact)}</Badge>
              </div>
            )}
            {submission.line_id && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">LINE ID</div>
                <p>{submission.line_id}</p>
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

        {/* 案件応募実績 */}
        <Card>
          <CardHeader><CardTitle>案件応募実績</CardTitle></CardHeader>
          <CardContent>
            {allSubmissions.length > 0 ? (
              <div className="divide-y">
                {allSubmissions.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      {sub.campaign ? (
                        <Link 
                          to={`/admin/campaign/${sub.campaign.id}`}
                          className="font-medium text-primary hover:underline truncate block"
                        >
                          {sub.campaign.title}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">案件情報なし</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-nowrap hidden sm:block">
                      {sub.campaign?.client_name || '-'}
                    </div>
                    <div className="flex items-center gap-1 hidden md:flex">
                      {sub.campaign?.target_platforms && sub.campaign.target_platforms.length > 0 && (
                        <SocialIconsList platforms={sub.campaign.target_platforms} />
                      )}
                    </div>
                    {getStatusBadge(sub.status || 'pending')}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">応募実績がありません</p>
            )}
          </CardContent>
        </Card>

        {/* SNSアカウント情報 */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>SNSアカウント情報</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {hasSnsData(submission.instagram) && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <SocialIconsList platforms={['Instagram']} />
                    <span className="font-medium">Instagram</span>
                  </div>
                  {igHandle && (
                    igUrl ? (
                      <a href={igUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        @{igHandle.replace(/^@/, '')}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <p className="text-sm">@{igHandle.replace(/^@/, '')}</p>
                    )
                  )}
                </div>
              )}
              {hasSnsData(submission.tiktok) && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <SocialIconsList platforms={['TikTok']} />
                    <span className="font-medium">TikTok</span>
                  </div>
                  {ttHandle && (
                    ttUrl ? (
                      <a href={ttUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        @{ttHandle.replace(/^@/, '')}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <p className="text-sm">@{ttHandle.replace(/^@/, '')}</p>
                    )
                  )}
                </div>
              )}
              {hasSnsData(submission.youtube) && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <SocialIconsList platforms={['YouTube']} />
                    <span className="font-medium">YouTube</span>
                  </div>
                  {ytHandle && (
                    ytUrl ? (
                      <a href={ytUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 break-all">
                        {ytHandle}
                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                      </a>
                    ) : (
                      <p className="text-sm break-all">{ytHandle}</p>
                    )
                  )}
                </div>
              )}
              {hasSnsData(submission.red) && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <SocialIconsList platforms={['RED']} />
                    <span className="font-medium">RED</span>
                  </div>
                  {redHandle && <p className="text-sm">{redHandle}</p>}
                </div>
              )}
              {xHandle && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <SocialIconsList platforms={['X']} />
                    <span className="font-medium">X</span>
                  </div>
                  {xUrl ? (
                    <a href={xUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      @{xHandle.replace(/^@/, '')}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <p className="text-sm">@{xHandle.replace(/^@/, '')}</p>
                  )}
                </div>
              )}
              {otherPlatforms.length > 0 && (
                <div className="p-4 border rounded-lg sm:col-span-2 lg:col-span-4">
                  <div className="font-medium mb-2">その他プラットフォーム</div>
                  <div className="space-y-2">
                    {otherPlatforms.map((p, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-medium">{p.platform}:</span> {p.url}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!hasSnsData(submission.instagram) && !hasSnsData(submission.tiktok) && !hasSnsData(submission.youtube) && !hasSnsData(submission.red) && !xHandle && otherPlatforms.length === 0 && (
                <p className="text-muted-foreground col-span-full">SNSアカウント情報がありません</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* インサイトスクリーンショット */}
        {submission.insight_screenshots && submission.insight_screenshots.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Image className="h-5 w-5" />フォロワーインサイト</CardTitle></CardHeader>
            <CardContent>
              <div 
                className="relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                onClick={() => openPreview(submission.insight_screenshots![0])}
              >
                <img src={submission.insight_screenshots[0]} alt="フォロワーインサイト" className="w-full h-full object-contain" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ポートフォリオファイル */}
        {submission.portfolio_urls && submission.portfolio_urls.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />ポートフォリオ</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {submission.portfolio_urls.map((fileUrl, index) => {
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
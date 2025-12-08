import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { campaignApi, submissionApi, Campaign, InfluencerSubmission } from '@/lib/api';
import { ArrowLeft, Copy, ExternalLink, Download, FileSpreadsheet, Users, Mail, Phone, Loader2, FileText, Image, File, Play, Maximize2, Pencil } from 'lucide-react';
import { SocialIconsList } from '@/components/SocialIcons';
import FilePreviewModal from '@/components/ui/file-preview-modal';
import PdfThumbnail from '@/components/ui/pdf-thumbnail';

// ファイルタイプを判定するヘルパー関数
const getFileType = (url: string): 'image' | 'video' | 'pdf' | 'other' => {
  const urlWithoutQuery = url.split('?')[0];
  const extension = urlWithoutQuery.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
  if (['mp4', 'mov', 'avi', 'webm'].includes(extension)) return 'video';
  if (extension === 'pdf') return 'pdf';
  return 'other';
};

// ファイル名を取得するヘルパー関数
const getFileName = (url: string): string => {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  try {
    return decodeURIComponent(filename.split('?')[0]);
  } catch {
    return filename.split('?')[0];
  }
};

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [submissions, setSubmissions] = useState<InfluencerSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [previewFile, setPreviewFile] = useState<{ url: string; type: 'image' | 'video' | 'pdf' | 'other'; name: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [campaignData, submissionsData] = await Promise.all([
          campaignApi.getById(id), submissionApi.getByCampaignId(id)
        ]);
        setCampaign(campaignData);
        setSubmissions(submissionsData);
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

  const openPreview = (url: string) => {
    const fileType = getFileType(url);
    const fileName = getFileName(url);
    setPreviewFile({ url, type: fileType, name: fileName });
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
      s.name, 
      s.email || '', 
      s.phone || '', 
      s.instagram || '', 
      s.tiktok || '', 
      s.youtube || '', 
      formatDate(s.created_at)
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link to="/admin/list"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold">{campaign.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>{campaign.status === 'active' ? '募集中' : '終了'}</Badge>
              {campaign.posting_date && <span className="text-sm text-muted-foreground">投稿予定: {campaign.posting_date}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="default" asChild><Link to={`/admin/campaign/${id}/edit`}><Pencil className="h-4 w-4 mr-2" />編集</Link></Button>
          <Button variant="outline" onClick={copyDistributionUrl}><Copy className="h-4 w-4 mr-2" />URLコピー</Button>
          <Button variant="outline" asChild><Link to={`/preview/i/${campaign.slug}`} target="_blank"><ExternalLink className="h-4 w-4 mr-2" />プレビュー</Link></Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="submissions">応募者 ({submissions.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card><CardHeader><CardTitle>案件情報</CardTitle></CardHeader><CardContent className="space-y-4">
            <div><div className="text-sm font-medium text-muted-foreground mb-1">概要</div><p>{campaign.description || '未設定'}</p></div>
            <div><div className="text-sm font-medium text-muted-foreground mb-1">プラットフォーム</div><SocialIconsList platforms={campaign.target_platforms || []} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><div className="text-sm font-medium text-muted-foreground mb-1">作成日</div><p>{formatDate(campaign.created_at)}</p></div>{campaign.posting_date && <div><div className="text-sm font-medium text-muted-foreground mb-1">投稿予定日</div><p>{campaign.posting_date}</p></div>}</div>
            {campaign.management_sheet_url && <div><div className="text-sm font-medium text-muted-foreground mb-1">管理シート</div><Button variant="outline" size="sm" asChild><a href={campaign.management_sheet_url} target="_blank" rel="noopener noreferrer"><FileSpreadsheet className="h-4 w-4 mr-2" />シートを開く</a></Button></div>}
          </CardContent></Card>
          
          {/* 画像資料 */}
          {campaign.image_materials && campaign.image_materials.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />画像資料
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {campaign.image_materials.map((imageUrl, index) => {
                    const fileType = getFileType(imageUrl);
                    const fileName = getFileName(imageUrl);
                    return (
                      <div 
                        key={index} 
                        className="relative aspect-square bg-muted rounded-lg overflow-hidden border cursor-pointer group hover:ring-2 hover:ring-primary/50 transition-all"
                        onClick={() => openPreview(imageUrl)}
                      >
                        {fileType === 'image' ? (
                          <img src={imageUrl} alt={`画像資料 ${index + 1}`} className="w-full h-full object-cover" />
                        ) : fileType === 'video' ? (
                          <>
                            <video src={imageUrl} className="w-full h-full object-cover" muted />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Play className="w-8 h-8 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Maximize2 className="w-5 h-5 text-white" />
                        </div>
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
          
          {/* 添付資料 */}
          {campaign.attachments && campaign.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <File className="h-5 w-5" />添付資料
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {campaign.attachments.map((attachmentUrl, index) => {
                    const fileType = getFileType(attachmentUrl);
                    const fileName = getFileName(attachmentUrl);
                    return (
                      <div 
                        key={index} 
                        className="relative aspect-square bg-muted rounded-lg overflow-hidden border cursor-pointer group hover:ring-2 hover:ring-primary/50 transition-all"
                        onClick={() => openPreview(attachmentUrl)}
                      >
                        {fileType === 'image' ? (
                          <img src={attachmentUrl} alt={`添付資料 ${index + 1}`} className="w-full h-full object-cover" />
                        ) : fileType === 'video' ? (
                          <>
                            <video src={attachmentUrl} className="w-full h-full object-cover" muted />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Play className="w-8 h-8 text-white" />
                            </div>
                          </>
                        ) : fileType === 'pdf' ? (
                          <PdfThumbnail url={attachmentUrl} className="w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">ファイル</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Maximize2 className="w-5 h-5 text-white" />
                        </div>
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
        </TabsContent>
        <TabsContent value="submissions" className="mt-4">
          <Card><CardHeader><div className="flex items-center justify-between flex-wrap gap-2"><CardTitle>応募者一覧</CardTitle><Button variant="outline" size="sm" onClick={exportToCSV}><Download className="h-4 w-4 mr-2" />CSV</Button></div></CardHeader><CardContent>
            {submissions.length === 0 ? <div className="text-center py-8"><Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" /><p className="text-muted-foreground">応募者はまだいません</p></div> : <div className="space-y-4">{submissions.map(s => {
              return (
                <Card key={s.id}><CardContent className="p-4"><div className="flex flex-col sm:flex-row justify-between items-start gap-2"><div className="space-y-2"><h3 className="font-semibold">{s.name}</h3><div className="flex flex-col gap-1 text-sm text-muted-foreground"><div className="flex items-center gap-2"><Mail className="h-4 w-4" />{s.email}</div>{s.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4" />{s.phone}</div>}</div><div className="flex flex-wrap gap-2 text-sm">{s.instagram && <Badge variant="outline">IG: {s.instagram}</Badge>}{s.tiktok && <Badge variant="outline">TT: {s.tiktok}</Badge>}{s.youtube && <Badge variant="outline">YT: {s.youtube}</Badge>}</div></div><div className="text-sm text-muted-foreground">{formatDate(s.created_at)}</div></div></CardContent></Card>
              );
            })}</div>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* プレビューモーダル */}
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

export default CampaignDetail;

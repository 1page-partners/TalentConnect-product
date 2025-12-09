import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { campaignApi, Campaign } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SocialIcon } from "@/components/SocialIcons";
import { Loader2, Calendar, AlertCircle, Image, File, FileText, Play, Maximize2, Eye } from "lucide-react";
import FilePreviewModal from "@/components/ui/file-preview-modal";
import PdfThumbnail from "@/components/ui/pdf-thumbnail";

// ファイルタイプを判定するヘルパー関数
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

const CampaignDetailOnly = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isPreview = location.pathname.startsWith('/preview/');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: 'image' | 'video' | 'pdf' | 'other'; name: string } | null>(null);

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

  const openPreview = (url: string) => {
    const fileType = getFileType(url);
    const fileName = getFileName(url);
    setPreviewFile({ url, type: fileType, name: fileName });
  };

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

  const platforms = campaign.target_platforms || [];
  const platformDeliverables = (campaign.deliverables && typeof campaign.deliverables === 'object') 
    ? campaign.deliverables as Record<string, string[]> 
    : null;
  const secondaryUsage = campaign.secondary_usage === true
    ? { hasUsage: true, duration: campaign.secondary_usage_period || undefined, purpose: campaign.secondary_usage_purpose || undefined }
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* プレビューバナー */}
      {isPreview && (
        <div className="bg-amber-500 text-white py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2">
          <Eye className="w-4 h-4" />
          プレビューモード
        </div>
      )}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={campaign.status === 'open' ? 'default' : 'secondary'}>
                {campaign.status === 'open' ? '募集中' : '募集終了'}
              </Badge>
            </div>
            <CardTitle className="text-2xl">{campaign.title}</CardTitle>
            <p className="text-muted-foreground">{campaign.client_name}</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 概要 */}
            <div>
              <h3 className="font-semibold mb-2">概要</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{campaign.description}</p>
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
                
                {platformDeliverables && typeof platformDeliverables === 'object' && Object.keys(platformDeliverables).length > 0 && (
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


            {/* スケジュール */}
            <div className="space-y-2">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                スケジュール
              </h3>
              <div className="space-y-1">
                {campaign.deadline && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">締め切り日:</span>
                    <span className="font-semibold text-destructive">{campaign.deadline}</span>
                  </div>
                )}
                {campaign.posting_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">投稿予定日:</span>
                    <span>{campaign.posting_date}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 納品物条件 */}
            <div className="space-y-2">
              <h3 className="font-semibold mb-2">納品物条件</h3>
              <div className="flex flex-wrap gap-2">
                {campaign.shooting_only === true && (
                  <Badge variant="outline">撮影のみ</Badge>
                )}
                {campaign.editing_only === true && (
                  <Badge variant="outline">編集のみ</Badge>
                )}
                {campaign.shooting_and_editing === true && (
                  <Badge variant="outline">撮影＆編集の制作のみ</Badge>
                )}
                {campaign.tieup_post_production === true && (
                  <Badge variant="outline">タイアップ投稿の制作</Badge>
                )}
                {campaign.video_production_only === true && (
                  <Badge variant="outline">納品動画の制作のみ</Badge>
                )}
                {campaign.ad_appearance === true && (
                  <Badge variant="outline">広告出演あり</Badge>
                )}
              </div>
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
            {campaign.ng_items && (
              <div>
                <h3 className="font-semibold mb-2 text-destructive">NG事項・制約</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{campaign.ng_items}</p>
              </div>
            )}

            {/* 画像資料 */}
            {campaign.image_materials && campaign.image_materials.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  画像資料
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {campaign.image_materials.map((imageUrl, index) => {
                    const fileType = getFileType(imageUrl);
                    return (
                      <div 
                        key={index} 
                        className="relative aspect-video bg-muted rounded-lg overflow-hidden border cursor-pointer group"
                        onClick={() => openPreview(imageUrl)}
                      >
                        {fileType === 'image' ? (
                          <img 
                            src={imageUrl} 
                            alt={`画像資料 ${index + 1}`}
                            className="w-full h-full object-cover select-none"
                            onContextMenu={(e) => e.preventDefault()}
                            draggable={false}
                          />
                        ) : fileType === 'video' ? (
                          <>
                            <video 
                              src={imageUrl}
                              className="w-full h-full object-cover"
                              muted
                              onContextMenu={(e) => e.preventDefault()}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Play className="w-10 h-10 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Maximize2 className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 添付資料 */}
            {campaign.attachments && campaign.attachments.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <File className="w-4 h-4" />
                  添付資料
                </h3>
                <div className="space-y-3">
                  {campaign.attachments.map((attachmentUrl, index) => {
                    const fileType = getFileType(attachmentUrl);
                    const fileName = getFileName(attachmentUrl);
                    return (
                      <div 
                        key={index} 
                        className="border rounded-lg overflow-hidden cursor-pointer group"
                        onClick={() => openPreview(attachmentUrl)}
                      >
                        {fileType === 'image' ? (
                          <div className="relative">
                            <img 
                              src={attachmentUrl} 
                              alt={`添付資料 ${index + 1}`}
                              className="w-full max-h-[300px] object-contain bg-muted select-none"
                              onContextMenu={(e) => e.preventDefault()}
                              draggable={false}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Maximize2 className="w-8 h-8 text-white" />
                            </div>
                            <div className="p-2 bg-muted/50 border-t">
                              <span className="text-xs text-muted-foreground truncate block">{fileName}</span>
                            </div>
                          </div>
                        ) : fileType === 'video' ? (
                          <div className="relative">
                            <video 
                              src={attachmentUrl}
                              className="w-full max-h-[300px]"
                              onContextMenu={(e) => e.preventDefault()}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                              <Play className="w-12 h-12 text-white" />
                            </div>
                            <div className="p-2 bg-muted/50 border-t">
                              <span className="text-xs text-muted-foreground truncate block">{fileName}</span>
                            </div>
                          </div>
                        ) : fileType === 'pdf' ? (
                          <div className="relative">
                            <PdfThumbnail url={attachmentUrl} className="w-full h-[150px]" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded">クリックして表示</span>
                            </div>
                            <div className="p-2 bg-muted/50 border-t">
                              <span className="text-xs text-muted-foreground truncate block">{fileName}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-3 bg-muted/30">
                            <FileText className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">{fileName}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Powered by TalentConnect
        </p>
      </main>

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

export default CampaignDetailOnly;

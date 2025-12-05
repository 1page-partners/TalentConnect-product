import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SocialIconsList } from "@/components/SocialIcons";
import { Calendar, FileText, AlertTriangle, Image, File, FileImage, Play, Maximize2 } from "lucide-react";
import { Campaign } from "@/lib/mock-data";
import FilePreviewModal from "@/components/ui/file-preview-modal";
import PdfThumbnail from "@/components/ui/pdf-thumbnail";

interface CampaignDetailCardProps {
  campaign: Campaign;
}

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

const CampaignDetailCard = ({ campaign }: CampaignDetailCardProps) => {
  const [previewFile, setPreviewFile] = useState<{ url: string; type: 'image' | 'video' | 'pdf' | 'other'; name: string } | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const openPreview = (url: string) => {
    const fileType = getFileType(url);
    const fileName = getFileName(url);
    setPreviewFile({ url, type: fileType, name: fileName });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl font-semibold text-foreground pr-4">
              {campaign.title}
            </CardTitle>
            <Badge variant={campaign.status === 'open' ? 'default' : 'secondary'}>
              {campaign.status === 'open' ? '募集中' : '募集終了'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* クライアント・案件種別 */}
          {(campaign.clientName || campaign.isTH) && (
            <div className="flex flex-wrap gap-4">
              {campaign.clientName && (
                <div>
                  <h3 className="font-medium text-foreground mb-1">クライアント</h3>
                  <Badge variant="outline">{campaign.clientName}</Badge>
                </div>
              )}
              {campaign.isTH && (
                <div>
                  <h3 className="font-medium text-foreground mb-1">案件種別</h3>
                  <Badge variant="secondary">TH案件</Badge>
                </div>
              )}
            </div>
          )}

          {/* 概要 */}
          <div>
            <h3 className="font-medium text-foreground mb-2">案件概要</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {campaign.summary}
            </p>
          </div>

          {/* 画像資料 */}
          {campaign.imageMaterials && campaign.imageMaterials.length > 0 && (
            <div>
              <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <Image className="w-4 h-4" />
                画像資料
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {campaign.imageMaterials.map((imageUrl, index) => {
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
                          <FileImage className="w-8 h-8 text-muted-foreground" />
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

          {/* プラットフォーム・成果物 */}
          <div>
            <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
              対象SNS・成果物
              <SocialIconsList platforms={campaign.platforms} className="flex gap-1" />
            </h3>
            <div className="space-y-2">
              {campaign.platforms.map((platform) => (
                <div key={platform} className="flex items-center gap-2">
                  <Badge variant="outline">{platform}</Badge>
                  {campaign.platformDeliverables?.[platform] && (
                    <div className="flex flex-wrap gap-1">
                      {campaign.platformDeliverables[platform].map((deliverable) => (
                        <Badge key={deliverable} variant="secondary" className="text-xs">
                          {deliverable}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {campaign.isVideoProductionOnly && (
                <div className="mt-2">
                  <Badge variant="outline" className="bg-info/10 text-info border-info">
                    納品動画の制作のみ
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* 成果物・条件 */}
          {campaign.requirements && (
            <div>
              <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                成果物・条件
              </h3>
              <div className="bg-muted/30 p-4 rounded-md">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                  {campaign.requirements}
                </pre>
              </div>
            </div>
          )}

          {/* スケジュール */}
          <div>
            <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              スケジュール
            </h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">締切日:</span>
                <span className="font-semibold text-destructive">
                  {formatDate(campaign.deadline)}
                </span>
              </div>
              {campaign.plannedPostDate && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">投稿予定:</span>
                  <span className="text-sm">{campaign.plannedPostDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* NG事項・制約 */}
          {campaign.restrictions && (
            <div>
              <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                NG事項・制約
              </h3>
              <div className="bg-warning/10 border border-warning/20 p-4 rounded-md">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                  {campaign.restrictions}
                </pre>
              </div>
            </div>
          )}

          {/* 添付資料 */}
          {campaign.attachments && campaign.attachments.length > 0 && (
            <div>
              <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
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
                          <PdfThumbnail 
                            url={attachmentUrl} 
                            className="w-full h-[150px]"
                          />
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

          {/* 契約条件 */}
          {(campaign.isVideoProductionOnly || campaign.secondaryUsage?.hasUsage || campaign.hasAdvertisementAppearance) && (
            <div>
              <h3 className="font-medium text-foreground mb-2">契約条件</h3>
              <div className="space-y-1">
                {campaign.isVideoProductionOnly && (
                  <Badge variant="outline">納品動画制作のみ</Badge>
                )}
                {campaign.secondaryUsage?.hasUsage && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">二次利用あり</Badge>
                    <span className="text-xs text-muted-foreground">
                      ({campaign.secondaryUsage.duration} - {campaign.secondaryUsage.purpose})
                    </span>
                  </div>
                )}
                {campaign.hasAdvertisementAppearance && (
                  <Badge variant="outline">広告出演あり</Badge>
                )}
              </div>
            </div>
          )}

          {/* 連絡先 */}
          {campaign.contactEmail && (
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground">
                お問い合わせ: {campaign.contactEmail}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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

export default CampaignDetailCard;

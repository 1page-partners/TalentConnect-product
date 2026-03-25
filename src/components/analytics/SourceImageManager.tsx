import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFileUpload } from "@/hooks/useFileUpload";
import { analyticsApi, type AnalyticsReport } from "@/lib/analytics-api";
import {
  Image as ImageIcon, RefreshCw, Loader2,
  Eye, ThumbsUp, Globe, Users, Monitor, BarChart3, MousePointerClick,
  Upload, Plus,
} from "lucide-react";

const CATEGORY_META: Record<string, { label: string; icon: typeof Eye; color: string }> = {
  overview: { label: "概要", icon: Eye, color: "#1a73e8" },
  engagement: { label: "エンゲージメント", icon: ThumbsUp, color: "#34a853" },
  traffic: { label: "トラフィック", icon: Globe, color: "#fa7b17" },
  search_terms: { label: "検索語句", icon: MousePointerClick, color: "#1a73e8" },
  audience: { label: "視聴者属性", icon: Users, color: "#a142f4" },
  geography: { label: "地域", icon: Globe, color: "#24c1e0" },
  devices: { label: "デバイス", icon: Monitor, color: "#ea4335" },
  comments: { label: "コメント", icon: BarChart3, color: "#f538a0" },
};

interface SourceImageManagerProps {
  report: AnalyticsReport;
  onReanalyze: () => void;
  reanalyzing: boolean;
  onUpdate: () => void;
}

interface SelectedImage {
  url: string;
  index: number;
  category: string | null;
}

export default function SourceImageManager({
  report,
  onReanalyze,
  reanalyzing,
  onUpdate,
}: SourceImageManagerProps) {
  const { toast } = useToast();
  const { uploadFiles, isUploading } = useFileUpload({ folder: "analytics" });
  const [replacingCategory, setReplacingCategory] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [replacingInModal, setReplacingInModal] = useState(false);
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addTargetCategory, setAddTargetCategory] = useState<string>("overview");

  const categoryImages: Record<string, string[]> = (report as any).category_images || {};
  const hasCategoryMapping = Object.keys(categoryImages).some(
    (k) => categoryImages[k]?.length > 0
  );

  // Build reverse lookup: url → category
  const urlToCategory: Record<string, string> = {};
  if (hasCategoryMapping) {
    for (const [cat, urls] of Object.entries(categoryImages)) {
      for (const url of urls || []) {
        urlToCategory[url] = cat;
      }
    }
  }

  const handleReplaceFiles = async (category: string, files: FileList) => {
    setReplacingCategory(category);
    try {
      const urls = await uploadFiles(files);
      if (urls.length === 0) return;

      const updatedCategoryImages = { ...categoryImages, [category]: urls };
      const allSourceImages = Object.entries(updatedCategoryImages)
        .filter(([k]) => k !== "comments")
        .flatMap(([, v]) => v || []);
      const commentImages = updatedCategoryImages.comments || report.comment_images || [];

      await analyticsApi.update(report.id, {
        category_images: updatedCategoryImages,
        source_images: allSourceImages,
        comment_images: commentImages,
      } as any);

      toast({ title: `${CATEGORY_META[category]?.label || category}の画像を差し替えました` });
      onUpdate();
    } catch {
      toast({ title: "画像の差し替えに失敗しました", variant: "destructive" });
    } finally {
      setReplacingCategory(null);
    }
  };

  // Replace a single image within its category (or in source_images if uncategorized)
  const handleReplaceSingleImage = async (files: FileList) => {
    if (!selectedImage) return;
    setReplacingInModal(true);
    try {
      const urls = await uploadFiles(files);
      if (urls.length === 0) return;
      const newUrl = urls[0];
      const category = selectedImage.category;

      if (category && categoryImages[category]) {
        const updatedCatUrls = [...categoryImages[category]];
        const idx = updatedCatUrls.indexOf(selectedImage.url);
        if (idx !== -1) {
          updatedCatUrls[idx] = newUrl;
        } else {
          updatedCatUrls.push(newUrl);
        }
        const updatedCategoryImages = { ...categoryImages, [category]: updatedCatUrls };
        const allSourceImages = Object.entries(updatedCategoryImages)
          .filter(([k]) => k !== "comments")
          .flatMap(([, v]) => v || []);
        const commentImages = updatedCategoryImages.comments || report.comment_images || [];

        await analyticsApi.update(report.id, {
          category_images: updatedCategoryImages,
          source_images: allSourceImages,
          comment_images: commentImages,
        } as any);
      } else {
        // Uncategorized — replace in source_images
        const updatedSourceImages = [...(report.source_images || [])];
        const idx = updatedSourceImages.indexOf(selectedImage.url);
        if (idx !== -1) {
          updatedSourceImages[idx] = newUrl;
        } else {
          updatedSourceImages.push(newUrl);
        }
        await analyticsApi.update(report.id, {
          source_images: updatedSourceImages,
        } as any);
      }

      toast({ title: "画像を差し替えました" });
      setSelectedImage(null);
      onUpdate();
    } catch {
      toast({ title: "画像の差し替えに失敗しました", variant: "destructive" });
    } finally {
      setReplacingInModal(false);
    }
  };

  // Add images to a category (append, not replace)
  const handleAddFiles = async (category: string, files: FileList) => {
    setAddingToCategory(category);
    try {
      const urls = await uploadFiles(files);
      if (urls.length === 0) return;

      const existingUrls = categoryImages[category] || [];
      const updatedCategoryImages = { ...categoryImages, [category]: [...existingUrls, ...urls] };
      const allSourceImages = Object.entries(updatedCategoryImages)
        .filter(([k]) => k !== "comments")
        .flatMap(([, v]) => v || []);
      const commentImgs = updatedCategoryImages.comments || report.comment_images || [];

      await analyticsApi.update(report.id, {
        category_images: updatedCategoryImages,
        source_images: allSourceImages,
        comment_images: commentImgs,
      } as any);

      toast({ title: `${CATEGORY_META[category]?.label || category}に${urls.length}枚追加しました` });
      setShowAddDialog(false);
      onUpdate();
    } catch {
      toast({ title: "画像の追加に失敗しました", variant: "destructive" });
    } finally {
      setAddingToCategory(null);
    }
  };

  const triggerFileInput = (onFiles: (files: FileList) => void) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = false;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) onFiles(files);
    };
    input.click();
  };

  const triggerMultiFileInput = (category: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) handleReplaceFiles(category, files);
    };
    input.click();
  };

  const triggerAddFileInput = (category: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) handleAddFiles(category, files);
    };
    input.click();
  };

  // Grouped images
  const groupedImages: { category: string; urls: string[] }[] = [];
  if (hasCategoryMapping) {
    for (const [cat, urls] of Object.entries(categoryImages)) {
      if (urls && urls.length > 0) {
        groupedImages.push({ category: cat, urls });
      }
    }
  }

  const mappedUrls = new Set(Object.values(categoryImages).flat());
  const ungroupedImages = (report.source_images || []).filter((url) => !mappedUrls.has(url));

  const ImageThumbnail = ({ url, index, category }: { url: string; index: number; category: string | null }) => {
    const meta = category ? CATEGORY_META[category] : null;
    return (
      <button
        onClick={() => setSelectedImage({ url, index, category })}
        className="relative block rounded-lg overflow-hidden border border-border hover:border-primary/50 hover:shadow-md transition-all group cursor-pointer text-left"
      >
        <img
          src={url}
          alt={`${meta?.label || "画像"} ${index + 1}`}
          className="w-full h-auto"
          loading="lazy"
        />
        {/* Category label overlay */}
        {meta && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 bg-white/90 text-foreground"
            >
              {meta.label}
            </Badge>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow" />
        </div>
      </button>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                解析元の画像
              </CardTitle>
              <CardDescription>
                {report.source_images?.length || 0}枚のスクリーンショットから解析
                {hasCategoryMapping && " · カテゴリ別に管理"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddDialog(true)}
                disabled={isUploading}
              >
                <Plus className="h-4 w-4 mr-1" />
                画像を追加
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onReanalyze}
                disabled={reanalyzing}
              >
                {reanalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                再解析
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasCategoryMapping ? (
            groupedImages.map(({ category, urls }) => {
              const meta = CATEGORY_META[category];
              const Icon = meta?.icon || ImageIcon;
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="p-1.5 rounded"
                        style={{ backgroundColor: `${meta?.color || "#666"}15` }}
                      >
                        <Icon
                          className="h-3.5 w-3.5"
                          style={{ color: meta?.color || "#666" }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {meta?.label || category}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {urls.length}枚
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      disabled={replacingCategory === category || isUploading}
                      onClick={() => triggerMultiFileInput(category)}
                    >
                      {replacingCategory === category ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      一括差し替え
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {urls.map((url, i) => (
                      <ImageThumbnail key={i} url={url} index={i} category={category} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(report.source_images || []).map((url, i) => (
                <ImageThumbnail key={i} url={url} index={i} category={null} />
              ))}
            </div>
          )}

          {ungroupedImages.length > 0 && hasCategoryMapping && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">
                未分類の画像
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {ungroupedImages.map((url, i) => (
                  <ImageThumbnail key={i} url={url} index={i} category={null} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Detail Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-base">
                {selectedImage?.category && CATEGORY_META[selectedImage.category] ? (
                  <>
                    {(() => {
                      const meta = CATEGORY_META[selectedImage.category!];
                      const Icon = meta.icon;
                      return (
                        <>
                          <div
                            className="p-1.5 rounded"
                            style={{ backgroundColor: `${meta.color}15` }}
                          >
                            <Icon className="h-4 w-4" style={{ color: meta.color }} />
                          </div>
                          <Badge
                            style={{ backgroundColor: `${meta.color}20`, color: meta.color, borderColor: `${meta.color}40` }}
                            variant="outline"
                          >
                            {meta.label}
                          </Badge>
                        </>
                      );
                    })()}
                    <span className="text-muted-foreground text-sm">
                      画像 {(selectedImage?.index ?? 0) + 1}
                    </span>
                  </>
                ) : (
                  <span>画像 {(selectedImage?.index ?? 0) + 1}（未分類）</span>
                )}
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Full-size image */}
          <div className="px-4 pb-2">
            <div className="rounded-lg overflow-hidden border border-border bg-muted/30">
              {selectedImage && (
                <img
                  src={selectedImage.url}
                  alt="解析元画像"
                  className="w-full h-auto"
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 pt-2 border-t border-border flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {selectedImage?.category && CATEGORY_META[selectedImage.category]
                ? `この画像は「${CATEGORY_META[selectedImage.category].label}」カテゴリの解析に使用されています`
                : "この画像はカテゴリに紐付いていません"}
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={replacingInModal || isUploading}
              onClick={() => triggerFileInput(handleReplaceSingleImage)}
            >
              {replacingInModal ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Upload className="h-4 w-4 mr-1" />
              )}
              この画像を差し替え
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

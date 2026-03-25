import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { useFileUpload } from "@/hooks/useFileUpload";
import { analyticsApi, type AnalyticsReport } from "@/lib/analytics-api";
import {
  Image as ImageIcon, RefreshCw, Loader2,
  Eye, ThumbsUp, Globe, Users, Monitor, BarChart3, MousePointerClick,
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

export default function SourceImageManager({
  report,
  onReanalyze,
  reanalyzing,
  onUpdate,
}: SourceImageManagerProps) {
  const { toast } = useToast();
  const { uploadFiles, isUploading } = useFileUpload({ folder: "analytics" });
  const [replacingCategory, setReplacingCategory] = useState<string | null>(null);

  // Get category_images from report (may be stored as JSONB)
  const categoryImages: Record<string, string[]> = (report as any).category_images || {};
  const hasCategoryMapping = Object.keys(categoryImages).some(
    (k) => categoryImages[k]?.length > 0
  );

  // Build a reverse lookup: url → category
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
      // Also update flat source_images
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

  // Group images by category or show flat list
  const groupedImages: { category: string; urls: string[] }[] = [];
  if (hasCategoryMapping) {
    for (const [cat, urls] of Object.entries(categoryImages)) {
      if (urls && urls.length > 0) {
        groupedImages.push({ category: cat, urls });
      }
    }
  }

  // Ungrouped images (in source_images but not in any category)
  const mappedUrls = new Set(Object.values(categoryImages).flat());
  const ungroupedImages = (report.source_images || []).filter((url) => !mappedUrls.has(url));

  return (
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
      </CardHeader>
      <CardContent className="space-y-4">
        {hasCategoryMapping ? (
          // Categorized view
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
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      disabled={replacingCategory === category || isUploading}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.multiple = true;
                        input.onchange = (e) => {
                          const files = (e.target as HTMLInputElement).files;
                          if (files && files.length > 0) {
                            handleReplaceFiles(category, files);
                          }
                        };
                        input.click();
                      }}
                    >
                      {replacingCategory === category ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      差し替え
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {urls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg overflow-hidden border hover:shadow-md transition-shadow"
                    >
                      <img
                        src={url}
                        alt={`${meta?.label || category} ${i + 1}`}
                        className="w-full h-auto"
                      />
                    </a>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          // Flat view (legacy reports without category mapping)
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(report.source_images || []).map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg overflow-hidden border hover:shadow-md transition-shadow"
              >
                <img src={url} alt={`Source ${i + 1}`} className="w-full h-auto" />
              </a>
            ))}
          </div>
        )}

        {/* Ungrouped images */}
        {ungroupedImages.length > 0 && hasCategoryMapping && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">
              未分類の画像
            </span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ungroupedImages.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg overflow-hidden border hover:shadow-md transition-shadow"
                >
                  <img src={url} alt={`Ungrouped ${i + 1}`} className="w-full h-auto" />
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

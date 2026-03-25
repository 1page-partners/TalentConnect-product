import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { useFileUpload } from "@/hooks/useFileUpload";
import { campaignApi } from "@/lib/api";
import { analyticsApi } from "@/lib/analytics-api";
import {
  ArrowLeft, Loader2, BarChart3, Eye, MousePointerClick,
  Users, Globe, Monitor, ThumbsUp,
} from "lucide-react";

const IMAGE_CATEGORIES = [
  {
    key: "overview",
    label: "概要（リーチ）",
    description: "インプレッション・再生回数・CTR・平均視聴時間",
    icon: Eye,
    color: "#1a73e8",
  },
  {
    key: "engagement",
    label: "エンゲージメント",
    description: "高評価数・高評価率・視聴維持率・総再生時間",
    icon: ThumbsUp,
    color: "#34a853",
  },
  {
    key: "traffic",
    label: "トラフィックソース",
    description: "ブラウジング・関連動画・直接流入・検索など",
    icon: Globe,
    color: "#fa7b17",
  },
  {
    key: "audience",
    label: "視聴者属性（年齢・性別）",
    description: "年齢分布・性別比率",
    icon: Users,
    color: "#a142f4",
  },
  {
    key: "geography",
    label: "地域",
    description: "視聴者の上位の国・地域",
    icon: Globe,
    color: "#24c1e0",
  },
  {
    key: "devices",
    label: "デバイス",
    description: "モバイル・パソコン・タブレット・テレビなど",
    icon: Monitor,
    color: "#ea4335",
  },
] as const;

type CategoryKey = (typeof IMAGE_CATEGORIES)[number]["key"];

export default function AnalyticsReportNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { uploadFiles, isUploading } = useFileUpload({ folder: "analytics" });

  const [title, setTitle] = useState("");
  const [campaignId, setCampaignId] = useState<string>("");
  const [categoryImages, setCategoryImages] = useState<Record<CategoryKey, string[]>>({
    overview: [],
    engagement: [],
    traffic: [],
    audience: [],
    geography: [],
    devices: [],
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: campaignApi.getAll,
  });

  const handleFilesSelected = async (category: CategoryKey, files: FileList) => {
    try {
      const urls = await uploadFiles(files);
      setCategoryImages((prev) => ({
        ...prev,
        [category]: [...prev[category], ...urls],
      }));
    } catch {
      toast({ title: "アップロードエラー", variant: "destructive" });
    }
  };

  const handleRemoveFile = (category: CategoryKey, index: number) => {
    setCategoryImages((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  const totalImages = Object.values(categoryImages).reduce((s, arr) => s + arr.length, 0);

  const handleAnalyze = async () => {
    if (totalImages === 0) {
      toast({ title: "少なくとも1枚の画像をアップロードしてください", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyticsApi.analyzeImages({
        categoryImages,
        campaignId: campaignId && campaignId !== "none" ? campaignId : undefined,
        title: title || "レポート",
      });

      toast({ title: "解析完了", description: "レポートを生成しました" });
      navigate(`/admin/analytics/${result.report.id}`);
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast({
        title: "解析エラー",
        description: err?.message || "画像の解析に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/analytics")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">レポート作成</h1>
          <p className="text-muted-foreground text-sm">
            カテゴリごとにスクリーンショットをアップロードして精度の高い解析を実現
          </p>
        </div>
      </div>

      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>レポートタイトル</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 〇〇案件 YouTube投稿レポート"
            />
          </div>
          <div className="space-y-2">
            <Label>紐付け案件（任意）</Label>
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger>
                <SelectValue placeholder="案件を選択..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">なし</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Category image uploads */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">カテゴリ別画像アップロード</h2>
        <p className="text-sm text-muted-foreground">
          各KPIに対応するスクリーンショットを個別にアップロードすることで解析精度が向上します。
          すべてのカテゴリが必須ではありません。
        </p>

        <div className="grid gap-4">
          {IMAGE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const images = categoryImages[cat.key];
            return (
              <Card key={cat.key} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${cat.color}15` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: cat.color }} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-sm font-semibold">{cat.label}</CardTitle>
                      <CardDescription className="text-xs">{cat.description}</CardDescription>
                    </div>
                    {images.length > 0 && (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                      >
                        {images.length}枚
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <FileUpload
                    onFilesSelected={(files) => handleFilesSelected(cat.key, files)}
                    onRemove={(index) => handleRemoveFile(cat.key, index)}
                    files={images}
                    accept="image/*"
                    multiple
                    isUploading={isUploading}
                    maxFiles={5}
                    label={`${cat.label}のスクリーンショットをアップロード`}
                    className="[&>div:first-child]:py-3"
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          合計 <span className="font-semibold text-foreground">{totalImages}</span> 枚の画像
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/admin/analytics")}>
            キャンセル
          </Button>
          <Button onClick={handleAnalyze} disabled={isAnalyzing || totalImages === 0}>
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                解析中...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                画像を解析してレポート生成
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

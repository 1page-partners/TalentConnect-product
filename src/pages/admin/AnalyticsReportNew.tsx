import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { useFileUpload } from "@/hooks/useFileUpload";
import { campaignApi } from "@/lib/api";
import { analyticsApi } from "@/lib/analytics-api";
import { ArrowLeft, Loader2, BarChart3 } from "lucide-react";

export default function AnalyticsReportNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { uploadFiles, isUploading } = useFileUpload();

  const [title, setTitle] = useState("");
  const [campaignId, setCampaignId] = useState<string>("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: campaignApi.getAll,
  });

  const handleFilesSelected = async (files: FileList) => {
    try {
      const urls = await uploadFiles(files, "attachments", "analytics");
      setImageUrls((prev) => [...prev, ...urls]);
    } catch {
      toast({ title: "アップロードエラー", variant: "destructive" });
    }
  };

  const handleRemoveFile = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (imageUrls.length === 0) {
      toast({ title: "画像を選択してください", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyticsApi.analyzeImages({
        imageUrls,
        campaignId: campaignId || undefined,
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
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/analytics")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">レポート作成</h1>
          <p className="text-muted-foreground text-sm">
            YouTubeアナリティクスのスクリーンショットをアップロードして解析
          </p>
        </div>
      </div>

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
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">アナリティクス画像</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            onFilesSelected={handleFilesSelected}
            onRemove={handleRemoveFile}
            files={imageUrls}
            accept="image/*"
            multiple
            isUploading={isUploading}
            maxFiles={10}
            label="YouTubeアナリティクスのスクリーンショットをドラッグ＆ドロップ"
            hint="複数画像対応（概要、リーチ、エンゲージメント、視聴者属性など）"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate("/admin/analytics")}>
          キャンセル
        </Button>
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || imageUrls.length === 0}
        >
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
  );
}

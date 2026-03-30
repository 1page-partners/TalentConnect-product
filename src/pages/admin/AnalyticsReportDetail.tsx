import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { analyticsApi, type AnalyticsReport } from "@/lib/analytics-api";
import { formatDate } from "@/lib/api";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import {
  ArrowLeft, Edit2, Save, X, RefreshCw, Loader2, Trash2,
  Eye, MousePointerClick, Clock, ThumbsUp, TrendingUp,
  Users, Globe, Monitor, Image as ImageIcon, Search, MessageSquare,
  Share2, Download, Link2, Pencil,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import SourceImageManager from "@/components/analytics/SourceImageManager";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
  RadialBarChart, RadialBar,
} from "recharts";

// YouTube Analytics inspired palette
const YT_BLUE = "#1a73e8";
const YT_GREEN = "#34a853";
const YT_RED = "#ea4335";
const YT_YELLOW = "#fbbc04";
const YT_PURPLE = "#a142f4";
const YT_CYAN = "#24c1e0";
const YT_ORANGE = "#fa7b17";
const YT_PINK = "#f538a0";

const DONUT_COLORS = [YT_BLUE, YT_RED, YT_GREEN, YT_YELLOW, YT_PURPLE, YT_CYAN, YT_ORANGE, YT_PINK];
const GENDER_COLORS: Record<string, string> = { "男性": YT_BLUE, "女性": YT_RED, "male": YT_BLUE, "female": YT_RED, "その他": YT_GREEN, "other": YT_GREEN };

// YouTube-style KPI tile
function KpiTile({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-xl bg-card border">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-2xl md:text-3xl font-bold" style={color ? { color } : undefined}>{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

// Donut chart with center label
function DonutChart({ data, centerLabel, height = 220 }: { data: { name: string; value: number; color?: string }[]; centerLabel?: string; height?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color || DONUT_COLORS[i % DONUT_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number) => total <= 1 ? `${(v * 100).toFixed(1)}%` : v.toLocaleString()}
          contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
        />
        {centerLabel && (
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-sm font-semibold">
            {centerLabel}
          </text>
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}

// Legend row
function ChartLegend({ data }: { data: { name: string; value: number; color: string; display: string }[] }) {
  return (
    <div className="space-y-2 mt-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-muted-foreground">{d.name}</span>
          </div>
          <span className="font-medium">{d.display}</span>
        </div>
      ))}
    </div>
  );
}

// Funnel visualization
function ImpressionFunnel({ impressions, views, ctr }: { impressions: number | null; views: number | null; ctr: number | null }) {
  if (impressions == null && views == null) return null;
  const imp = impressions ?? 0;
  const v = views ?? 0;
  const rate = ctr != null ? ctr : imp > 0 ? v / imp : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          インプレッションと視聴のファネル
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Funnel bars */}
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">インプレッション</span>
                <span className="font-semibold">{imp.toLocaleString()}</span>
              </div>
              <div className="h-8 rounded-lg" style={{ backgroundColor: YT_BLUE, width: "100%" }} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">視聴回数</span>
                <span className="font-semibold">{v.toLocaleString()}</span>
              </div>
              <div
                className="h-8 rounded-lg"
                style={{
                  backgroundColor: YT_GREEN,
                  width: imp > 0 ? `${Math.max((v / imp) * 100, 5)}%` : "50%",
                }}
              />
            </div>
          </div>
          {/* CTR badge */}
          <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl border bg-muted/50 min-w-[90px]">
            <span className="text-xs text-muted-foreground">CTR</span>
            <span className="text-2xl font-bold" style={{ color: YT_BLUE }}>
              {(Number(rate) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Retention curve (simulated from retention_rate)
function RetentionChart({ retentionRate }: { retentionRate: number | null }) {
  if (retentionRate == null) return null;
  const rate = Number(retentionRate);
  // Generate a realistic retention curve
  const points = Array.from({ length: 21 }, (_, i) => {
    const t = i * 5; // 0%, 5%, 10%, ... 100%
    // Exponential decay with initial drop
    const dropoff = i === 0 ? 1 : Math.max(rate * Math.exp(-0.015 * t) + (1 - rate) * 0.1, 0.02);
    return { time: `${t}%`, retention: Math.round(dropoff * 1000) / 10 };
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="h-4 w-4" />
          視聴維持率
        </CardTitle>
        <CardDescription>
          平均視聴維持率: <span className="font-semibold text-foreground">{(rate * 100).toFixed(1)}%</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={points}>
            <defs>
              <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={YT_BLUE} stopOpacity={0.3} />
                <stop offset="100%" stopColor={YT_BLUE} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} label={{ value: "動画の長さ", position: "insideBottom", offset: -5, fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={50} label={{ value: "視聴者", angle: -90, position: "insideLeft", offset: 10, fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
            <Area type="monotone" dataKey="retention" stroke={YT_BLUE} strokeWidth={2.5} fill="url(#retentionGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<AnalyticsReport>>({});
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzingCategory, setReanalyzingCategory] = useState<string | null>(null);
  const [managerComment, setManagerComment] = useState<string | null>(null);
  const [savingComment, setSavingComment] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const [commentPage, setCommentPage] = useState(0);
  const [commentsPerPage, setCommentsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("reach");
  const COMMENTS_PER_PAGE = commentsPerPage;
  const reportContentRef = useRef<HTMLDivElement>(null);
  const kpiSectionRef = useRef<HTMLDivElement>(null);
  const tabContentAreaRef = useRef<HTMLDivElement>(null);

  const { data: report, isLoading } = useQuery({
    queryKey: ["analytics-report", id],
    queryFn: () => analyticsApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">レポートが見つかりません</p>
        <Button variant="link" onClick={() => navigate("/admin/analytics")}>一覧に戻る</Button>
      </div>
    );
  }

  const fmt = (n: number | null) => (n != null ? n.toLocaleString("ja-JP") : "-");
  const pct = (n: number | null) => (n != null ? `${(Number(n) * 100).toFixed(1)}%` : "-");

  const startEdit = () => {
    setEditData({
      impressions: report.impressions,
      views: report.views,
      ctr: report.ctr,
      avg_watch_time: report.avg_watch_time,
      likes: report.likes,
      like_rate: report.like_rate,
      retention_rate: report.retention_rate,
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    try {
      await analyticsApi.update(report.id, editData);
      queryClient.invalidateQueries({ queryKey: ["analytics-report", id] });
      setEditing(false);
      toast({ title: "保存しました" });
    } catch {
      toast({ title: "保存エラー", variant: "destructive" });
    }
  };

  const handleReanalyze = async () => {
    if (!report.source_images?.length) return;
    setReanalyzing(true);
    try {
      const catImages = (report as any).category_images as Record<string, string[]> | undefined;
      const hasCategoryMapping = catImages && Object.values(catImages).some(arr => arr?.length > 0);

      await analyticsApi.analyzeImages({
        ...(hasCategoryMapping
          ? { categoryImages: catImages as any }
          : { imageUrls: report.source_images }),
        campaignId: report.campaign_id || undefined,
        title: report.title,
        reportId: report.id,
      });
      queryClient.invalidateQueries({ queryKey: ["analytics-report", id] });
      toast({ title: "再解析完了" });
    } catch {
      toast({ title: "再解析エラー", variant: "destructive" });
    } finally {
      setReanalyzing(false);
    }
  };

  const handleCategoryReanalyze = async (category: string) => {
    const catImages = (report as any).category_images as Record<string, string[]> | undefined;
    const urls = catImages?.[category];
    if (!urls?.length && category !== "comments") {
      toast({ title: "このカテゴリには画像がありません", variant: "destructive" });
      return;
    }
    setReanalyzingCategory(category);
    try {
      // Send only this category's images
      const singleCategoryImages: Record<string, string[]> = {};
      if (category === "comments") {
        singleCategoryImages.comments = catImages?.comments || report.comment_images || [];
      } else {
        singleCategoryImages[category] = urls!;
      }

      await analyticsApi.analyzeImages({
        categoryImages: singleCategoryImages as any,
        campaignId: report.campaign_id || undefined,
        title: report.title,
        reportId: report.id,
      });
      queryClient.invalidateQueries({ queryKey: ["analytics-report", id] });
      toast({ title: `「${category}」の再解析が完了しました` });
    } catch {
      toast({ title: "再解析エラー", variant: "destructive" });
    } finally {
      setReanalyzingCategory(null);
    }
  };

  const saveManagerComment = async () => {
    setSavingComment(true);
    try {
      await analyticsApi.update(report.id, { manager_comment: managerComment ?? "" } as any);
      queryClient.invalidateQueries({ queryKey: ["analytics-report", id] });
      setManagerComment(null);
      toast({ title: "コメントを保存しました" });
    } catch {
      toast({ title: "保存に失敗しました", variant: "destructive" });
    } finally {
      setSavingComment(false);
    }
  };

  const copyShareLink = async () => {
    const token = (report as any).share_token;
    if (!token) {
      toast({ title: "共有トークンがありません", variant: "destructive" });
      return;
    }
    const url = `${window.location.origin}/report/${token}`;
    await navigator.clipboard.writeText(url);
    toast({ title: "共有リンクをコピーしました" });
  };

  const captureElement = async (el: HTMLElement): Promise<Blob> => {
    // Add padding wrapper for export
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "padding:40px;background:#ffffff;display:inline-block;min-width:100%;box-sizing:border-box;";
    el.parentNode?.insertBefore(wrapper, el);
    wrapper.appendChild(el);

    const canvas = await html2canvas(wrapper, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      windowWidth: 1200,
    });

    // Restore DOM
    wrapper.parentNode?.insertBefore(el, wrapper);
    wrapper.remove();

    return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
  };

  const waitForRender = (ms = 1200) => new Promise((r) => setTimeout(r, ms));

  const waitForCharts = async (el: HTMLElement, ms = 2000) => {
    // Wait for Recharts SVGs to render
    const start = Date.now();
    while (Date.now() - start < ms) {
      const svgs = el.querySelectorAll("svg");
      const paths = el.querySelectorAll("svg path, svg rect, svg circle");
      if (svgs.length > 0 && paths.length > 0) {
        // Extra buffer for animation completion
        await new Promise((r) => setTimeout(r, 500));
        return;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
  };



  const exportAsImage = async () => {
    setExporting(true);
    setExportProgress("エクスポートを準備中...");
    const originalTab = activeTab;
    const originalCommentPage = commentPage;
    // Small delay to let overlay render before starting
    await waitForRender(300);
    try {
      const zip = new JSZip();

      // 1. KPI Overview
      setExportProgress("概要をキャプチャ中...");
      if (kpiSectionRef.current) {
        await waitForRender(400);
        zip.file("01_概要.png", await captureElement(kpiSectionRef.current));
      }

      // 2. Reach tab
      setExportProgress("リーチをキャプチャ中...");
      if (trafficData.length > 0) {
        setActiveTab("reach");
        await waitForRender();
        if (tabContentAreaRef.current) {
          await waitForCharts(tabContentAreaRef.current);
          zip.file("02_リーチ.png", await captureElement(tabContentAreaRef.current));
        }
      }

      // 3. Engagement tab
      setExportProgress("エンゲージメントをキャプチャ中...");
      setActiveTab("engagement");
      await waitForRender();
      if (tabContentAreaRef.current) {
        await waitForCharts(tabContentAreaRef.current);
        zip.file("03_エンゲージメント.png", await captureElement(tabContentAreaRef.current));
      }

      // 4. Audience tab
      setExportProgress("視聴者データをキャプチャ中...");
      setActiveTab("audience");
      await waitForRender();
      if (tabContentAreaRef.current) {
        await waitForCharts(tabContentAreaRef.current);
        zip.file("04_視聴者.png", await captureElement(tabContentAreaRef.current));
      }

      // 5. Comments - each page
      const visibleComments: { body: string; hidden?: boolean }[] = ((report as any).comment_texts || []).filter((c: any) => !c.hidden);
      if (visibleComments.length > 0) {
        setExportProgress("コメントをキャプチャ中...");
        setActiveTab("comments");
        const totalPages = Math.ceil(visibleComments.length / COMMENTS_PER_PAGE);
        for (let p = 0; p < totalPages; p++) {
          setCommentPage(p);
          await waitForRender(800);
          if (tabContentAreaRef.current) {
            zip.file(`${String(5 + p).padStart(2, "0")}_コメント${totalPages > 1 ? `_${p + 1}` : ""}.png`, await captureElement(tabContentAreaRef.current));
          }
        }
      }

      // Restore state
      setActiveTab(originalTab);
      setCommentPage(originalCommentPage);

      // Download
      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.download = `${report.title || "report"}_slides.zip`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
      toast({ title: "ZIPをダウンロードしました" });
    } catch (e) {
      console.error(e);
      toast({ title: "画像の書き出しに失敗しました", variant: "destructive" });
    } finally {
      setActiveTab(originalTab);
      setCommentPage(originalCommentPage);
      setExporting(false);
    }
  };

  const toChartData = (obj: Record<string, number> | null | undefined) =>
    obj ? Object.entries(obj).map(([name, value]) => ({ name, value: Number(value) })) : [];

  const trafficData = toChartData(report.traffic_sources);
  const ageData = toChartData(report.audience_age);
  const genderData = toChartData(report.audience_gender);
  const regionData = toChartData(report.audience_region);
  const deviceData = toChartData(report.devices);
  const searchTermsData = toChartData(report.search_terms);

  const genderDonut = genderData.map((d, i) => ({
    ...d,
    color: GENDER_COLORS[d.name.toLowerCase()] || GENDER_COLORS[d.name] || DONUT_COLORS[i],
  }));
  const deviceDonut = deviceData.map((d, i) => ({
    ...d,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));
  const trafficDonut = trafficData.map((d, i) => ({
    ...d,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  const isAllDataEmpty = trafficData.length === 0 && ageData.length === 0 && genderData.length === 0 && deviceData.length === 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative">
      {/* Re-analysis overlay */}
      {(reanalyzing || reanalyzingCategory) && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-center space-y-1">
            <p className="text-lg font-semibold">
              {reanalyzingCategory ? `「${reanalyzingCategory}」を再解析中...` : "再解析中..."}
            </p>
            <p className="text-sm text-muted-foreground">画像を解析しています。しばらくお待ちください。</p>
          </div>
        </div>
      )}
      {/* Export overlay to hide tab switching */}
      {exporting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">{exportProgress}</p>
          <p className="text-sm text-muted-foreground mt-1">画像を生成しています...</p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/analytics")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{report.title || "レポート"}</h1>
            <p className="text-sm text-muted-foreground">{formatDate(report.created_at)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">削除</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>レポートを削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  「{report.title || "無題のレポート"}」を削除します。この操作は取り消せません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={async () => {
                    try {
                      await analyticsApi.delete(report.id);
                      toast({ title: "レポートを削除しました" });
                      navigate("/admin/analytics");
                    } catch {
                      toast({ title: "削除に失敗しました", variant: "destructive" });
                    }
                  }}
                >
                  削除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={reanalyzing}>
                {reanalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="ml-1 hidden sm:inline">再解析</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>レポートを再解析しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  解析元の画像から再度データを抽出します。既存データは安全にマージされ、解析に失敗したカテゴリのデータは保持されます。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction onClick={handleReanalyze}>再解析を実行</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {editing ? (
            <>
              <Button size="sm" onClick={saveEdit}>
                <Save className="h-4 w-4 mr-1" />保存
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={startEdit}>
              <Edit2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">手動編集</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={copyShareLink}>
            <Link2 className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">共有リンク</span>
          </Button>
          <Button variant="outline" size="sm" onClick={exportAsImage} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span className="ml-1 hidden sm:inline">画像出力</span>
          </Button>
        </div>
      </div>

      {/* Edit mode */}
      {editing && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">指標を手動で編集</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: "impressions", label: "インプレッション", type: "number" },
              { key: "views", label: "再生回数", type: "number" },
              { key: "ctr", label: "CTR（小数）", type: "number" },
              { key: "avg_watch_time", label: "平均視聴時間", type: "text" },
              { key: "likes", label: "高評価数", type: "number" },
              { key: "like_rate", label: "高評価率（小数）", type: "number" },
              { key: "retention_rate", label: "視聴維持率（小数）", type: "number" },
            ].map((f) => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs">{f.label}</Label>
                <Input
                  type={f.type}
                  step={f.type === "number" ? "any" : undefined}
                  value={(editData as any)[f.key] ?? ""}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      [f.key]: f.type === "number" ? (e.target.value ? Number(e.target.value) : null) : e.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* === Exportable content start === */}
      <div ref={reportContentRef} className="space-y-6">
      {/* ===== OVERVIEW: YouTube Studio style KPI row ===== */}
      <div ref={kpiSectionRef} className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile label="視聴回数" value={fmt(report.views)} color={YT_BLUE} />
          <KpiTile label="インプレッション" value={fmt(report.impressions)} color={YT_GREEN} />
          <KpiTile
            label="クリック率 (CTR)"
            value={pct(report.ctr)}
            sub={report.impressions != null && report.views != null ? `${fmt(report.views)} / ${fmt(report.impressions)}` : undefined}
            color={YT_PURPLE}
          />
          <KpiTile label="平均視聴時間" value={report.avg_watch_time || "-"} color={YT_ORANGE} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KpiTile label="高評価率" value={pct(report.like_rate)} color={YT_BLUE} />
          <KpiTile label="視聴維持率" value={pct(report.retention_rate)} />
          <KpiTile label="総再生時間" value={report.total_watch_time ? `${report.total_watch_time}時間` : "-"} />
        </div>
      </div>


      <Separator />

      {/* ===== TABS: YouTube Studio style ===== */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="reach">リーチ</TabsTrigger>
          <TabsTrigger value="engagement">エンゲージメント</TabsTrigger>
          <TabsTrigger value="audience">視聴者</TabsTrigger>
          {/* <TabsTrigger value="search_terms">検索語句</TabsTrigger> */}
          <TabsTrigger value="comments">コメント</TabsTrigger>
        </TabsList>

        <div ref={tabContentAreaRef}>
        {/* === REACH TAB === */}
        <TabsContent value="reach" className="space-y-6">

          {/* Traffic Sources */}
          {trafficData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  トラフィックソース
                </CardTitle>
                <CardDescription>視聴者がどこからコンテンツを見つけたか</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <DonutChart data={trafficDonut} centerLabel="流入" />
                  <ChartLegend
                    data={trafficDonut.map((d) => ({
                      name: d.name,
                      value: d.value,
                      color: d.color,
                      display: d.value <= 1 ? `${(d.value * 100).toFixed(1)}%` : d.value.toLocaleString(),
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* === ENGAGEMENT TAB === */}
        <TabsContent value="engagement" className="space-y-6">
          {/* Retention Curve */}
          <RetentionChart retentionRate={report.retention_rate} />

          {/* Engagement metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-full" style={{ backgroundColor: `${YT_GREEN}15` }}>
                  <TrendingUp className="h-6 w-6" style={{ color: YT_GREEN }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">高評価率</p>
                  <p className="text-2xl font-bold">{pct(report.like_rate)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-full" style={{ backgroundColor: `${YT_ORANGE}15` }}>
                  <Clock className="h-6 w-6" style={{ color: YT_ORANGE }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">総再生時間</p>
                  <p className="text-2xl font-bold">{report.total_watch_time ? `${report.total_watch_time}時間` : "-"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* === AUDIENCE TAB === */}
        <TabsContent value="audience" className="space-y-6">
          {/* Row 1: Gender + Age */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {genderData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />性別</CardTitle>
                </CardHeader>
                <CardContent>
                  <DonutChart data={genderDonut} centerLabel="性別" height={200} />
                  <ChartLegend data={genderDonut.map((d) => ({ name: d.name, value: d.value, color: d.color, display: `${(d.value * 100).toFixed(1)}%` }))} />
                </CardContent>
              </Card>
            )}
            {ageData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />年齢層</CardTitle>
                </CardHeader>
                <CardContent>
                  <DonutChart data={ageData.map((d, i) => ({ ...d, color: DONUT_COLORS[i % DONUT_COLORS.length] }))} centerLabel="年齢" height={200} />
                  <ChartLegend data={ageData.map((d, i) => ({ name: d.name, value: d.value, color: DONUT_COLORS[i % DONUT_COLORS.length], display: `${(d.value * 100).toFixed(1)}%` }))} />
                </CardContent>
              </Card>
            )}
          </div>
          {/* Row 2: Device + Region */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deviceData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><Monitor className="h-4 w-4" />デバイス</CardTitle>
                </CardHeader>
                <CardContent>
                  <DonutChart data={deviceDonut} centerLabel="デバイス" height={200} />
                  <ChartLegend data={deviceDonut.map((d) => ({ name: d.name, value: d.value, color: d.color, display: `${(d.value * 100).toFixed(1)}%` }))} />
                </CardContent>
              </Card>
            )}
            {regionData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" />上位の地域</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {regionData.sort((a, b) => b.value - a.value).map((r, i) => {
                      const maxVal = regionData[0]?.value || 1;
                      return (
                        <div key={r.name} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">{r.name}</span>
                              <span className="text-muted-foreground">{(r.value * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${(r.value / maxVal) * 100}%`, backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* === SEARCH TERMS TAB (commented out) ===
        <TabsContent value="search_terms" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4" />
                YouTube 検索語句
              </CardTitle>
              <CardDescription>視聴者がこの動画を見つけるために使った検索キーワード</CardDescription>
            </CardHeader>
            <CardContent>
              {searchTermsData.length > 0 ? (
                <div className="space-y-3">
                  {searchTermsData.sort((a, b) => b.value - a.value).map((term, i) => {
                    const maxVal = searchTermsData[0]?.value || 1;
                    return (
                      <div key={term.name} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{term.name}</span>
                            <span className="text-muted-foreground">{term.value.toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${(term.value / maxVal) * 100}%`,
                                backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                  データなし
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        */}

        {/* === COMMENTS TAB === */}
        <TabsContent value="comments" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                コメント
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(report as any).comment_texts && (report as any).comment_texts.length > 0 ? (() => {
                const allComments: { body: string; hidden?: boolean }[] = (report as any).comment_texts;
                const totalPages = Math.ceil(allComments.length / COMMENTS_PER_PAGE);
                const currentComments = allComments.slice(commentPage * COMMENTS_PER_PAGE, (commentPage + 1) * COMMENTS_PER_PAGE);
                return (
                  <div className="space-y-3">
                    {currentComments.map((comment, i) => {
                      const realIdx = commentPage * COMMENTS_PER_PAGE + i;
                      const isHidden = !!comment.hidden;
                      return (
                        <div key={realIdx} className={`group flex items-start gap-2 p-3 rounded-lg border text-sm leading-relaxed ${isHidden ? "bg-muted/10 opacity-50" : "bg-muted/30"}`}>
                          <span className="flex-1">{comment.body}</span>
                          <button
                            type="button"
                            title={isHidden ? "提出時に表示する" : "提出時に非表示にする"}
                            className="shrink-0 p-1 rounded transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={async () => {
                              const updated = allComments.map((c, idx) =>
                                idx === realIdx ? { ...c, hidden: !c.hidden } : c
                              );
                              try {
                                await analyticsApi.update(report.id, { comment_texts: updated } as any);
                                queryClient.invalidateQueries({ queryKey: ["analytics-report", id] });
                                toast({ title: isHidden ? "表示に変更しました" : "非表示に変更しました" });
                              } catch {
                                toast({ title: "更新に失敗しました", variant: "destructive" });
                              }
                            }}
                          >
                            {isHidden ? <Eye className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          </button>
                        </div>
                      );
                    })}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <Button variant="outline" size="sm" disabled={commentPage === 0} onClick={() => setCommentPage(p => p - 1)}>
                          前へ
                        </Button>
                        <span className="text-sm text-muted-foreground">{commentPage + 1} / {totalPages}</span>
                        <Button variant="outline" size="sm" disabled={commentPage >= totalPages - 1} onClick={() => setCommentPage(p => p + 1)}>
                          次へ
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })() : report.comment_images && report.comment_images.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">テキスト抽出されていません。元画像を表示しています。</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.comment_images.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border hover:shadow-md transition-shadow">
                        <img src={url} alt={`Comment ${i + 1}`} className="w-full h-auto" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                  コメントなし
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        </div>
      </Tabs>

      {/* Manager comment - inside exportable area */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            担当者コメント
          </CardTitle>
        </CardHeader>
        <CardContent>
          {managerComment !== null ? (
            <div className="space-y-3">
              <Textarea
                value={managerComment}
                onChange={(e) => setManagerComment(e.target.value)}
                placeholder="クライアント提出用のコメントを入力..."
                rows={4}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveManagerComment} disabled={savingComment}>
                  {savingComment ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                  保存
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setManagerComment(null)}>
                  キャンセル
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {(report as any).manager_comment ? (
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{(report as any).manager_comment}</p>
                  <Button variant="ghost" size="sm" onClick={() => setManagerComment((report as any).manager_comment || "")}>
                    <Edit2 className="h-3 w-3 mr-1" />編集
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setManagerComment("")}>
                  <Pencil className="h-3 w-3 mr-1" />コメントを追加
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      </div>
      {/* === Exportable content end === */}

      <Separator />

      {/* Source images - outside exportable area */}
      {(report.source_images?.length > 0 || (report as any).category_images) && (
        <SourceImageManager
          report={report}
          onReanalyze={handleReanalyze}
          onCategoryReanalyze={handleCategoryReanalyze}
          reanalyzing={reanalyzing}
          reanalyzingCategory={reanalyzingCategory}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ["analytics-report", id] })}
        />
      )}
    </div>
  );
}

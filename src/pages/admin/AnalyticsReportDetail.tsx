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
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} />
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
  const [managerComment, setManagerComment] = useState<string | null>(null);
  const [savingComment, setSavingComment] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [commentPage, setCommentPage] = useState(0);
  const COMMENTS_PER_PAGE = 5;
  const reportContentRef = useRef<HTMLDivElement>(null);

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
      await analyticsApi.analyzeImages({
        imageUrls: report.source_images,
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

  const renderSlide = async (html: string): Promise<Blob> => {
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;left:-9999px;top:0;width:1920px;min-height:1080px;padding:60px 80px;background:#fff;font-family:system-ui,sans-serif;color:#1a1a1a;display:flex;flex-direction:column;justify-content:center;";
    container.innerHTML = html;
    document.body.appendChild(container);
    await new Promise((r) => setTimeout(r, 200));
    const canvas = await html2canvas(container, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
    document.body.removeChild(container);
    const targetW = 1920, targetH = 1080;
    const outCanvas = document.createElement("canvas");
    outCanvas.width = targetW;
    outCanvas.height = targetH;
    const ctx = outCanvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, targetW, targetH);
    const s = Math.min(targetW / canvas.width, targetH / canvas.height);
    ctx.drawImage(canvas, (targetW - canvas.width * s) / 2, (targetH - canvas.height * s) / 2, canvas.width * s, canvas.height * s);
    return new Promise((resolve) => outCanvas.toBlob((b) => resolve(b!), "image/png"));
  };

  const exportAsImage = async () => {
    setExporting(true);
    try {
      const zip = new JSZip();
      const kpi = (label: string, value: string, color: string) =>
        `<div style="flex:1;padding:24px;border-radius:12px;border:1px solid #e5e7eb;text-align:center;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#888;margin-bottom:6px;">${label}</div>
          <div style="font-size:32px;font-weight:800;color:${color};">${value}</div>
        </div>`;
      const legendRow = (name: string, display: string, color: string) =>
        `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;font-size:15px;">
          <div style="display:flex;align-items:center;gap:10px;"><div style="width:14px;height:14px;border-radius:50%;background:${color};"></div><span style="color:#555;">${name}</span></div>
          <span style="font-weight:600;">${display}</span>
        </div>`;
      const slideTitle = (t: string) => `<div style="text-align:center;margin-bottom:40px;"><div style="font-size:28px;font-weight:800;">${report.title || "レポート"}</div><div style="font-size:14px;color:#999;margin-top:4px;">${t}</div></div>`;

      // 1. Overview slide
      const overviewHtml = `${slideTitle("概要")}
        <div style="display:flex;gap:16px;margin-bottom:24px;">
          ${kpi("視聴回数", fmt(report.views), YT_BLUE)}
          ${kpi("インプレッション", fmt(report.impressions), YT_GREEN)}
          ${kpi("CTR", pct(report.ctr), YT_PURPLE)}
        </div>
        <div style="display:flex;gap:16px;">
          ${kpi("平均視聴時間", report.avg_watch_time || "-", YT_ORANGE)}
          ${kpi("高評価率", pct(report.like_rate), YT_BLUE)}
          ${kpi("視聴維持率", pct(report.retention_rate), YT_GREEN)}
          ${kpi("総再生時間", report.total_watch_time || "-", YT_RED)}
        </div>`;
      zip.file("01_概要.png", await renderSlide(overviewHtml));

      // 2. Reach slide (Traffic Sources)
      if (trafficData.length > 0) {
        const reachHtml = `${slideTitle("リーチ - トラフィックソース")}
          <div style="max-width:600px;margin:0 auto;">
            ${trafficDonut.map(d => legendRow(d.name, d.value <= 1 ? `${(d.value * 100).toFixed(1)}%` : d.value.toLocaleString(), d.color)).join("")}
          </div>`;
        zip.file("02_リーチ.png", await renderSlide(reachHtml));
      }

      // 3. Engagement slide
      const engHtml = `${slideTitle("エンゲージメント")}
        <div style="display:flex;gap:24px;justify-content:center;">
          ${kpi("高評価率", pct(report.like_rate), YT_BLUE)}
          ${kpi("視聴維持率", pct(report.retention_rate), YT_GREEN)}
          ${kpi("総再生時間", report.total_watch_time || "-", YT_ORANGE)}
        </div>`;
      zip.file("03_エンゲージメント.png", await renderSlide(engHtml));

      // 4. Audience slide
      let audHtml = slideTitle("視聴者");
      if (genderData.length > 0 || deviceData.length > 0) {
        const gH = genderData.length > 0 ? `<div style="flex:1;"><div style="font-size:18px;font-weight:700;margin-bottom:12px;">性別</div>${genderDonut.map(d => legendRow(d.name, `${(d.value * 100).toFixed(1)}%`, d.color)).join("")}</div>` : "";
        const dH = deviceData.length > 0 ? `<div style="flex:1;"><div style="font-size:18px;font-weight:700;margin-bottom:12px;">デバイス</div>${deviceDonut.map(d => legendRow(d.name, `${(d.value * 100).toFixed(1)}%`, d.color)).join("")}</div>` : "";
        audHtml += `<div style="display:flex;gap:60px;margin-bottom:32px;">${gH}${dH}</div>`;
      }
      if (ageData.length > 0) {
        audHtml += `<div style="max-width:500px;margin:0 auto;"><div style="font-size:18px;font-weight:700;margin-bottom:12px;">年齢層</div>${ageData.map((d, i) => legendRow(d.name, `${(d.value * 100).toFixed(1)}%`, DONUT_COLORS[i % DONUT_COLORS.length])).join("")}</div>`;
      }
      zip.file("04_視聴者.png", await renderSlide(audHtml));

      // 5. Comment slides (5 per page)
      const comments: { body: string }[] = (report as any).comment_texts || [];
      if (comments.length > 0) {
        const commentPages = Math.ceil(comments.length / COMMENTS_PER_PAGE);
        for (let p = 0; p < commentPages; p++) {
          const pageComments = comments.slice(p * COMMENTS_PER_PAGE, (p + 1) * COMMENTS_PER_PAGE);
          const suffix = commentPages > 1 ? ` (${p + 1}/${commentPages})` : "";
          const comHtml = `${slideTitle(`コメント${suffix}`)}
            <div style="max-width:800px;margin:0 auto;">
              ${pageComments.map(c => `<div style="padding:14px 18px;border-radius:10px;border:1px solid #e5e7eb;background:#f9fafb;font-size:15px;margin-bottom:12px;line-height:1.7;">${c.body}</div>`).join("")}
            </div>`;
          const num = String(5 + p).padStart(2, "0");
          zip.file(`${num}_コメント${commentPages > 1 ? `_${p + 1}` : ""}.png`, await renderSlide(comHtml));
        }
      }

      // Generate ZIP
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
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
          <Button variant="outline" size="sm" onClick={handleReanalyze} disabled={reanalyzing}>
            {reanalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-1 hidden sm:inline">再解析</span>
          </Button>
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

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiTile label="高評価率" value={pct(report.like_rate)} color={YT_BLUE} />
        <KpiTile label="視聴維持率" value={pct(report.retention_rate)} />
        <KpiTile label="総再生時間" value={report.total_watch_time || "-"} />
      </div>


      <Separator />

      {/* ===== TABS: YouTube Studio style ===== */}
      <Tabs defaultValue="reach" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="reach">リーチ</TabsTrigger>
          <TabsTrigger value="engagement">エンゲージメント</TabsTrigger>
          <TabsTrigger value="audience">視聴者</TabsTrigger>
          {/* <TabsTrigger value="search_terms">検索語句</TabsTrigger> */}
          <TabsTrigger value="comments">コメント</TabsTrigger>
        </TabsList>

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-full" style={{ backgroundColor: `${YT_BLUE}15` }}>
                  <ThumbsUp className="h-6 w-6" style={{ color: YT_BLUE }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">高評価数</p>
                  <p className="text-2xl font-bold">{fmt(report.likes)}</p>
                </div>
              </CardContent>
            </Card>
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
                  <p className="text-2xl font-bold">{report.total_watch_time || "-"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* === AUDIENCE TAB === */}
        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gender donut */}
            {genderData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    性別
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DonutChart data={genderDonut} centerLabel="性別" height={200} />
                  <ChartLegend
                    data={genderDonut.map((d) => ({
                      name: d.name,
                      value: d.value,
                      color: d.color,
                      display: `${(d.value * 100).toFixed(1)}%`,
                    }))}
                  />
                </CardContent>
              </Card>
            )}

            {/* Device donut */}
            {deviceData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    デバイス
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DonutChart data={deviceDonut} centerLabel="デバイス" height={200} />
                  <ChartLegend
                    data={deviceDonut.map((d) => ({
                      name: d.name,
                      value: d.value,
                      color: d.color,
                      display: `${(d.value * 100).toFixed(1)}%`,
                    }))}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Age pie chart */}
          {ageData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  年齢層
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart data={ageData.map((d, i) => ({ ...d, color: DONUT_COLORS[i % DONUT_COLORS.length] }))} centerLabel="年齢" height={220} />
                <ChartLegend
                  data={ageData.map((d, i) => ({
                    name: d.name,
                    value: d.value,
                    color: DONUT_COLORS[i % DONUT_COLORS.length],
                    display: `${(d.value * 100).toFixed(1)}%`,
                  }))}
                />
              </CardContent>
            </Card>
          )}

          {/* Region list */}
          {regionData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  上位の地域
                </CardTitle>
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
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${(r.value / maxVal) * 100}%`,
                                backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
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
                コメント・レビュー
              </CardTitle>
              <CardDescription>画像から抽出されたコメント本文</CardDescription>
            </CardHeader>
            <CardContent>
              {(report as any).comment_texts && (report as any).comment_texts.length > 0 ? (() => {
                const allComments: { body: string }[] = (report as any).comment_texts;
                const totalPages = Math.ceil(allComments.length / COMMENTS_PER_PAGE);
                const currentComments = allComments.slice(commentPage * COMMENTS_PER_PAGE, (commentPage + 1) * COMMENTS_PER_PAGE);
                return (
                  <div className="space-y-3">
                    {currentComments.map((comment, i) => {
                      const realIdx = commentPage * COMMENTS_PER_PAGE + i;
                      return (
                        <div key={realIdx} className="group flex items-start gap-2 p-3 rounded-lg border bg-muted/30 text-sm leading-relaxed">
                          <span className="flex-1">{comment.body}</span>
                          <button
                            type="button"
                            title="このコメントを削除"
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            onClick={async () => {
                              const updated = allComments.filter((_, idx) => idx !== realIdx);
                              try {
                                await analyticsApi.update(report.id, { comment_texts: updated } as any);
                                queryClient.invalidateQueries({ queryKey: ["analytics-report", id] });
                                toast({ title: "コメントを削除しました" });
                                if (commentPage >= Math.ceil(updated.length / COMMENTS_PER_PAGE)) {
                                  setCommentPage(Math.max(0, commentPage - 1));
                                }
                              } catch {
                                toast({ title: "削除に失敗しました", variant: "destructive" });
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
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
      {report.source_images?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              解析元の画像
            </CardTitle>
            <CardDescription>{report.source_images.length}枚のスクリーンショットから解析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {report.source_images.map((url, i) => (
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

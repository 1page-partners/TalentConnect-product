import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { analyticsApi, type AnalyticsReport } from "@/lib/analytics-api";
import { formatDate } from "@/lib/api";
import {
  ArrowLeft, Edit2, Save, X, RefreshCw, Loader2,
  Eye, MousePointerClick, Clock, ThumbsUp, TrendingUp,
  Users, Globe, Monitor, Image as ImageIcon,
} from "lucide-react";
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
      const result = await analyticsApi.analyzeImages({
        imageUrls: report.source_images,
        campaignId: report.campaign_id || undefined,
        title: report.title,
      });
      toast({ title: "再解析完了" });
      navigate(`/admin/analytics/${result.report.id}`);
    } catch {
      toast({ title: "再解析エラー", variant: "destructive" });
    } finally {
      setReanalyzing(false);
    }
  };

  const toChartData = (obj: Record<string, number> | null | undefined) =>
    obj ? Object.entries(obj).map(([name, value]) => ({ name, value: Number(value) })) : [];

  const trafficData = toChartData(report.traffic_sources);
  const ageData = toChartData(report.audience_age);
  const genderData = toChartData(report.audience_gender);
  const regionData = toChartData(report.audience_region);
  const deviceData = toChartData(report.devices);

  // Prepare donut data with colors
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="高評価" value={fmt(report.likes)} sub={report.like_rate != null ? `高評価率 ${pct(report.like_rate)}` : undefined} />
        <KpiTile label="視聴維持率" value={pct(report.retention_rate)} />
        <KpiTile label="総再生時間" value={report.total_watch_time || "-"} />
        <KpiTile label="画像数" value={`${report.source_images?.length || 0} 枚`} />
      </div>

      {/* Age & Gender - always visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gender donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              性別
            </CardTitle>
          </CardHeader>
          <CardContent>
            {genderData.length > 0 ? (
              <>
                <DonutChart data={genderDonut} centerLabel="性別" height={200} />
                <ChartLegend
                  data={genderDonut.map((d) => ({
                    name: d.name,
                    value: d.value,
                    color: d.color,
                    display: `${(d.value * 100).toFixed(1)}%`,
                  }))}
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                データなし
              </div>
            )}
          </CardContent>
        </Card>

        {/* Age bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              年齢層
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ageData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {ageData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                データなし
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* ===== TABS: YouTube Studio style ===== */}
      <Tabs defaultValue="reach" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="reach">リーチ</TabsTrigger>
          <TabsTrigger value="engagement">エンゲージメント</TabsTrigger>
          <TabsTrigger value="audience">視聴者</TabsTrigger>
        </TabsList>

        {/* === REACH TAB === */}
        <TabsContent value="reach" className="space-y-6">
          {/* Impression → View Funnel */}
          <ImpressionFunnel impressions={report.impressions} views={report.views} ctr={report.ctr} />

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

          {/* Age distribution bar */}
          {ageData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  年齢層
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={ageData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip
                      formatter={(v: number) => `${(v * 100).toFixed(1)}%`}
                      contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {ageData.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
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
      </Tabs>

      <Separator />

      {/* Source images */}
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

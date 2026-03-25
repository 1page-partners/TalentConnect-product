import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { analyticsApi, type AnalyticsReport } from "@/lib/analytics-api";
import { formatDate } from "@/lib/api";
import {
  ArrowLeft, Edit2, Save, X, RefreshCw, Loader2,
  Eye, MousePointerClick, Clock, ThumbsUp, BarChart3,
  Monitor, Smartphone, Tablet, Tv,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
];

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
        </div>
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p>レポートが見つかりません</p>
        <Button variant="link" onClick={() => navigate("/admin/analytics")}>
          一覧に戻る
        </Button>
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/analytics")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{report.title || "レポート"}</h1>
            <p className="text-sm text-muted-foreground">{formatDate(report.created_at)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReanalyze} disabled={reanalyzing}>
            {reanalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-1">再解析</span>
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
              <Edit2 className="h-4 w-4 mr-1" />手動編集
            </Button>
          )}
        </div>
      </div>

      {/* KPI cards */}
      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">指標を編集</CardTitle>
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
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon={Eye} label="インプレッション" value={fmt(report.impressions)} />
          <MetricCard icon={MousePointerClick} label="CTR" value={pct(report.ctr)} />
          <MetricCard icon={BarChart3} label="再生回数" value={fmt(report.views)} />
          <MetricCard icon={Clock} label="平均視聴時間" value={report.avg_watch_time || "-"} />
        </div>
      )}

      {/* Engagement row */}
      {!editing && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <MetricCard icon={ThumbsUp} label="高評価" value={fmt(report.likes)} sub={report.like_rate != null ? `高評価率 ${pct(report.like_rate)}` : undefined} />
          <MetricCard icon={Eye} label="視聴維持率" value={pct(report.retention_rate)} />
          <MetricCard icon={Clock} label="総再生時間" value={report.total_watch_time || "-"} />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        {trafficData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">流入経路</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={trafficData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${(value * 100).toFixed(1)}%`}>
                    {trafficData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Age distribution */}
        {ageData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">年齢分布</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Gender distribution */}
        {genderData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">性別分布</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${(value * 100).toFixed(1)}%`}>
                    {genderData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Device distribution */}
        {deviceData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">デバイス</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={deviceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
                  <Bar dataKey="value" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Region */}
      {regionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">地域</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {regionData.sort((a, b) => b.value - a.value).map((r) => (
                <div key={r.name} className="flex items-center justify-between text-sm">
                  <span>{r.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${r.value * 100}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground w-14 text-right">
                      {(r.value * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source images */}
      {report.source_images?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">元画像</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {report.source_images.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt={`Source ${i + 1}`} className="rounded-md border w-full h-auto" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

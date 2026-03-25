import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Eye, Clock, ThumbsUp, TrendingUp, Users, Globe, Monitor, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

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

function KpiTile({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-xl bg-white border shadow-sm">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-2xl md:text-3xl font-bold" style={color ? { color } : undefined}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

function DonutChart({ data, centerLabel, height = 220 }: { data: { name: string; value: number; color?: string }[]; centerLabel?: string; height?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} strokeWidth={0}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color || DONUT_COLORS[i % DONUT_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number) => total <= 1 ? `${(v * 100).toFixed(1)}%` : v.toLocaleString()}
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
        />
        {centerLabel && (
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-sm font-semibold fill-gray-800">
            {centerLabel}
          </text>
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}

function ChartLegend({ data }: { data: { name: string; value: number; color: string; display: string }[] }) {
  return (
    <div className="space-y-2 mt-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-gray-500">{d.name}</span>
          </div>
          <span className="font-medium">{d.display}</span>
        </div>
      ))}
    </div>
  );
}

function RetentionChart({ retentionRate }: { retentionRate: number | null }) {
  if (retentionRate == null) return null;
  const rate = Number(retentionRate);
  const points = Array.from({ length: 21 }, (_, i) => {
    const t = i * 5;
    const dropoff = i === 0 ? 1 : Math.max(rate * Math.exp(-0.015 * t) + (1 - rate) * 0.1, 0.02);
    return { time: `${t}%`, retention: Math.round(dropoff * 1000) / 10 };
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2"><Eye className="h-4 w-4" />視聴維持率</CardTitle>
        <CardDescription>平均視聴維持率: <span className="font-semibold text-gray-800">{(rate * 100).toFixed(1)}%</span></CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={points}>
            <defs>
              <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={YT_BLUE} stopOpacity={0.3} />
                <stop offset="100%" stopColor={YT_BLUE} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} label={{ value: "動画の長さ", position: "insideBottom", offset: -5, fontSize: 12, fill: "#9ca3af" }} />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={50} label={{ value: "視聴者", angle: -90, position: "insideLeft", offset: 10, fontSize: 12, fill: "#9ca3af" }} />
            <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
            <Area type="monotone" dataKey="retention" stroke={YT_BLUE} strokeWidth={2.5} fill="url(#retGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default function PublicReport() {
  const { token } = useParams<{ token: string }>();
  const [commentPage, setCommentPage] = useState(0);
  const COMMENTS_PER_PAGE = 5;

  const { data: report, isLoading, error } = useQuery({
    queryKey: ["public-report", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_reports" as any)
        .select("*")
        .eq("share_token", token)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500">レポートが見つかりません</p>
      </div>
    );
  }

  const fmt = (n: number | null) => (n != null ? n.toLocaleString("ja-JP") : "-");
  const pct = (n: number | null) => (n != null ? `${(Number(n) * 100).toFixed(1)}%` : "-");

  const toChartData = (obj: Record<string, number> | null | undefined) =>
    obj ? Object.entries(obj).map(([name, value]) => ({ name, value: Number(value) })) : [];

  const trafficData = toChartData(report.traffic_sources);
  const ageData = toChartData(report.audience_age);
  const genderData = toChartData(report.audience_gender);
  const deviceData = toChartData(report.devices);

  const genderDonut = genderData.map((d, i) => ({ ...d, color: GENDER_COLORS[d.name.toLowerCase()] || GENDER_COLORS[d.name] || DONUT_COLORS[i] }));
  const deviceDonut = deviceData.map((d, i) => ({ ...d, color: DONUT_COLORS[i % DONUT_COLORS.length] }));
  const trafficDonut = trafficData.map((d, i) => ({ ...d, color: DONUT_COLORS[i % DONUT_COLORS.length] }));

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{report.title || "レポート"}</h1>
          <p className="text-sm text-gray-500">Analytics Report</p>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile label="視聴回数" value={fmt(report.views)} color={YT_BLUE} />
          <KpiTile label="インプレッション" value={fmt(report.impressions)} color={YT_GREEN} />
          <KpiTile label="クリック率 (CTR)" value={pct(report.ctr)} color={YT_PURPLE} />
          <KpiTile label="平均視聴時間" value={report.avg_watch_time || "-"} color={YT_ORANGE} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KpiTile label="高評価" value={fmt(report.likes)} sub={report.like_rate != null ? `高評価率 ${pct(report.like_rate)}` : undefined} />
          <KpiTile label="視聴維持率" value={pct(report.retention_rate)} />
          <KpiTile label="総再生時間" value={report.total_watch_time ? `${report.total_watch_time}時間` : "-"} />
        </div>

        <Separator />

        {/* Tabs */}
        <Tabs defaultValue="reach" className="space-y-4">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="reach">リーチ</TabsTrigger>
            <TabsTrigger value="engagement">エンゲージメント</TabsTrigger>
            <TabsTrigger value="audience">視聴者</TabsTrigger>
            <TabsTrigger value="comments">コメント</TabsTrigger>
          </TabsList>

          {/* Reach */}
          <TabsContent value="reach" className="space-y-6">
            {trafficData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" />トラフィックソース</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <DonutChart data={trafficDonut} centerLabel="流入" />
                    <ChartLegend data={trafficDonut.map((d) => ({ name: d.name, value: d.value, color: d.color, display: d.value <= 1 ? `${(d.value * 100).toFixed(1)}%` : d.value.toLocaleString() }))} />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Engagement */}
          <TabsContent value="engagement" className="space-y-6">
            <RetentionChart retentionRate={report.retention_rate} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-full" style={{ backgroundColor: `${YT_GREEN}15` }}>
                    <TrendingUp className="h-6 w-6" style={{ color: YT_GREEN }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">高評価率</p>
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
                    <p className="text-xs text-gray-500">総再生時間</p>
                    <p className="text-2xl font-bold">{report.total_watch_time || "-"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audience */}
          <TabsContent value="audience" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {genderData.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />性別</CardTitle></CardHeader>
                  <CardContent>
                    <DonutChart data={genderDonut} centerLabel="性別" height={200} />
                    <ChartLegend data={genderDonut.map((d) => ({ name: d.name, value: d.value, color: d.color, display: `${(d.value * 100).toFixed(1)}%` }))} />
                  </CardContent>
                </Card>
              )}
              {deviceData.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Monitor className="h-4 w-4" />デバイス</CardTitle></CardHeader>
                  <CardContent>
                    <DonutChart data={deviceDonut} centerLabel="デバイス" height={200} />
                    <ChartLegend data={deviceDonut.map((d) => ({ name: d.name, value: d.value, color: d.color, display: `${(d.value * 100).toFixed(1)}%` }))} />
                  </CardContent>
                </Card>
              )}
            </div>
            {ageData.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />年齢層</CardTitle></CardHeader>
                <CardContent>
                  <DonutChart data={ageData.map((d, i) => ({ ...d, color: DONUT_COLORS[i % DONUT_COLORS.length] }))} centerLabel="年齢" height={220} />
                  <ChartLegend data={ageData.map((d, i) => ({ name: d.name, value: d.value, color: DONUT_COLORS[i % DONUT_COLORS.length], display: `${(d.value * 100).toFixed(1)}%` }))} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Comments */}
          <TabsContent value="comments" className="space-y-6">
            {(() => {
              const visibleComments = (report.comment_texts || []).filter((c: any) => !c.hidden);
              if (visibleComments.length === 0) {
                return (
                  <div className="flex items-center justify-center h-[200px] text-sm text-gray-400">
                    コメントなし
                  </div>
                );
              }
              const totalPages = Math.ceil(visibleComments.length / COMMENTS_PER_PAGE);
              const pageComments = visibleComments.slice(commentPage * COMMENTS_PER_PAGE, (commentPage + 1) * COMMENTS_PER_PAGE);
              return (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" />コメント</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pageComments.map((comment: { body: string }, i: number) => (
                        <div key={i} className="p-3 rounded-lg border bg-gray-50 text-sm leading-relaxed">
                          {comment.body}
                        </div>
                      ))}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <Button variant="outline" size="sm" disabled={commentPage === 0} onClick={() => setCommentPage(p => p - 1)}>
                            前へ
                          </Button>
                          <span className="text-sm text-gray-500">{commentPage + 1} / {totalPages}</span>
                          <Button variant="outline" size="sm" disabled={commentPage >= totalPages - 1} onClick={() => setCommentPage(p => p + 1)}>
                            次へ
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </TabsContent>
        </Tabs>

        {/* Manager comment */}
        {report.manager_comment && (
          <>
            <Separator />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">担当者コメント</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.manager_comment}</p>
              </CardContent>
            </Card>
          </>
        )}

        <div className="text-center text-xs text-gray-400 py-4">
          Powered by TalentConnect Analytics
        </div>
      </div>
    </div>
  );
}

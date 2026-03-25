import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { analyticsApi, type AnalyticsReport } from "@/lib/analytics-api";
import { formatDate } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, BarChart3, Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AnalyticsReportList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["analytics-reports"],
    queryFn: analyticsApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => analyticsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics-reports"] });
      toast({ title: "レポートを削除しました" });
    },
    onError: () => {
      toast({ title: "削除に失敗しました", variant: "destructive" });
    },
  });

  const formatNumber = (n: number | null) => {
    if (n == null) return "-";
    return n.toLocaleString("ja-JP");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">レポートダッシュボード</h1>
          <p className="text-muted-foreground text-sm">
            画像解析によるYouTubeアナリティクスレポート
          </p>
        </div>
        <Button onClick={() => navigate("/admin/analytics/new")}>
          <PlusCircle className="h-4 w-4 mr-2" />
          新規レポート作成
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">レポートがありません</h3>
            <p className="text-muted-foreground mb-4">
              YouTubeアナリティクスのスクリーンショットをアップロードして、最初のレポートを作成しましょう
            </p>
            <Button onClick={() => navigate("/admin/analytics/new")}>
              <PlusCircle className="h-4 w-4 mr-2" />
              レポートを作成
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="cursor-pointer hover:shadow-md transition-shadow relative group"
              onClick={() => navigate(`/admin/analytics/${report.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-1">
                    {report.title || "無題のレポート"}
                  </CardTitle>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {report.source_images?.length || 0}枚
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
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
                            onClick={() => deleteMutation.mutate(report.id)}
                          >
                            削除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(report.created_at)}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">再生回数</p>
                    <p className="font-semibold">{formatNumber(report.views)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">インプレッション</p>
                    <p className="font-semibold">{formatNumber(report.impressions)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">CTR</p>
                    <p className="font-semibold">
                      {report.ctr != null ? `${(Number(report.ctr) * 100).toFixed(1)}%` : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">高評価</p>
                    <p className="font-semibold">{formatNumber(report.likes)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
  const navigate = useNavigate();
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["analytics-reports"],
    queryFn: analyticsApi.getAll,
  });

  const formatNumber = (n: number | null) => {
    if (n == null) return "-";
    return n.toLocaleString("ja-JP");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">レポートダッシュボード</h1>
          <p className="text-muted-foreground text-sm">
            画像解析によるYouTubeアナリティクスレポート
          </p>
        </div>
        <Button onClick={() => navigate("/admin/analytics/new")}>
          <PlusCircle className="h-4 w-4 mr-2" />
          新規レポート作成
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">レポートがありません</h3>
            <p className="text-muted-foreground mb-4">
              YouTubeアナリティクスのスクリーンショットをアップロードして、最初のレポートを作成しましょう
            </p>
            <Button onClick={() => navigate("/admin/analytics/new")}>
              <PlusCircle className="h-4 w-4 mr-2" />
              レポートを作成
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/admin/analytics/${report.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-1">
                    {report.title || "無題のレポート"}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {report.source_images?.length || 0}枚
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(report.created_at)}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">再生回数</p>
                    <p className="font-semibold">{formatNumber(report.views)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">インプレッション</p>
                    <p className="font-semibold">{formatNumber(report.impressions)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">CTR</p>
                    <p className="font-semibold">
                      {report.ctr != null ? `${(Number(report.ctr) * 100).toFixed(1)}%` : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">高評価</p>
                    <p className="font-semibold">{formatNumber(report.likes)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

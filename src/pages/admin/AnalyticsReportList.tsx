import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { analyticsApi, type AnalyticsReport } from "@/lib/analytics-api";
import { formatDate } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  PlusCircle, BarChart3, Loader2, Trash2, FolderPlus, Folder, FolderOpen,
  ArrowLeft, MoreVertical, FolderInput,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

export default function AnalyticsReportList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

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

  const moveToFolder = async (reportId: string, folder: string | null) => {
    try {
      await analyticsApi.update(reportId, { folder } as any);
      queryClient.invalidateQueries({ queryKey: ["analytics-reports"] });
      toast({ title: folder ? `「${folder}」に移動しました` : "フォルダから取り出しました" });
    } catch {
      toast({ title: "移動に失敗しました", variant: "destructive" });
    }
  };

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    // Folder is just a label on reports - no separate table needed
    // We just set the current view to this folder
    setCurrentFolder(newFolderName.trim());
    setNewFolderDialogOpen(false);
    setNewFolderName("");
    toast({ title: `フォルダ「${newFolderName.trim()}」を作成しました` });
  };

  const formatNumber = (n: number | null) => {
    if (n == null) return "-";
    return n.toLocaleString("ja-JP");
  };

  // Get unique folder names
  const folders = Array.from(new Set(reports.map((r) => r.folder).filter(Boolean))) as string[];

  // Filter reports by current folder
  const filteredReports = currentFolder
    ? reports.filter((r) => r.folder === currentFolder)
    : reports.filter((r) => !r.folder);

  const unfolderedCount = reports.filter((r) => !r.folder).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">レポートダッシュボード</h1>
          <p className="text-muted-foreground text-sm">
            画像解析によるYouTubeアナリティクスレポート
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setNewFolderDialogOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            フォルダ作成
          </Button>
          <Button onClick={() => navigate("/admin/analytics/new")}>
            <PlusCircle className="h-4 w-4 mr-2" />
            新規レポート
          </Button>
        </div>
      </div>

      {/* Folder navigation */}
      {(folders.length > 0 || currentFolder) && (
        <div className="flex flex-wrap items-center gap-2">
          {currentFolder && (
            <Button variant="ghost" size="sm" onClick={() => setCurrentFolder(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              戻る
            </Button>
          )}
          <Button
            variant={currentFolder === null ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentFolder(null)}
          >
            すべて ({unfolderedCount})
          </Button>
          {folders.map((folder) => {
            const count = reports.filter((r) => r.folder === folder).length;
            return (
              <Button
                key={folder}
                variant={currentFolder === folder ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentFolder(folder)}
                className="gap-1"
              >
                {currentFolder === folder ? (
                  <FolderOpen className="h-4 w-4" />
                ) : (
                  <Folder className="h-4 w-4" />
                )}
                {folder} ({count})
              </Button>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredReports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {currentFolder ? `「${currentFolder}」にレポートがありません` : "レポートがありません"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {currentFolder
                ? "レポートをこのフォルダに移動してください"
                : "YouTubeアナリティクスのスクリーンショットをアップロードして、最初のレポートを作成しましょう"
              }
            </p>
            {!currentFolder && (
              <Button onClick={() => navigate("/admin/analytics/new")}>
                <PlusCircle className="h-4 w-4 mr-2" />
                レポートを作成
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => (
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
                    {report.folder && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Folder className="h-3 w-3" />
                        {report.folder}
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        {folders.length > 0 && (
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <FolderInput className="h-4 w-4 mr-2" />
                              フォルダに移動
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {report.folder && (
                                <DropdownMenuItem onClick={() => moveToFolder(report.id, null)}>
                                  フォルダから取り出す
                                </DropdownMenuItem>
                              )}
                              {folders
                                .filter((f) => f !== report.folder)
                                .map((folder) => (
                                  <DropdownMenuItem key={folder} onClick={() => moveToFolder(report.id, folder)}>
                                    <Folder className="h-4 w-4 mr-2" />
                                    {folder}
                                  </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        )}
                        {report.folder && (
                          <DropdownMenuItem onClick={() => moveToFolder(report.id, null)}>
                            フォルダから取り出す
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              削除
                            </DropdownMenuItem>
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
                                onClick={() => deleteMutation.mutate(report.id)}
                              >
                                削除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                    <p className="text-muted-foreground text-xs">高評価率</p>
                    <p className="font-semibold">
                      {report.like_rate != null ? `${(Number(report.like_rate) * 100).toFixed(1)}%` : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New folder dialog */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新しいフォルダを作成</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="フォルダ名を入力..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialogOpen(false)}>キャンセル</Button>
            <Button onClick={createFolder} disabled={!newFolderName.trim()}>作成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

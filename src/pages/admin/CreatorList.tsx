import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getAllSubmissionsWithCampaign, creatorListApi, CreatorList as CreatorListType, InfluencerSubmission } from '@/lib/api';
import { Search, Loader2, Mail, FolderPlus, MoreHorizontal, Pencil, Trash2, Users, ExternalLink, ListPlus, Folder, X } from 'lucide-react';
import { SocialIconsList } from '@/components/SocialIcons';

type SubmissionWithCampaign = InfluencerSubmission & { campaign_title: string; campaign_slug: string };

const CreatorListPage = () => {
  const [submissions, setSubmissions] = useState<SubmissionWithCampaign[]>([]);
  const [myLists, setMyLists] = useState<CreatorListType[]>([]);
  const [listItemsMap, setListItemsMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [newListName, setNewListName] = useState('');
  const [editingList, setEditingList] = useState<CreatorListType | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // 検索のデバウンス処理
  useEffect(() => {
    if (searchKeyword !== debouncedKeyword) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setDebouncedKeyword(searchKeyword);
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchKeyword, debouncedKeyword]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [submissionsData, listsData] = await Promise.all([
        getAllSubmissionsWithCampaign(),
        creatorListApi.getAll()
      ]);
      setSubmissions(submissionsData);
      setMyLists(listsData);

      const itemsMap: Record<string, string[]> = {};
      for (const list of listsData) {
        const items = await creatorListApi.getItems(list.id);
        itemsMap[list.id] = items;
      }
      setListItemsMap(itemsMap);
    } catch (error) {
      console.error('データ取得エラー:', error);
      toast({ title: 'エラー', description: 'データの取得に失敗しました', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim() || !user) return;
    try {
      const newList = await creatorListApi.create(newListName.trim(), user.id);
      setMyLists(prev => [newList, ...prev]);
      setListItemsMap(prev => ({ ...prev, [newList.id]: [] }));
      setNewListName('');
      setIsCreateDialogOpen(false);
      toast({ title: 'リストを作成しました', description: newListName });
    } catch (error) {
      console.error('リスト作成エラー:', error);
      toast({ title: 'エラー', description: 'リストの作成に失敗しました', variant: 'destructive' });
    }
  };

  const handleUpdateList = async () => {
    if (!editingList || !newListName.trim()) return;
    try {
      const updated = await creatorListApi.update(editingList.id, newListName.trim());
      setMyLists(prev => prev.map(l => l.id === updated.id ? updated : l));
      setEditingList(null);
      setNewListName('');
      toast({ title: 'リスト名を更新しました' });
    } catch (error) {
      console.error('リスト更新エラー:', error);
      toast({ title: 'エラー', description: 'リストの更新に失敗しました', variant: 'destructive' });
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await creatorListApi.delete(listId);
      setMyLists(prev => prev.filter(l => l.id !== listId));
      const newMap = { ...listItemsMap };
      delete newMap[listId];
      setListItemsMap(newMap);
      if (activeTab === listId) setActiveTab('all');
      toast({ title: 'リストを削除しました' });
    } catch (error) {
      console.error('リスト削除エラー:', error);
      toast({ title: 'エラー', description: 'リストの削除に失敗しました', variant: 'destructive' });
    }
  };

  const handleToggleListItem = async (listId: string, submissionId: string) => {
    const currentItems = listItemsMap[listId] || [];
    const isInList = currentItems.includes(submissionId);
    
    try {
      if (isInList) {
        await creatorListApi.removeItem(listId, submissionId);
        setListItemsMap(prev => ({
          ...prev,
          [listId]: prev[listId].filter(id => id !== submissionId)
        }));
        toast({ title: 'リストから削除しました' });
      } else {
        await creatorListApi.addItem(listId, submissionId);
        setListItemsMap(prev => ({
          ...prev,
          [listId]: [...(prev[listId] || []), submissionId]
        }));
        toast({ title: 'リストに追加しました' });
      }
    } catch (error) {
      console.error('リストアイテム操作エラー:', error);
      toast({ title: 'エラー', description: '操作に失敗しました', variant: 'destructive' });
    }
  };

  // 現在のタブ（リスト）にクリエイターを追加
  const handleAddToCurrentList = async (submissionId: string) => {
    if (activeTab === 'all') return;
    await handleToggleListItem(activeTab, submissionId);
  };

  const getPlatforms = (submission: SubmissionWithCampaign): string[] => {
    const platforms: string[] = [];
    if (submission.instagram) platforms.push('Instagram');
    if (submission.tiktok) platforms.push('TikTok');
    if (submission.youtube) platforms.push('YouTube');
    if (submission.red) platforms.push('RED');
    if (submission.x_twitter) platforms.push('X');
    // other_sns から他のプラットフォームを取得
    if (submission.other_sns) {
      try {
        const others = submission.other_sns as Array<{platform: string; url: string}>;
        if (Array.isArray(others)) {
          others.forEach(p => {
            if (p.platform && !platforms.includes(p.platform)) {
              platforms.push(p.platform);
            }
          });
        }
      } catch {}
    }
    return platforms;
  };

  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;
    
    if (debouncedKeyword) {
      const keyword = debouncedKeyword.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(keyword) ||
        s.email?.toLowerCase().includes(keyword) ||
        s.campaign_title.toLowerCase().includes(keyword)
      );
    }
    
    if (activeTab !== 'all') {
      const listItems = listItemsMap[activeTab] || [];
      filtered = filtered.filter(s => listItems.includes(s.id));
    }
    
    return filtered;
  }, [submissions, debouncedKeyword, activeTab, listItemsMap]);

  // 現在のリストに含まれていないクリエイター（追加候補）
  const availableForCurrentList = useMemo(() => {
    if (activeTab === 'all') return [];
    const listItems = listItemsMap[activeTab] || [];
    return submissions.filter(s => !listItems.includes(s.id));
  }, [submissions, activeTab, listItemsMap]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const CreatorCard = ({ submission, showAddButton = false }: { submission: SubmissionWithCampaign; showAddButton?: boolean }) => {
    const platforms = getPlatforms(submission);
    const isInAnyList = Object.values(listItemsMap).some(items => items.includes(submission.id));

    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
        <Link to={`/admin/creator/${submission.id}`} className="font-medium hover:text-primary transition-colors truncate min-w-[120px] max-w-[180px]">
          {submission.name}
        </Link>
        
        <div className="flex items-center gap-1.5 shrink-0">
          <SocialIconsList platforms={platforms} />
        </div>

        {submission.email && (
          <span className="hidden md:flex items-center gap-1 text-sm text-muted-foreground truncate max-w-[200px]">
            <Mail className="h-3 w-3 shrink-0" />{submission.email}
          </span>
        )}

        {isInAnyList && <Badge variant="secondary" className="shrink-0 hidden sm:inline-flex">登録済</Badge>}

        <div className="flex items-center gap-2 ml-auto shrink-0">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/admin/creator/${submission.id}`}>詳細</Link>
          </Button>
          {myLists.length > 0 && (
            showAddButton && activeTab !== 'all' ? (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => handleAddToCurrentList(submission.id)}
              >
                <ListPlus className="h-4 w-4" />
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ListPlus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {myLists.map(list => (
                    <DropdownMenuItem key={list.id} onClick={() => handleToggleListItem(list.id, submission.id)}>
                      <Checkbox checked={listItemsMap[list.id]?.includes(submission.id)} className="mr-2" />
                      {list.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">クリエイターリスト</h1>
          <p className="text-muted-foreground">全 {submissions.length} 名のクリエイター</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button><FolderPlus className="h-4 w-4 mr-2" />新規リスト作成</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規マイリスト作成</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="リスト名を入力..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">キャンセル</Button>
              </DialogClose>
              <Button onClick={handleCreateList} disabled={!newListName.trim()}>作成</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 検索 */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="relative">
              {isSearching ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              )}
              <Input
                placeholder="名前、メール、案件名で検索..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {debouncedKeyword && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>「{debouncedKeyword}」の検索結果:</span>
                <Badge variant="secondary">{filteredSubmissions.length} 件</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* タブ */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="all" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            すべて ({submissions.length})
          </TabsTrigger>
          {myLists.map(list => (
            <div key={list.id} className="flex items-center">
              <TabsTrigger value={list.id} className="flex items-center gap-1 pr-1">
                <Folder className="h-4 w-4" />
                {list.name} ({listItemsMap[list.id]?.length || 0})
              </TabsTrigger>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => { setEditingList(list); setNewListName(list.name); }}>
                    <Pencil className="h-4 w-4 mr-2" />名前を変更
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDeleteList(list.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-6">
          {/* リストタブの場合、追加候補を表示 */}
          {activeTab !== 'all' && availableForCurrentList.length > 0 && (
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-muted-foreground">クリエイターを追加</h3>
                  <Badge variant="outline">{availableForCurrentList.length} 名追加可能</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {availableForCurrentList.slice(0, 6).map(submission => (
                    <div key={submission.id} className="flex items-center justify-between p-2 border rounded-lg bg-muted/30">
                      <Link to={`/admin/creator/${submission.id}`} className="text-sm font-medium hover:text-primary truncate flex-1">
                        {submission.name}
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleAddToCurrentList(submission.id)}>
                        <ListPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {availableForCurrentList.length > 6 && (
                  <p className="text-xs text-muted-foreground mt-2">他 {availableForCurrentList.length - 6} 名...</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* クリエイター一覧 */}
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {activeTab === 'all' ? 'クリエイターはまだいません' : 'このリストにクリエイターはいません'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredSubmissions.map(submission => (
                <CreatorCard key={submission.id} submission={submission} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* リスト名編集ダイアログ */}
      <Dialog open={!!editingList} onOpenChange={(open) => { if (!open) { setEditingList(null); setNewListName(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>リスト名を変更</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="リスト名を入力..."
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdateList()}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">キャンセル</Button>
            </DialogClose>
            <Button onClick={handleUpdateList} disabled={!newListName.trim()}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreatorListPage;
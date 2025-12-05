import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getAllSubmissionsWithCampaign, creatorListApi, CreatorList as CreatorListType, InfluencerSubmission } from '@/lib/api';
import { Search, Loader2, Mail, Phone, Plus, FolderPlus, MoreHorizontal, Pencil, Trash2, Star, Users, ExternalLink } from 'lucide-react';
import { SocialIconsList } from '@/components/SocialIcons';

type SubmissionWithCampaign = InfluencerSubmission & { campaign_title: string; campaign_slug: string };

const CreatorListPage = () => {
  const [submissions, setSubmissions] = useState<SubmissionWithCampaign[]>([]);
  const [myLists, setMyLists] = useState<CreatorListType[]>([]);
  const [listItemsMap, setListItemsMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [newListName, setNewListName] = useState('');
  const [editingList, setEditingList] = useState<CreatorListType | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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

      // 各リストのアイテムを取得
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
      } else {
        await creatorListApi.addItem(listId, submissionId);
        setListItemsMap(prev => ({
          ...prev,
          [listId]: [...(prev[listId] || []), submissionId]
        }));
      }
    } catch (error) {
      console.error('リストアイテム操作エラー:', error);
      toast({ title: 'エラー', description: '操作に失敗しました', variant: 'destructive' });
    }
  };

  const getFollowers = (data: any, key: string): number | null => {
    if (!data || typeof data !== 'object') return null;
    return data[key] ?? null;
  };

  const getPlatforms = (submission: SubmissionWithCampaign): string[] => {
    const platforms: string[] = [];
    if (submission.instagram) platforms.push('Instagram');
    if (submission.tiktok) platforms.push('TikTok');
    if (submission.youtube) platforms.push('YouTube');
    if (submission.red) platforms.push('RED');
    return platforms;
  };

  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;
    
    // 検索フィルタ
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(s => 
        s.influencer_name.toLowerCase().includes(keyword) ||
        s.email?.toLowerCase().includes(keyword) ||
        s.campaign_title.toLowerCase().includes(keyword)
      );
    }
    
    // タブフィルタ
    if (activeTab !== 'all') {
      const listItems = listItemsMap[activeTab] || [];
      filtered = filtered.filter(s => listItems.includes(s.id));
    }
    
    return filtered;
  }, [submissions, searchKeyword, activeTab, listItemsMap]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const CreatorCard = ({ submission }: { submission: SubmissionWithCampaign }) => {
    const igFollowers = getFollowers(submission.instagram, 'followers');
    const ttFollowers = getFollowers(submission.tiktok, 'followers');
    const ytSubs = getFollowers(submission.youtube, 'subscribers');
    const platforms = getPlatforms(submission);

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg truncate">{submission.influencer_name}</h3>
                {myLists.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Star className={`h-4 w-4 ${Object.values(listItemsMap).some(items => items.includes(submission.id)) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {myLists.map(list => (
                        <DropdownMenuItem key={list.id} onClick={() => handleToggleListItem(list.id, submission.id)}>
                          <Checkbox checked={listItemsMap[list.id]?.includes(submission.id)} className="mr-2" />
                          {list.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {submission.email && (
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{submission.email}</span>
                )}
                {submission.phone && (
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{submission.phone}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <SocialIconsList platforms={platforms} />
              </div>

              <div className="flex flex-wrap gap-1.5 text-xs">
                {igFollowers && <Badge variant="outline">IG: {igFollowers.toLocaleString()}</Badge>}
                {ttFollowers && <Badge variant="outline">TT: {ttFollowers.toLocaleString()}</Badge>}
                {ytSubs && <Badge variant="outline">YT: {ytSubs.toLocaleString()}</Badge>}
              </div>

              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-1">応募案件</div>
                <Link to={`/admin/campaign/${submission.campaign_id}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                  {submission.campaign_title}
                  <ExternalLink className="h-3 w-3" />
                </Link>
                <div className="text-xs text-muted-foreground mt-1">応募日: {formatDate(submission.submitted_at)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="名前、メール、案件名で検索..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-10"
            />
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
                <Star className="h-4 w-4" />
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

        <TabsContent value={activeTab} className="mt-4">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {activeTab === 'all' ? 'クリエイターはまだいません' : 'このリストにクリエイターはいません'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useFileUpload } from '@/hooks/useFileUpload';
import { FileUpload } from '@/components/ui/file-upload';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Loader2, Save, Plus, Trash2, User } from 'lucide-react';
import type { InfluencerSubmission } from '@/lib/api';

interface SocialAccount {
  platform: string;
  url: string;
}

const platformOptions = ['Instagram', 'TikTok', 'YouTube', 'X', 'RED', 'その他'];

const CreatorEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submission, setSubmission] = useState<InfluencerSubmission | null>(null);

  // Form states
  const [influencerName, setInfluencerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [lineId, setLineId] = useState('');
  const [preferredContact, setPreferredContact] = useState('');
  const [desiredFee, setDesiredFee] = useState('');
  const [notes, setNotes] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [averageViews, setAverageViews] = useState('');
  const [followerDemographics, setFollowerDemographics] = useState({
    male: 50,
    female: 50,
    age_18_24: 0,
    age_25_34: 0,
    age_35_44: 0,
    age_45_plus: 0,
  });
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  // SNS accounts
  const [mainSns, setMainSns] = useState('');
  const [mainAccount, setMainAccount] = useState('');
  const [instagram, setInstagram] = useState<{ url: string; followers: number } | null>(null);
  const [tiktok, setTiktok] = useState<{ url: string; followers: number } | null>(null);
  const [youtube, setYoutube] = useState<{ url: string; followers: number } | null>(null);
  const [red, setRed] = useState<{ url: string; followers: number } | null>(null);
  const [otherSns, setOtherSns] = useState<SocialAccount[]>([]);

  // File upload
  const profileUpload = useFileUpload({
    folder: 'profiles',
    allowedTypes: ['image/*'],
    maxSizeMB: 5,
  });

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const fetchSubmission = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('influencer_submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        toast({ title: 'エラー', description: 'データが見つかりません', variant: 'destructive' });
        navigate('/admin/creators');
        return;
      }

      setSubmission(data);
      
      // Populate form
      setInfluencerName(data.influencer_name || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
      setLineId(data.line_id || '');
      setPreferredContact(data.preferred_contact || '');
      setDesiredFee(data.desired_fee || '');
      setNotes(data.notes || '');
      setMainSns(data.main_sns || '');
      setMainAccount(data.main_account || '');
      
      // New v2 fields
      setProfileImageUrl((data as any).profile_image_url || '');
      setAverageViews((data as any).average_views?.toString() || '');
      setTags((data as any).tags || []);
      
      const demographics = (data as any).follower_demographics || {};
      setFollowerDemographics({
        male: demographics.male ?? 50,
        female: demographics.female ?? 50,
        age_18_24: demographics.age_18_24 ?? 0,
        age_25_34: demographics.age_25_34 ?? 0,
        age_35_44: demographics.age_35_44 ?? 0,
        age_45_plus: demographics.age_45_plus ?? 0,
      });
      
      // SNS data
      if (data.instagram && typeof data.instagram === 'object') {
        setInstagram(data.instagram as { url: string; followers: number });
      }
      if (data.tiktok && typeof data.tiktok === 'object') {
        setTiktok(data.tiktok as { url: string; followers: number });
      }
      if (data.youtube && typeof data.youtube === 'object') {
        setYoutube(data.youtube as { url: string; followers: number });
      }
      if (data.red && typeof data.red === 'object') {
        setRed(data.red as { url: string; followers: number });
      }
      if (data.other_sns && Array.isArray(data.other_sns)) {
        setOtherSns((data.other_sns as unknown as SocialAccount[]).filter(s => s && typeof s === 'object' && 'platform' in s && 'url' in s));
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast({ title: 'エラー', description: 'データの取得に失敗しました', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpload = async (files: FileList) => {
    const urls = await profileUpload.uploadFiles(files);
    if (urls.length > 0) {
      setProfileImageUrl(urls[0]);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAddOtherSns = () => {
    setOtherSns([...otherSns, { platform: '', url: '' }]);
  };

  const handleRemoveOtherSns = (index: number) => {
    setOtherSns(otherSns.filter((_, i) => i !== index));
  };

  const handleUpdateOtherSns = (index: number, field: 'platform' | 'url', value: string) => {
    const updated = [...otherSns];
    updated[index] = { ...updated[index], [field]: value };
    setOtherSns(updated);
  };

  const handleDemographicsChange = (field: string, value: number) => {
    setFollowerDemographics(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);

    try {
      const updateData: Record<string, any> = {
        influencer_name: influencerName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        line_id: lineId.trim() || null,
        preferred_contact: preferredContact || null,
        desired_fee: desiredFee.trim() || null,
        notes: notes.trim() || null,
        main_sns: mainSns || null,
        main_account: mainAccount.trim() || null,
        instagram: instagram,
        tiktok: tiktok,
        youtube: youtube,
        red: red,
        other_sns: otherSns.filter(s => s.platform && s.url),
        // New v2 fields
        profile_image_url: profileImageUrl || null,
        average_views: averageViews ? parseInt(averageViews) : null,
        follower_demographics: followerDemographics,
        tags: tags,
      };

      const { error } = await supabase
        .from('influencer_submissions')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({ title: '保存しました', description: 'クリエイター情報を更新しました' });
      navigate(`/admin/creator/${id}`);
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'エラー', description: '保存に失敗しました', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">クリエイターが見つかりません</p>
        <Button asChild><Link to="/admin/creators">クリエイターリストへ</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/admin/creator/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">クリエイター編集</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          保存
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* プロフィール画像 */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />プロフィール画像</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {profileImageUrl ? (
              <div className="relative w-32 h-32 mx-auto">
                <img 
                  src={profileImageUrl} 
                  alt="プロフィール" 
                  className="w-full h-full rounded-full object-cover border-2 border-border"
                />
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() => setProfileImageUrl('')}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="w-32 h-32 mx-auto rounded-full bg-muted flex items-center justify-center">
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <FileUpload
              onFilesSelected={handleProfileUpload}
              accept="image/*"
              multiple={false}
              isUploading={profileUpload.isUploading}
              label="画像をアップロード"
            />
            <div className="text-center">
              <Label className="text-sm text-muted-foreground">または URL を直接入力</Label>
              <Input 
                value={profileImageUrl}
                onChange={(e) => setProfileImageUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* 基本情報 */}
        <Card>
          <CardHeader><CardTitle>基本情報</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>活動名 *</Label>
              <Input value={influencerName} onChange={(e) => setInfluencerName(e.target.value)} />
            </div>
            <div>
              <Label>メールアドレス</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>電話番号</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="090-1234-5678" />
            </div>
            <div>
              <Label>LINE ID</Label>
              <Input value={lineId} onChange={(e) => setLineId(e.target.value)} />
            </div>
            <div>
              <Label>希望連絡方法</Label>
              <Select value={preferredContact} onValueChange={setPreferredContact}>
                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">メール</SelectItem>
                  <SelectItem value="phone">電話</SelectItem>
                  <SelectItem value="line">LINE</SelectItem>
                  <SelectItem value="instagram">Instagram DM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>希望報酬</Label>
              <Input value={desiredFee} onChange={(e) => setDesiredFee(e.target.value)} placeholder="¥50,000" />
            </div>
          </CardContent>
        </Card>

        {/* パフォーマンス指標 */}
        <Card>
          <CardHeader><CardTitle>パフォーマンス指標</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>平均再生数</Label>
              <Input 
                type="number" 
                value={averageViews} 
                onChange={(e) => setAverageViews(e.target.value)} 
                placeholder="10000"
              />
              {averageViews && (
                <p className="text-sm text-muted-foreground mt-1">
                  {parseInt(averageViews).toLocaleString()} 回
                </p>
              )}
            </div>
            <div>
              <Label>フォロワー属性（男女比）</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label className="text-xs text-muted-foreground">男性 %</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="100"
                    value={followerDemographics.male} 
                    onChange={(e) => {
                      const male = parseInt(e.target.value) || 0;
                      handleDemographicsChange('male', male);
                      handleDemographicsChange('female', 100 - male);
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">女性 %</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="100"
                    value={followerDemographics.female} 
                    onChange={(e) => {
                      const female = parseInt(e.target.value) || 0;
                      handleDemographicsChange('female', female);
                      handleDemographicsChange('male', 100 - female);
                    }}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>年齢層分布</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label className="text-xs text-muted-foreground">18-24歳 %</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="100"
                    value={followerDemographics.age_18_24} 
                    onChange={(e) => handleDemographicsChange('age_18_24', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">25-34歳 %</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="100"
                    value={followerDemographics.age_25_34} 
                    onChange={(e) => handleDemographicsChange('age_25_34', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">35-44歳 %</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="100"
                    value={followerDemographics.age_35_44} 
                    onChange={(e) => handleDemographicsChange('age_35_44', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">45歳以上 %</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="100"
                    value={followerDemographics.age_45_plus} 
                    onChange={(e) => handleDemographicsChange('age_45_plus', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* タグ */}
        <Card>
          <CardHeader><CardTitle>タグ</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {tags.length === 0 && <p className="text-sm text-muted-foreground">タグがありません</p>}
            </div>
            <div className="flex gap-2">
              <Input 
                value={newTag} 
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="新しいタグ"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button variant="outline" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* SNSアカウント情報 */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>SNSアカウント情報</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {/* メインSNS */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>メインSNS</Label>
                <Select value={mainSns} onValueChange={setMainSns}>
                  <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                  <SelectContent>
                    {platformOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>メインアカウント</Label>
                <Input value={mainAccount} onChange={(e) => setMainAccount(e.target.value)} placeholder="@username" />
              </div>
            </div>

            {/* 各プラットフォーム */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 border rounded-lg space-y-2">
                <Label className="font-medium">Instagram</Label>
                <Input 
                  value={instagram?.url || ''} 
                  onChange={(e) => setInstagram(prev => ({ url: e.target.value, followers: prev?.followers || 0 }))}
                  placeholder="@username"
                />
                <div className="flex gap-2 items-center">
                  <Input 
                    type="number"
                    value={instagram?.followers || ''} 
                    onChange={(e) => setInstagram(prev => ({ url: prev?.url || '', followers: parseInt(e.target.value) || 0 }))}
                    placeholder="フォロワー数"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">人</span>
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <Label className="font-medium">TikTok</Label>
                <Input 
                  value={tiktok?.url || ''} 
                  onChange={(e) => setTiktok(prev => ({ url: e.target.value, followers: prev?.followers || 0 }))}
                  placeholder="@username"
                />
                <div className="flex gap-2 items-center">
                  <Input 
                    type="number"
                    value={tiktok?.followers || ''} 
                    onChange={(e) => setTiktok(prev => ({ url: prev?.url || '', followers: parseInt(e.target.value) || 0 }))}
                    placeholder="フォロワー数"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">人</span>
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <Label className="font-medium">YouTube</Label>
                <Input 
                  value={youtube?.url || ''} 
                  onChange={(e) => setYoutube(prev => ({ url: e.target.value, followers: prev?.followers || 0 }))}
                  placeholder="チャンネルURL"
                />
                <div className="flex gap-2 items-center">
                  <Input 
                    type="number"
                    value={youtube?.followers || ''} 
                    onChange={(e) => setYoutube(prev => ({ url: prev?.url || '', followers: parseInt(e.target.value) || 0 }))}
                    placeholder="登録者数"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">人</span>
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <Label className="font-medium">RED</Label>
                <Input 
                  value={red?.url || ''} 
                  onChange={(e) => setRed(prev => ({ url: e.target.value, followers: prev?.followers || 0 }))}
                  placeholder="アカウント"
                />
                <div className="flex gap-2 items-center">
                  <Input 
                    type="number"
                    value={red?.followers || ''} 
                    onChange={(e) => setRed(prev => ({ url: prev?.url || '', followers: parseInt(e.target.value) || 0 }))}
                    placeholder="フォロワー数"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">人</span>
                </div>
              </div>
            </div>

            {/* その他SNS */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="font-medium">その他SNS</Label>
                <Button variant="outline" size="sm" onClick={handleAddOtherSns}>
                  <Plus className="h-4 w-4 mr-1" />追加
                </Button>
              </div>
              <div className="space-y-2">
                {otherSns.map((account, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input 
                      value={account.platform} 
                      onChange={(e) => handleUpdateOtherSns(index, 'platform', e.target.value)}
                      placeholder="プラットフォーム"
                      className="w-32"
                    />
                    <Input 
                      value={account.url} 
                      onChange={(e) => handleUpdateOtherSns(index, 'url', e.target.value)}
                      placeholder="@username または URL"
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveOtherSns(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {otherSns.length === 0 && (
                  <p className="text-sm text-muted-foreground">その他のSNSアカウントはありません</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 備考 */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>備考・メモ</CardTitle></CardHeader>
          <CardContent>
            <Textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="自由記述欄"
              rows={4}
            />
          </CardContent>
        </Card>
      </div>

      {/* Footer buttons */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button variant="outline" asChild>
          <Link to={`/admin/creator/${id}`}>キャンセル</Link>
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          保存
        </Button>
      </div>
    </div>
  );
};

export default CreatorEdit;

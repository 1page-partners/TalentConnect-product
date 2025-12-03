import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, User, Loader2, Mail } from 'lucide-react';

interface UserWithRole {
  id: string;
  email: string;
  role: 'admin' | 'member';
  created_at: string;
}

const MemberManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user emails from auth (via edge function or RPC would be ideal, but we'll use what we have)
      const usersWithRoles: UserWithRole[] = (data || []).map(role => ({
        id: role.user_id,
        email: '', // Will be populated if we add profiles table
        role: role.role as 'admin' | 'member',
        created_at: role.created_at,
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('ユーザー取得エラー:', error);
      toast({ title: 'エラー', description: 'ユーザーの取得に失敗しました', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (userId: string, newRole: 'admin' | 'member') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast({ title: '更新完了', description: 'ロールを更新しました' });
    } catch (error) {
      console.error('ロール更新エラー:', error);
      toast({ title: 'エラー', description: 'ロールの更新に失敗しました', variant: 'destructive' });
    }
  };

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">メンバー管理</h1>
        <p className="text-muted-foreground">ユーザーのロールを管理します</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総メンバー数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">管理者</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{users.filter(u => u.role === 'admin').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">メンバー</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'member').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>メンバー一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">メンバーがいません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {user.role === 'admin' ? (
                        <Shield className="h-5 w-5 text-primary" />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-muted-foreground">
                        ID: {user.id.slice(0, 8)}...
                      </div>
                      <div className="text-xs text-muted-foreground">
                        登録日: {formatDate(user.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Select
                      value={user.role}
                      onValueChange={(value) => updateRole(user.id, value as 'admin' | 'member')}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Admin
                          </div>
                        </SelectItem>
                        <SelectItem value="member">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Member
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberManagement;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock } from 'lucide-react';
import logo from '@/assets/logo.png';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const allowedDomains = ['@k9-base.com', '@markon.co.jp', '@1page.partners'];

  const isEmailAllowed = (email: string) => {
    return allowedDomains.some(domain => email.toLowerCase().endsWith(domain));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 新規登録時のみドメイン制限をチェック
      if (!isLogin && !isEmailAllowed(email)) {
        toast({
          title: '登録エラー',
          description: '許可されていないメールドメインです。@k9-base.com、@markon.co.jp、@1page.partners のいずれかのメールアドレスをご使用ください。',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'ログインエラー',
            description: error.message === 'Invalid login credentials' 
              ? 'メールアドレスまたはパスワードが正しくありません' 
              : error.message,
            variant: 'destructive',
          });
        } else {
          toast({ title: 'ログイン成功', description: '管理画面へ移動します' });
          navigate('/admin/list');
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast({
            title: '登録エラー',
            description: error.message === 'User already registered'
              ? 'このメールアドレスは既に登録されています'
              : error.message,
            variant: 'destructive',
          });
        } else {
          navigate('/admin/registration-complete');
        }
      }
    } catch (err) {
      toast({
        title: 'エラー',
        description: '予期せぬエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={logo} alt="TalentConnect" className="h-12 mx-auto object-contain" />
          <CardDescription>
            {isLogin ? '管理画面にログイン' : '新規アカウント登録'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <Checkbox 
                  id="showPassword" 
                  checked={showPassword}
                  onCheckedChange={(checked) => setShowPassword(checked === true)}
                />
                <Label 
                  htmlFor="showPassword" 
                  className="text-sm font-normal text-muted-foreground cursor-pointer"
                >
                  パスワードを表示
                </Label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? 'ログイン' : '登録'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? 'アカウントをお持ちでない方はこちら' : 'すでにアカウントをお持ちの方'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

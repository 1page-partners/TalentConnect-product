import { ReactNode, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import logo from '@/assets/logo.png';
import { 
  LayoutDashboard, 
  PlusCircle, 
  List, 
  LogOut, 
  Loader2,
  Users,
  Shield,
  Home,
  UserCircle
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

interface AdminLayoutProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const navItems = [
  { title: 'ホーム', url: '/', icon: Home, adminOnly: false },
  { title: 'ダッシュボード', url: '/admin', icon: LayoutDashboard, adminOnly: false },
  { title: '案件一覧', url: '/admin/list', icon: List, adminOnly: false },
  { title: 'クリエイターリスト', url: '/admin/creators', icon: UserCircle, adminOnly: false },
  { title: 'メンバー管理', url: '/admin/members', icon: Users, adminOnly: true },
];

function AdminSidebar() {
  const location = useLocation();
  const { signOut, user, role, isAdmin } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-60'} collapsible="icon">
      <div className="p-4 border-b">
        {!collapsed && (
          <div className="space-y-1">
            <img src={logo} alt="TalentConnect" className="h-16 object-contain object-left" />
            <div className="flex items-center gap-2">
              <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-xs">
                {isAdmin ? (
                  <><Shield className="w-3 h-3 mr-1" />Admin</>
                ) : (
                  <>Member</>
                )}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* 新規案件作成ボタン */}
      <div className="p-3">
        <Button asChild className="w-full bg-primary hover:bg-primary/90" size={collapsed ? 'icon' : 'default'}>
          <Link to="/admin/new">
            <PlusCircle className="h-4 w-4" />
            {!collapsed && <span className="ml-2">新規案件作成</span>}
          </Link>
        </Button>
      </div>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>メニュー</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="mt-auto p-4 border-t space-y-2">
        {!collapsed && user && (
          <div className="text-xs text-muted-foreground truncate">
            {user.email}
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'default'}
          onClick={signOut}
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">ログアウト</span>}
        </Button>
      </div>
    </Sidebar>
  );
}

const SKIP_AUTH = false;

const AdminLayout = ({ children, requireAdmin = false }: AdminLayoutProps) => {
  const { user, loading, isAdmin, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (SKIP_AUTH) return;
    if (!loading && !user) {
      navigate('/admin/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (SKIP_AUTH) return;
    if (!loading && user && requireAdmin && !isAdmin) {
      navigate('/admin');
    }
  }, [user, loading, requireAdmin, isAdmin, navigate]);

  if (!SKIP_AUTH && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!SKIP_AUTH && !user) {
    return null;
  }

  if (!SKIP_AUTH && requireAdmin && !isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center px-4 bg-background">
            <SidebarTrigger />
          </header>
          <div className="flex-1 p-6 bg-muted/30">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;

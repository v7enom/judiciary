import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { 
  LayoutDashboard, 
  FolderOpen, 
  Users, 
  Search, 
  Gavel, 
  FileText, 
  Shield,
  LogOut,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { ReactNode } from "react";

interface RoCaseLayoutProps {
  children: ReactNode;
}

export default function RoCaseLayout({ children }: RoCaseLayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    logout();
  };

  // إذا لم يتم تسجيل الدخول
  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 p-8 rounded-lg border border-border bg-card max-w-md">
          <div className="flex justify-center">
            <Shield className="h-16 w-16 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">RO-CASE ARCHIVE</h1>
            <p className="text-muted-foreground">نظام إدارة القضايا الجنائية</p>
          </div>
          <p className="text-foreground">يجب تسجيل الدخول للوصول إلى النظام</p>
          <Button asChild className="w-full" size="lg">
            <a href={getLoginUrl()}>تسجيل الدخول</a>
          </Button>
        </div>
      </div>
    );
  }

  // قائمة التنقل حسب الصلاحيات
  const getNavigationItems = () => {
    const role = user?.role || 'member';
    
    const items = [
      { 
        href: "/", 
        label: "لوحة التحكم", 
        icon: LayoutDashboard,
        roles: ['admin', 'judge', 'investigator', 'officer', 'member']
      },
      { 
        href: "/cases", 
        label: "القضايا", 
        icon: FolderOpen,
        roles: ['admin', 'judge', 'investigator', 'officer', 'member']
      },
      { 
        href: "/cases/new", 
        label: "قضية جديدة", 
        icon: FileText,
        roles: ['admin', 'officer']
      },
      { 
        href: "/submit-request", 
        label: "رفع طلب قضية", 
        icon: FileText,
        roles: ['member']
      },
      { 
        href: "/my-requests", 
        label: "طلباتي", 
        icon: FolderOpen,
        roles: ['member']
      },
      { 
        href: "/review-requests", 
        label: "مراجعة الطلبات", 
        icon: AlertCircle,
        roles: ['admin', 'officer']
      },
      { 
        href: "/players", 
        label: "الملفات الجنائية", 
        icon: Users,
        roles: ['admin', 'judge', 'investigator', 'officer', 'member']
      },
      { 
        href: "/search", 
        label: "البحث المتقدم", 
        icon: Search,
        roles: ['admin', 'judge', 'investigator', 'officer', 'member']
      },
      { 
        href: "/court", 
        label: "المحكمة", 
        icon: Gavel,
        roles: ['admin', 'judge']
      },
      { 
        href: "/audit", 
        label: "سجل التدقيق", 
        icon: AlertCircle,
        roles: ['admin', 'judge']
      },
      { 
        href: "/users", 
        label: "إدارة المستخدمين", 
        icon: Shield,
        roles: ['admin']
      },
    ];

    return items.filter(item => item.roles.includes(role));
  };

  const navigationItems = getNavigationItems();

  // شارات الرتب
  const getRoleBadge = (role: string) => {
    const badges = {
      admin: { label: "مدير", color: "text-red-400" },
      judge: { label: "قاضي", color: "text-purple-400" },
      investigator: { label: "محقق", color: "text-blue-400" },
      officer: { label: "ضابط", color: "text-green-400" },
      member: { label: "عضو", color: "text-gray-400" },
    };
    return badges[role as keyof typeof badges] || badges.member;
  };

  const roleBadge = getRoleBadge(user?.role || 'member');

  return (
    <div className="min-h-screen flex bg-background" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 border-l border-border bg-card flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">RO-CASE</h1>
              <p className="text-xs text-muted-foreground">نظام الأرشفة</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                    {isActive && <ChevronRight className="h-4 w-4 mr-auto" />}
                  </a>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <Separator />

        {/* User Profile */}
        <div className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-right">
                  <p className="text-sm font-medium text-foreground">{user?.name || 'مستخدم'}</p>
                  <p className={`text-xs ${roleBadge.color}`}>{roleBadge.label}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>حسابي</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="ml-2 h-4 w-4" />
                <span>تسجيل الخروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

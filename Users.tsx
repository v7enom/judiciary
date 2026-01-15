import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Shield, Users as UsersIcon, Loader2 } from "lucide-react";

export default function Users() {
  const utils = trpc.useUtils();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: users, isLoading } = trpc.users.getAll.useQuery();

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث صلاحيات المستخدم بنجاح");
      setIsDialogOpen(false);
      setSelectedUser(null);
      setNewRole("");
      utils.users.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`فشل تحديث الصلاحيات: ${error.message}`);
    },
  });

  const handleOpenDialog = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsDialogOpen(true);
  };

  const handleUpdateRole = () => {
    if (!selectedUser || !newRole) return;
    updateRoleMutation.mutate({
      userId: selectedUser.id,
      role: newRole as any,
    });
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; variant: any; color: string }> = {
      admin: { label: 'مدير', variant: 'destructive', color: 'text-red-400' },
      judge: { label: 'قاضي', variant: 'default', color: 'text-purple-400' },
      investigator: { label: 'محقق', variant: 'secondary', color: 'text-blue-400' },
      officer: { label: 'ضابط', variant: 'outline', color: 'text-green-400' },
      member: { label: 'عضو', variant: 'secondary', color: 'text-gray-400' },
    };
    return badges[role] || { label: role, variant: 'secondary', color: 'text-gray-400' };
  };

  const roleStats = {
    admin: users?.filter(u => u.role === 'admin').length || 0,
    judge: users?.filter(u => u.role === 'judge').length || 0,
    investigator: users?.filter(u => u.role === 'investigator').length || 0,
    officer: users?.filter(u => u.role === 'officer').length || 0,
    member: users?.filter(u => u.role === 'member').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Shield className="h-10 w-10 text-primary" />
          إدارة المستخدمين
        </h1>
        <p className="text-muted-foreground">إدارة صلاحيات المستخدمين في النظام</p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">المدراء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{roleStats.admin}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">القضاة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{roleStats.judge}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">المحققون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{roleStats.investigator}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">الضباط</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{roleStats.officer}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">الأعضاء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">{roleStats.member}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-primary" />
            قائمة المستخدمين
          </CardTitle>
          <CardDescription>جميع المستخدمين المسجلين في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : users?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">لا يوجد مستخدمون</p>
          ) : (
            <div className="space-y-3">
              {users?.map((user) => {
                const roleBadge = getRoleBadge(user.role);
                return (
                  <div key={user.id} className="p-4 rounded-lg border border-border bg-background">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold text-foreground">
                            {user.name || 'مستخدم'}
                          </h3>
                          <Badge variant={roleBadge.variant}>
                            {roleBadge.label}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {user.email && <p>البريد: {user.email}</p>}
                          {user.discordUsername && <p>Discord: {user.discordUsername}</p>}
                          <p>آخر دخول: {new Date(user.lastSignedIn).toLocaleString('ar-SA')}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleOpenDialog(user)}
                      >
                        تعديل الصلاحيات
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              تعديل صلاحيات المستخدم
            </DialogTitle>
            <DialogDescription>
              {selectedUser && `المستخدم: ${selectedUser.name || 'مستخدم'}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedUser && (
              <div className="p-4 rounded-lg bg-secondary/50 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الاسم:</span>
                  <span className="text-foreground font-medium">{selectedUser.name || 'غير محدد'}</span>
                </div>
                {selectedUser.email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">البريد:</span>
                    <span className="text-foreground">{selectedUser.email}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الصلاحية الحالية:</span>
                  <Badge variant={getRoleBadge(selectedUser.role).variant}>
                    {getRoleBadge(selectedUser.role).label}
                  </Badge>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">الصلاحية الجديدة *</label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="اختر الصلاحية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">👑 مدير - صلاحيات كاملة</SelectItem>
                  <SelectItem value="judge">⚖️ قاضي - إصدار الأحكام</SelectItem>
                  <SelectItem value="investigator">🕵️ محقق - التحقيق والأدلة</SelectItem>
                  <SelectItem value="officer">👮 ضابط - رفع القضايا</SelectItem>
                  <SelectItem value="member">👤 عضو - فتح قضايا فقط</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-600 dark:text-yellow-400">
              ⚠️ تحذير: تغيير الصلاحيات سيؤثر على ما يمكن للمستخدم الوصول إليه في النظام
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={updateRoleMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={updateRoleMutation.isPending || !newRole || newRole === selectedUser?.role}
            >
              {updateRoleMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                "تأكيد التحديث"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

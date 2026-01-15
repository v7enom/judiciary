import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Shield, FileText } from "lucide-react";

export default function AuditLog() {
  const { data: logs, isLoading } = trpc.auditLogs.getAll.useQuery({ limit: 100 });

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'CREATE_CASE': 'إنشاء قضية',
      'UPDATE_CASE_STATUS': 'تحديث حالة قضية',
      'FINALIZE_CASE': 'إصدار حكم',
      'ADD_EVIDENCE': 'إضافة دليل',
      'DELETE_EVIDENCE': 'حذف دليل',
      'ADD_NOTE': 'إضافة ملاحظة',
      'UPDATE_NOTE': 'تعديل ملاحظة',
      'DELETE_NOTE': 'حذف ملاحظة',
      'UPDATE_USER_ROLE': 'تحديث صلاحيات مستخدم',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADD')) return 'default';
    if (action.includes('UPDATE')) return 'secondary';
    if (action.includes('DELETE')) return 'destructive';
    if (action.includes('FINALIZE')) return 'outline';
    return 'secondary';
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; variant: any }> = {
      admin: { label: 'مدير', variant: 'destructive' },
      judge: { label: 'قاضي', variant: 'default' },
      investigator: { label: 'محقق', variant: 'secondary' },
      officer: { label: 'ضابط', variant: 'outline' },
      member: { label: 'عضو', variant: 'secondary' },
    };
    return badges[role] || { label: role, variant: 'secondary' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Shield className="h-10 w-10 text-primary" />
          سجل التدقيق
        </h1>
        <p className="text-muted-foreground">سجل غير قابل للتلاعب لجميع العمليات في النظام</p>
      </div>

      {/* Info Card */}
      <Card className="bg-card border-border border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            معلومات هامة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• هذا السجل غير قابل للتعديل أو الحذف ويحفظ جميع العمليات بشكل دائم</p>
          <p>• يتم تسجيل كل عملية مع اسم المستخدم، الرتبة، التاريخ والوقت، والتفاصيل</p>
          <p>• يستخدم لضمان الشفافية والمساءلة في جميع الإجراءات</p>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">سجل العمليات</CardTitle>
          <CardDescription>آخر 100 عملية في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : logs?.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد سجلات</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {logs?.map((log) => {
                  const roleBadge = getRoleBadge(log.userRole);
                  let details = null;
                  try {
                    details = log.details ? JSON.parse(log.details) : null;
                  } catch (e) {
                    // ignore
                  }

                  return (
                    <div key={log.id} className="p-4 rounded-lg border border-border bg-background">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={getActionColor(log.action) as any}>
                            {getActionLabel(log.action)}
                          </Badge>
                          <Badge variant={roleBadge.variant}>
                            {roleBadge.label}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground text-left">
                          {new Date(log.createdAt).toLocaleString('ar-SA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">المستخدم:</span>
                          <span className="text-foreground font-medium">{log.userName}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">الكيان:</span>
                          <span className="text-foreground">
                            {log.entityType === 'case' ? 'قضية' :
                             log.entityType === 'evidence' ? 'دليل' :
                             log.entityType === 'note' ? 'ملاحظة' :
                             log.entityType === 'user' ? 'مستخدم' :
                             log.entityType} #{log.entityId}
                          </span>
                        </div>

                        {details && (
                          <div className="mt-2 p-2 rounded bg-secondary/30 text-xs">
                            <span className="text-muted-foreground">التفاصيل:</span>
                            <pre className="text-foreground mt-1 whitespace-pre-wrap">
                              {JSON.stringify(details, null, 2)}
                            </pre>
                          </div>
                        )}

                        {log.ipAddress && (
                          <div className="text-xs text-muted-foreground">
                            IP: {log.ipAddress}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

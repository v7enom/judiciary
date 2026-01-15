import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  FileText, 
  User, 
  Calendar, 
  AlertCircle, 
  MessageSquare, 
  Image as ImageIcon,
  ArrowRight,
  Loader2
} from "lucide-react";

export default function CaseDetail() {
  const [, params] = useRoute("/cases/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const caseId = parseInt(params?.id || "0");
  const utils = trpc.useUtils();

  const [newNote, setNewNote] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");

  const { data: caseData, isLoading } = trpc.cases.getById.useQuery({ id: caseId });
  const { data: evidence } = trpc.evidence.getByCaseId.useQuery({ caseId });
  const { data: notes } = trpc.notes.getByCaseId.useQuery({ caseId });

  const addNoteMutation = trpc.notes.add.useMutation({
    onSuccess: () => {
      toast.success("تمت إضافة الملاحظة بنجاح");
      setNewNote("");
      utils.notes.getByCaseId.invalidate({ caseId });
    },
  });

  const updateStatusMutation = trpc.cases.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة القضية");
      utils.cases.getById.invalidate({ id: caseId });
      utils.cases.getAll.invalidate();
      utils.statistics.getCaseStats.invalidate();
    },
  });

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast.error("يرجى كتابة ملاحظة");
      return;
    }
    addNoteMutation.mutate({ caseId, content: newNote });
  };

  const handleUpdateStatus = () => {
    if (!newStatus) return;
    updateStatusMutation.mutate({ 
      id: caseId, 
      status: newStatus as any 
    });
  };

  const canUpdateStatus = user?.role === 'admin' || user?.role === 'judge' || user?.role === 'investigator';
  const canAddNote = user?.role !== 'member';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">القضية غير موجودة</p>
        <Button onClick={() => setLocation("/cases")} className="mt-4">
          العودة إلى القضايا
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{caseData.caseNumber}</h1>
            <Badge variant={
              caseData.status === 'open' ? 'default' :
              caseData.status === 'investigating' ? 'secondary' :
              caseData.status === 'pending_judgment' ? 'outline' :
              'default'
            }>
              {caseData.status === 'open' ? 'مفتوحة' :
               caseData.status === 'investigating' ? 'قيد التحقيق' :
               caseData.status === 'pending_judgment' ? 'بانتظار الحكم' :
               'مغلقة'}
            </Badge>
            <Badge variant={
              caseData.severity === 'critical' ? 'destructive' :
              caseData.severity === 'high' ? 'default' :
              'secondary'
            }>
              {caseData.severity === 'critical' ? 'حرج' :
               caseData.severity === 'high' ? 'عالي' :
               caseData.severity === 'medium' ? 'متوسط' :
               'منخفض'}
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground">{caseData.crimeType}</p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/cases")}>
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* المعلومات الأساسية */}
        <div className="lg:col-span-2 space-y-6">
          {/* الوصف */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                وصف القضية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{caseData.description}</p>
            </CardContent>
          </Card>

          {/* الأطراف */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                الأطراف
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">المتهم</h4>
                <p className="text-foreground font-medium">{caseData.accusedPlayerName}</p>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">المشتكي</h4>
                <p className="text-foreground">{caseData.complainantName}</p>
                {caseData.complainantDiscordId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Discord ID: {caseData.complainantDiscordId}
                  </p>
                )}
              </div>
              {caseData.witnesses && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">الشهود</h4>
                    <p className="text-foreground whitespace-pre-wrap">{caseData.witnesses}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* الأدلة */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                الأدلة ({evidence?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {evidence && evidence.length > 0 ? (
                <div className="space-y-3">
                  {evidence.map((item) => (
                    <div key={item.id} className="p-3 rounded-lg border border-border bg-background">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-2">
                            {item.type === 'image' ? 'صورة' :
                             item.type === 'video' ? 'فيديو' :
                             item.type === 'document' ? 'مستند' :
                             item.type === 'audio' ? 'صوت' :
                             'رابط'}
                          </Badge>
                          {item.description && (
                            <p className="text-sm text-foreground mb-2">{item.description}</p>
                          )}
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline break-all"
                          >
                            {item.url}
                          </a>
                          <p className="text-xs text-muted-foreground mt-2">
                            رفع بواسطة: {item.uploadedByName}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">لا توجد أدلة مرفقة</p>
              )}
            </CardContent>
          </Card>

          {/* الملاحظات */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                الملاحظات والتعليقات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notes && notes.length > 0 ? (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="p-4 rounded-lg border border-border bg-background">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{note.authorName}</span>
                          <Badge variant="outline" className="text-xs">
                            {note.authorRole === 'admin' ? 'مدير' :
                             note.authorRole === 'judge' ? 'قاضي' :
                             note.authorRole === 'investigator' ? 'محقق' :
                             note.authorRole === 'officer' ? 'ضابط' :
                             'مشاهد'}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.createdAt).toLocaleString('ar-SA')}
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">لا توجد ملاحظات</p>
              )}

              {canAddNote && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Textarea
                      placeholder="أضف ملاحظة جديدة..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                      className="bg-background"
                    />
                    <Button 
                      onClick={handleAddNote}
                      disabled={addNoteMutation.isPending || !newNote.trim()}
                      className="w-full"
                    >
                      {addNoteMutation.isPending ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          جاري الإضافة...
                        </>
                      ) : (
                        "إضافة ملاحظة"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* الشريط الجانبي */}
        <div className="space-y-6">
          {/* معلومات سريعة */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                معلومات سريعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                <p className="text-foreground font-medium">
                  {new Date(caseData.createdAt).toLocaleString('ar-SA')}
                </p>
              </div>
              <Separator />
              <div>
                <span className="text-muted-foreground">آخر تحديث:</span>
                <p className="text-foreground font-medium">
                  {new Date(caseData.updatedAt).toLocaleString('ar-SA')}
                </p>
              </div>
              <Separator />
              <div>
                <span className="text-muted-foreground">الحكم:</span>
                <Badge className="mt-1" variant={
                  caseData.verdict === 'guilty' ? 'destructive' :
                  caseData.verdict === 'not_guilty' ? 'default' :
                  'secondary'
                }>
                  {caseData.verdict === 'guilty' ? 'مدان' :
                   caseData.verdict === 'not_guilty' ? 'بريء' :
                   'قيد المراجعة'}
                </Badge>
              </div>
              {caseData.punishment && (
                <>
                  <Separator />
                  <div>
                    <span className="text-muted-foreground">العقوبة:</span>
                    <p className="text-foreground font-medium mt-1">{caseData.punishment}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* تحديث الحالة */}
          {canUpdateStatus && caseData.status !== 'closed' && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">تحديث الحالة</CardTitle>
                <CardDescription>تغيير حالة القضية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="اختر الحالة الجديدة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">مفتوحة</SelectItem>
                    <SelectItem value="investigating">قيد التحقيق</SelectItem>
                    <SelectItem value="pending_judgment">بانتظار الحكم</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleUpdateStatus}
                  disabled={updateStatusMutation.isPending || !newStatus}
                  className="w-full"
                >
                  {updateStatusMutation.isPending ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري التحديث...
                    </>
                  ) : (
                    "تحديث الحالة"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

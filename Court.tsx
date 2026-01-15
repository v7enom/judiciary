import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Link } from "wouter";
import { Gavel, Scale, FileCheck, Loader2 } from "lucide-react";

export default function Court() {
  const utils = trpc.useUtils();
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [verdict, setVerdict] = useState<"guilty" | "not_guilty">("guilty");
  const [punishment, setPunishment] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: pendingCases, isLoading } = trpc.cases.getByStatus.useQuery({ status: "pending_judgment" });

  const finalizeCaseMutation = trpc.cases.finalizeCase.useMutation({
    onSuccess: () => {
      toast.success("تم إصدار الحكم وإغلاق القضية بنجاح");
      setIsDialogOpen(false);
      setSelectedCase(null);
      setVerdict("guilty");
      setPunishment("");
      utils.cases.getByStatus.invalidate();
      utils.cases.getAll.invalidate();
      utils.statistics.getCaseStats.invalidate();
    },
    onError: (error) => {
      toast.error(`فشل إصدار الحكم: ${error.message}`);
    },
  });

  const handleOpenDialog = (caseItem: any) => {
    setSelectedCase(caseItem);
    setIsDialogOpen(true);
  };

  const handleFinalizeCase = () => {
    if (!selectedCase) return;
    
    if (verdict === "guilty" && !punishment.trim()) {
      toast.error("يرجى تحديد العقوبة للمدان");
      return;
    }

    finalizeCaseMutation.mutate({
      id: selectedCase.id,
      verdict,
      punishment: verdict === "guilty" ? punishment : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Gavel className="h-10 w-10 text-primary" />
          المحكمة
        </h1>
        <p className="text-muted-foreground">مراجعة القضايا وإصدار الأحكام</p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              القضايا بانتظار الحكم
            </CardTitle>
            <Scale className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-foreground">{pendingCases?.length || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              جاهزة للحكم
            </CardTitle>
            <FileCheck className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-primary">{pendingCases?.length || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Cases */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">القضايا المعروضة للحكم</CardTitle>
          <CardDescription>القضايا التي أكملت التحقيق وبانتظار الحكم النهائي</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : pendingCases?.length === 0 ? (
            <div className="text-center py-12">
              <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد قضايا بانتظار الحكم</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingCases?.map((caseItem) => (
                <div key={caseItem.id} className="p-5 rounded-lg border border-border bg-background">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base font-mono text-primary font-bold">
                          {caseItem.caseNumber}
                        </span>
                        <Badge variant={
                          caseItem.severity === 'critical' ? 'destructive' :
                          caseItem.severity === 'high' ? 'default' :
                          'secondary'
                        }>
                          {caseItem.severity === 'critical' ? 'حرج' :
                           caseItem.severity === 'high' ? 'عالي' :
                           caseItem.severity === 'medium' ? 'متوسط' :
                           'منخفض'}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {caseItem.crimeType}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {caseItem.description}
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">المتهم:</span>
                          <p className="text-foreground font-medium">{caseItem.accusedPlayerName}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">المشتكي:</span>
                          <p className="text-foreground">{caseItem.complainantName}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-left">
                      {new Date(caseItem.createdAt).toLocaleDateString('ar-SA')}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button asChild variant="outline" className="flex-1">
                      <Link href={`/cases/${caseItem.id}`}>
                        <a>عرض التفاصيل</a>
                      </Link>
                    </Button>
                    <Button 
                      onClick={() => handleOpenDialog(caseItem)}
                      className="flex-1"
                    >
                      <Gavel className="ml-2 h-4 w-4" />
                      إصدار الحكم
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Finalize Case Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Gavel className="h-5 w-5 text-primary" />
              إصدار الحكم النهائي
            </DialogTitle>
            <DialogDescription>
              {selectedCase && `القضية: ${selectedCase.caseNumber} - ${selectedCase.crimeType}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedCase && (
              <div className="p-4 rounded-lg bg-secondary/50 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المتهم:</span>
                  <span className="text-foreground font-medium">{selectedCase.accusedPlayerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">نوع الجريمة:</span>
                  <span className="text-foreground">{selectedCase.crimeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">مستوى الخطورة:</span>
                  <Badge variant={
                    selectedCase.severity === 'critical' ? 'destructive' :
                    selectedCase.severity === 'high' ? 'default' :
                    'secondary'
                  }>
                    {selectedCase.severity === 'critical' ? 'حرج' :
                     selectedCase.severity === 'high' ? 'عالي' :
                     selectedCase.severity === 'medium' ? 'متوسط' :
                     'منخفض'}
                  </Badge>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">الحكم *</label>
              <Select value={verdict} onValueChange={(v: any) => setVerdict(v)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guilty">مدان</SelectItem>
                  <SelectItem value="not_guilty">بريء</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {verdict === "guilty" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">العقوبة *</label>
                <Textarea
                  placeholder="حدد العقوبة المناسبة (مثال: سجن 30 يوم، غرامة 10000$، حظر من الخادم...)"
                  value={punishment}
                  onChange={(e) => setPunishment(e.target.value)}
                  rows={4}
                  className="bg-background"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={finalizeCaseMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleFinalizeCase}
              disabled={finalizeCaseMutation.isPending || (verdict === "guilty" && !punishment.trim())}
              className="bg-primary"
            >
              {finalizeCaseMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الإصدار...
                </>
              ) : (
                <>
                  <FileCheck className="ml-2 h-4 w-4" />
                  تأكيد الحكم وإغلاق القضية
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Plus, FileText } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Cases() {
  const { user } = useAuth();
  const { data: allCases, isLoading } = trpc.cases.getAll.useQuery();

  const canCreateCase = user?.role === 'admin' || user?.role === 'officer';

  // تصنيف القضايا حسب الحالة
  const openCases = allCases?.filter(c => c.status === 'open') || [];
  const investigatingCases = allCases?.filter(c => c.status === 'investigating') || [];
  const pendingCases = allCases?.filter(c => c.status === 'pending_judgment') || [];
  const closedCases = allCases?.filter(c => c.status === 'closed') || [];

  const CaseCard = ({ caseItem }: { caseItem: any }) => (
    <Link href={`/cases/${caseItem.id}`}>
      <a className="block">
        <Card className="bg-card border-border hover:border-primary transition-colors cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-mono text-primary font-bold">{caseItem.caseNumber}</span>
                  <Badge variant={
                    caseItem.severity === 'critical' ? 'destructive' :
                    caseItem.severity === 'high' ? 'default' :
                    caseItem.severity === 'medium' ? 'secondary' :
                    'outline'
                  }>
                    {caseItem.severity === 'critical' ? 'حرج' :
                     caseItem.severity === 'high' ? 'عالي' :
                     caseItem.severity === 'medium' ? 'متوسط' :
                     'منخفض'}
                  </Badge>
                </div>
                <CardTitle className="text-lg text-foreground">{caseItem.crimeType}</CardTitle>
              </div>
              <div className="text-xs text-muted-foreground text-left">
                {new Date(caseItem.createdAt).toLocaleDateString('ar-SA', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المتهم:</span>
                <span className="text-foreground font-medium">{caseItem.accusedPlayerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المشتكي:</span>
                <span className="text-foreground">{caseItem.complainantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الحكم:</span>
                <Badge variant={
                  caseItem.verdict === 'guilty' ? 'destructive' :
                  caseItem.verdict === 'not_guilty' ? 'default' :
                  'secondary'
                }>
                  {caseItem.verdict === 'guilty' ? 'مدان' :
                   caseItem.verdict === 'not_guilty' ? 'بريء' :
                   'قيد المراجعة'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </a>
    </Link>
  );

  const CasesList = ({ cases }: { cases: any[] }) => {
    if (isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      );
    }

    if (cases.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">لا توجد قضايا في هذه الفئة</p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cases.map((caseItem) => (
          <CaseCard key={caseItem.id} caseItem={caseItem} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">القضايا</h1>
          <p className="text-muted-foreground">إدارة ومتابعة جميع القضايا</p>
        </div>
        {canCreateCase && (
          <Button asChild size="lg">
            <Link href="/cases/new">
              <a className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                قضية جديدة
              </a>
            </Link>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-card">
          <TabsTrigger value="all">الكل ({allCases?.length || 0})</TabsTrigger>
          <TabsTrigger value="open">مفتوحة ({openCases.length})</TabsTrigger>
          <TabsTrigger value="investigating">قيد التحقيق ({investigatingCases.length})</TabsTrigger>
          <TabsTrigger value="pending">بانتظار الحكم ({pendingCases.length})</TabsTrigger>
          <TabsTrigger value="closed">مغلقة ({closedCases.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <CasesList cases={allCases || []} />
        </TabsContent>

        <TabsContent value="open" className="mt-6">
          <CasesList cases={openCases} />
        </TabsContent>

        <TabsContent value="investigating" className="mt-6">
          <CasesList cases={investigatingCases} />
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <CasesList cases={pendingCases} />
        </TabsContent>

        <TabsContent value="closed" className="mt-6">
          <CasesList cases={closedCases} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

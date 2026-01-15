import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { User, FileText, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";

export default function PlayerDetail() {
  const [, params] = useRoute("/players/:id");
  const [, setLocation] = useLocation();
  const playerId = parseInt(params?.id || "0");

  const { data: player, isLoading: playerLoading } = trpc.players.getById.useQuery({ id: playerId });
  const { data: cases, isLoading: casesLoading } = trpc.cases.getByPlayerId.useQuery({ playerId });

  if (playerLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">الملف الجنائي غير موجود</p>
        <Button onClick={() => setLocation("/players")} className="mt-4">
          العودة إلى القائمة
        </Button>
      </div>
    );
  }

  const convictionRate = player.totalCases > 0 
    ? ((player.convictions / player.totalCases) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-foreground">{player.robloxUsername}</h1>
            {player.totalCases >= 5 && (
              <Badge variant="destructive" className="text-sm">عالي الخطورة</Badge>
            )}
          </div>
          <p className="text-muted-foreground">Roblox ID: {player.robloxUserId}</p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/players")}>
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي القضايا
            </CardTitle>
            <FileText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{player.totalCases}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              الإدانات
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{player.convictions}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              التبرئات
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{player.acquittals}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              نسبة الإدانة
            </CardTitle>
            <User className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{convictionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Cases History */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">تاريخ القضايا</CardTitle>
        </CardHeader>
        <CardContent>
          {casesLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : cases?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">لا توجد قضايا مسجلة</p>
          ) : (
            <div className="space-y-3">
              {cases?.map((caseItem) => (
                <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
                  <a className="block p-4 rounded-lg border border-border hover:bg-secondary transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-mono text-primary font-bold">
                            {caseItem.caseNumber}
                          </span>
                          <Badge variant={
                            caseItem.status === 'open' ? 'default' :
                            caseItem.status === 'investigating' ? 'secondary' :
                            caseItem.status === 'pending_judgment' ? 'outline' :
                            'default'
                          }>
                            {caseItem.status === 'open' ? 'مفتوحة' :
                             caseItem.status === 'investigating' ? 'قيد التحقيق' :
                             caseItem.status === 'pending_judgment' ? 'بانتظار الحكم' :
                             'مغلقة'}
                          </Badge>
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
                        <h3 className="text-base font-semibold text-foreground mb-1">
                          {caseItem.crimeType}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {caseItem.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>المشتكي: {caseItem.complainantName}</span>
                          <Separator orientation="vertical" className="h-4" />
                          <span>{new Date(caseItem.createdAt).toLocaleDateString('ar-SA')}</span>
                        </div>
                      </div>
                      <div className="text-left">
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
                  </a>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

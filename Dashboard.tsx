import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, FolderClock, Scale, FolderCheck, TrendingUp, Users } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.statistics.getCaseStats.useQuery();
  const { data: topOffenders, isLoading: offendersLoading } = trpc.players.getTopOffenders.useQuery({ limit: 10 });
  const { data: recentCases, isLoading: casesLoading } = trpc.cases.getAll.useQuery();

  // أحدث 5 قضايا
  const latestCases = recentCases?.slice(0, 5) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">لوحة التحكم</h1>
        <p className="text-muted-foreground">نظرة عامة على القضايا والإحصائيات</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              القضايا المفتوحة
            </CardTitle>
            <FolderOpen className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-foreground">{stats?.open || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              قيد التحقيق
            </CardTitle>
            <FolderClock className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-foreground">{stats?.investigating || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              بانتظار الحكم
            </CardTitle>
            <Scale className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-foreground">{stats?.pendingJudgment || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              القضايا المغلقة
            </CardTitle>
            <FolderCheck className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-foreground">{stats?.closed || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* أحدث القضايا */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              أحدث القضايا
            </CardTitle>
            <CardDescription>آخر 5 قضايا تم رفعها</CardDescription>
          </CardHeader>
          <CardContent>
            {casesLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : latestCases.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد قضايا حالياً</p>
            ) : (
              <div className="space-y-3">
                {latestCases.map((caseItem) => (
                  <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
                    <a className="block p-4 rounded-lg border border-border hover:bg-secondary transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-mono text-primary">{caseItem.caseNumber}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              caseItem.status === 'open' ? 'bg-primary/20 text-primary' :
                              caseItem.status === 'investigating' ? 'bg-accent/20 text-accent' :
                              caseItem.status === 'pending_judgment' ? 'bg-yellow-500/20 text-yellow-500' :
                              'bg-green-500/20 text-green-500'
                            }`}>
                              {caseItem.status === 'open' ? 'مفتوحة' :
                               caseItem.status === 'investigating' ? 'قيد التحقيق' :
                               caseItem.status === 'pending_judgment' ? 'بانتظار الحكم' :
                               'مغلقة'}
                            </span>
                          </div>
                          <p className="text-sm text-foreground font-medium">{caseItem.crimeType}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            المتهم: {caseItem.accusedPlayerName}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(caseItem.createdAt).toLocaleDateString('ar-SA')}
                        </div>
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/cases">
                  <a>عرض جميع القضايا</a>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* أعلى 10 مخالفين */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-destructive" />
              أعلى المخالفين
            </CardTitle>
            <CardDescription>اللاعبون الأكثر قضايا</CardDescription>
          </CardHeader>
          <CardContent>
            {offendersLoading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : topOffenders?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد بيانات</p>
            ) : (
              <div className="space-y-2">
                {topOffenders?.map((player, index) => (
                  <Link key={player.id} href={`/players/${player.id}`}>
                    <a className="block p-3 rounded-lg border border-border hover:bg-secondary transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                            ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                              index === 1 ? 'bg-gray-400/20 text-gray-400' :
                              index === 2 ? 'bg-orange-500/20 text-orange-500' :
                              'bg-muted text-muted-foreground'}
                          `}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{player.robloxUsername}</p>
                            <p className="text-xs text-muted-foreground">ID: {player.robloxUserId}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-foreground">{player.totalCases}</p>
                          <p className="text-xs text-muted-foreground">قضية</p>
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
    </div>
  );
}

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Users, TrendingUp, AlertTriangle } from "lucide-react";

export default function Players() {
  const { data: topOffenders, isLoading } = trpc.players.getTopOffenders.useQuery({ limit: 50 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">الملفات الجنائية</h1>
        <p className="text-muted-foreground">سجلات اللاعبين والمخالفين</p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي اللاعبين
            </CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-foreground">{topOffenders?.length || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              المخالفون النشطون
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-foreground">
                {topOffenders?.filter(p => p.totalCases >= 3).length || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              حالات عالية الخطورة
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-foreground">
                {topOffenders?.filter(p => p.totalCases >= 5).length || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Players List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">قائمة اللاعبين</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : topOffenders?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">لا توجد سجلات</p>
          ) : (
            <div className="space-y-3">
              {topOffenders?.map((player) => (
                <Link key={player.id} href={`/players/${player.id}`}>
                  <a className="block p-4 rounded-lg border border-border hover:bg-secondary transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {player.robloxUsername}
                          </h3>
                          {player.totalCases >= 5 && (
                            <Badge variant="destructive">عالي الخطورة</Badge>
                          )}
                          {player.totalCases >= 3 && player.totalCases < 5 && (
                            <Badge variant="default">نشط</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Roblox ID: {player.robloxUserId}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <p className="text-2xl font-bold text-foreground">{player.totalCases}</p>
                          <p className="text-xs text-muted-foreground">قضية</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-destructive">{player.convictions}</p>
                          <p className="text-xs text-muted-foreground">إدانة</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-500">{player.acquittals}</p>
                          <p className="text-xs text-muted-foreground">تبرئة</p>
                        </div>
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

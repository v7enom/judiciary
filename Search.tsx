import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Search as SearchIcon, FileText } from "lucide-react";

export default function Search() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: results, isLoading } = trpc.cases.search.useQuery(
    { query: searchTerm },
    { enabled: searchTerm.length > 0 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchTerm(query.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">البحث المتقدم</h1>
        <p className="text-muted-foreground">ابحث في القضايا باستخدام رقم القضية، اسم اللاعب، أو نوع الجريمة</p>
      </div>

      {/* Search Form */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <SearchIcon className="h-5 w-5 text-primary" />
            البحث
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-3">
            <Input
              type="text"
              placeholder="ابحث برقم القضية (RC-2026-00001)، اسم اللاعب، أو نوع الجريمة..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-background"
            />
            <Button type="submit" size="lg">
              <SearchIcon className="ml-2 h-5 w-5" />
              بحث
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {searchTerm && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              نتائج البحث {results && `(${results.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : results?.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لم يتم العثور على نتائج</p>
                <p className="text-sm text-muted-foreground mt-2">
                  جرب البحث بكلمات مختلفة أو تحقق من الإملاء
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {results?.map((caseItem) => (
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
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {caseItem.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>المتهم: {caseItem.accusedPlayerName}</span>
                            <span>•</span>
                            <span>المشتكي: {caseItem.complainantName}</span>
                            <span>•</span>
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
      )}

      {/* Search Tips */}
      {!searchTerm && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">نصائح البحث</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• استخدم رقم القضية الكامل للبحث الدقيق (مثال: RC-2026-00001)</p>
            <p>• ابحث باسم اللاعب المتهم أو المشتكي</p>
            <p>• ابحث بنوع الجريمة (مثال: سرقة، احتيال، اعتداء)</p>
            <p>• البحث يدعم الكلمات الجزئية ويعرض جميع النتائج المطابقة</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

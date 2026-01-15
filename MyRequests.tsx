import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { Link } from "wouter";

export default function MyRequests() {
  const { data: requests, isLoading } = trpc.caseRequests.getMy.useQuery();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> قيد المراجعة</Badge>;
      case "approved":
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> تمت الموافقة</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> مرفوض</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
          <FileText className="h-10 w-10 text-primary" />
          طلباتي
        </h1>
        <p className="text-muted-foreground">عرض جميع طلبات القضايا التي قدمتها</p>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </>
        ) : requests?.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لم تقدم أي طلبات بعد</p>
              <Link href="/submit-request">
                <a className="text-primary hover:underline mt-2 inline-block">رفع طلب جديد</a>
              </Link>
            </CardContent>
          </Card>
        ) : (
          requests?.map((request) => (
            <Card key={request.id} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-foreground">
                      طلب #{request.id} - {request.crimeType}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      المتهم: {request.suspectRobloxUsername} (ID: {request.suspectRobloxId})
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p className="line-clamp-2">{request.description}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>تاريخ الإرسال: {new Date(request.createdAt).toLocaleDateString('ar-SA')}</span>
                  {request.reviewedAt && (
                    <span>تاريخ المراجعة: {new Date(request.reviewedAt).toLocaleDateString('ar-SA')}</span>
                  )}
                </div>

                {request.status === "approved" && request.approvedCaseId && (
                  <div className="pt-2 border-t border-border">
                    <Link href={`/cases/${request.approvedCaseId}`}>
                      <a className="text-primary hover:underline text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        عرض القضية المعتمدة
                      </a>
                    </Link>
                  </div>
                )}

                {request.status === "rejected" && request.reviewNotes && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">سبب الرفض:</span> {request.reviewNotes}
                    </p>
                  </div>
                )}

                {request.status === "approved" && request.reviewNotes && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">ملاحظات المراجع:</span> {request.reviewNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

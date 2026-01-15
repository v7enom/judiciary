import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";

export default function ReviewRequests() {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const utils = trpc.useUtils();
  const { data: requests, isLoading } = trpc.caseRequests.getPending.useQuery();

  const approveMutation = trpc.caseRequests.approve.useMutation({
    onSuccess: (data) => {
      toast.success(`تمت الموافقة على الطلب وإنشاء القضية #${data.caseId}`);
      utils.caseRequests.getPending.invalidate();
      setShowDialog(false);
      setSelectedRequest(null);
      setReviewNotes("");
    },
    onError: (error) => {
      toast.error(`فشلت الموافقة: ${error.message}`);
    },
  });

  const rejectMutation = trpc.caseRequests.reject.useMutation({
    onSuccess: () => {
      toast.success("تم رفض الطلب");
      utils.caseRequests.getPending.invalidate();
      setShowDialog(false);
      setSelectedRequest(null);
      setReviewNotes("");
    },
    onError: (error) => {
      toast.error(`فشل الرفض: ${error.message}`);
    },
  });

  const handleAction = (request: any, actionType: "approve" | "reject") => {
    setSelectedRequest(request);
    setAction(actionType);
    setShowDialog(true);
  };

  const confirmAction = () => {
    if (!selectedRequest) return;

    if (action === "approve") {
      approveMutation.mutate({
        requestId: selectedRequest.id,
        reviewNotes: reviewNotes || undefined,
      });
    } else if (action === "reject") {
      if (!reviewNotes.trim()) {
        toast.error("يرجى إدخال سبب الرفض");
        return;
      }
      rejectMutation.mutate({
        requestId: selectedRequest.id,
        reviewNotes,
      });
    }
  };

  const parseEvidenceUrls = (evidenceUrls: string | null) => {
    if (!evidenceUrls) return [];
    try {
      return JSON.parse(evidenceUrls);
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
          <FileText className="h-10 w-10 text-primary" />
          مراجعة الطلبات
        </h1>
        <p className="text-muted-foreground">مراجعة طلبات القضايا المقدمة من الأعضاء</p>
      </div>

      {/* Pending Count */}
      {!isLoading && requests && requests.length > 0 && (
        <Card className="bg-card border-border border-l-4 border-l-primary">
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-foreground font-semibold">
                {requests.length} طلب قيد الانتظار
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </>
        ) : requests?.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد طلبات قيد المراجعة</p>
            </CardContent>
          </Card>
        ) : (
          requests?.map((request) => {
            const evidenceUrls = parseEvidenceUrls(request.evidenceUrls);
            
            return (
              <Card key={request.id} className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-foreground">
                        طلب #{request.id} - {request.crimeType}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        مقدم الطلب: {request.requesterName}
                      </p>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> قيد المراجعة
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Suspect Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/30">
                    <div>
                      <p className="text-xs text-muted-foreground">المتهم</p>
                      <p className="text-sm font-semibold text-foreground">
                        {request.suspectRobloxUsername}
                      </p>
                      <p className="text-xs text-muted-foreground">ID: {request.suspectRobloxId}</p>
                    </div>
                    {request.complainantRobloxUsername && (
                      <div>
                        <p className="text-xs text-muted-foreground">المشتكي</p>
                        <p className="text-sm font-semibold text-foreground">
                          {request.complainantRobloxUsername}
                        </p>
                        <p className="text-xs text-muted-foreground">ID: {request.complainantRobloxId}</p>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">وصف الحادثة</p>
                    <p className="text-sm text-foreground">{request.description}</p>
                  </div>

                  {/* Location */}
                  {request.location && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">الموقع</p>
                      <p className="text-sm text-foreground">{request.location}</p>
                    </div>
                  )}

                  {/* Evidence */}
                  {evidenceUrls.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">الأدلة ({evidenceUrls.length})</p>
                      <div className="space-y-1">
                        {evidenceUrls.map((url: string, index: number) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline block truncate"
                          >
                            {url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Date */}
                  <div className="text-xs text-muted-foreground">
                    تاريخ الإرسال: {new Date(request.createdAt).toLocaleString('ar-SA')}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2 border-t border-border">
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => handleAction(request, "approve")}
                    >
                      <CheckCircle className="h-4 w-4 ml-2" />
                      الموافقة وإنشاء قضية
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleAction(request, "reject")}
                    >
                      <XCircle className="h-4 w-4 ml-2" />
                      رفض الطلب
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "الموافقة على الطلب" : "رفض الطلب"}
            </DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? "سيتم إنشاء قضية رسمية من هذا الطلب"
                : "يرجى إدخال سبب الرفض"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reviewNotes">
                {action === "approve" ? "ملاحظات (اختياري)" : "سبب الرفض *"}
              </Label>
              <Textarea
                id="reviewNotes"
                placeholder={
                  action === "approve"
                    ? "أضف ملاحظات إن وجدت..."
                    : "اشرح سبب رفض الطلب..."
                }
                rows={4}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                required={action === "reject"}
              />
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={confirmAction}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                {approveMutation.isPending || rejectMutation.isPending
                  ? "جاري المعالجة..."
                  : action === "approve"
                  ? "تأكيد الموافقة"
                  : "تأكيد الرفض"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setReviewNotes("");
                }}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

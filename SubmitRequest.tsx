import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function SubmitRequest() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState({
    suspectRobloxId: "",
    suspectRobloxUsername: "",
    complainantRobloxId: "",
    complainantRobloxUsername: "",
    crimeType: "",
    description: "",
    location: "",
    evidenceUrls: [""],
  });

  const createRequestMutation = trpc.caseRequests.create.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال طلب القضية بنجاح! سيتم مراجعته من قبل المسؤولين");
      setLocation("/my-requests");
    },
    onError: (error) => {
      toast.error(`فشل إرسال الطلب: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.suspectRobloxId || !formData.suspectRobloxUsername || !formData.crimeType || !formData.description) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    const evidenceUrls = formData.evidenceUrls.filter(url => url.trim() !== "");

    createRequestMutation.mutate({
      suspectRobloxId: Number(formData.suspectRobloxId),
      suspectRobloxUsername: formData.suspectRobloxUsername,
      complainantRobloxId: formData.complainantRobloxId ? Number(formData.complainantRobloxId) : undefined,
      complainantRobloxUsername: formData.complainantRobloxUsername || undefined,
      crimeType: formData.crimeType,
      description: formData.description,
      location: formData.location || undefined,
      evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : undefined,
    });
  };

  const addEvidenceField = () => {
    setFormData(prev => ({
      ...prev,
      evidenceUrls: [...prev.evidenceUrls, ""],
    }));
  };

  const updateEvidenceUrl = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      evidenceUrls: prev.evidenceUrls.map((url, i) => i === index ? value : url),
    }));
  };

  const removeEvidenceField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evidenceUrls: prev.evidenceUrls.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
          <FileText className="h-10 w-10 text-primary" />
          رفع طلب قضية
        </h1>
        <p className="text-muted-foreground">قدم طلب قضية جديدة للمراجعة من قبل المسؤولين</p>
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
          <p>• سيتم مراجعة طلبك من قبل الضباط أو المسؤولين</p>
          <p>• يرجى التأكد من صحة جميع المعلومات المدخلة</p>
          <p>• ستتلقى إشعاراً عند الموافقة أو الرفض</p>
          <p>• يمكنك متابعة حالة طلباتك من صفحة "طلباتي"</p>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">معلومات القضية</CardTitle>
            <CardDescription>املأ جميع الحقول المطلوبة بدقة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Suspect Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">معلومات المتهم *</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="suspectId">Roblox ID للمتهم</Label>
                  <Input
                    id="suspectId"
                    type="number"
                    placeholder="123456789"
                    value={formData.suspectRobloxId}
                    onChange={(e) => setFormData(prev => ({ ...prev, suspectRobloxId: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suspectUsername">اسم المتهم في Roblox</Label>
                  <Input
                    id="suspectUsername"
                    placeholder="PlayerName"
                    value={formData.suspectRobloxUsername}
                    onChange={(e) => setFormData(prev => ({ ...prev, suspectRobloxUsername: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Complainant Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">معلومات المشتكي (اختياري)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="complainantId">Roblox ID للمشتكي</Label>
                  <Input
                    id="complainantId"
                    type="number"
                    placeholder="123456789"
                    value={formData.complainantRobloxId}
                    onChange={(e) => setFormData(prev => ({ ...prev, complainantRobloxId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complainantUsername">اسم المشتكي في Roblox</Label>
                  <Input
                    id="complainantUsername"
                    placeholder="PlayerName"
                    value={formData.complainantRobloxUsername}
                    onChange={(e) => setFormData(prev => ({ ...prev, complainantRobloxUsername: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Crime Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">تفاصيل الجريمة *</h3>
              
              <div className="space-y-2">
                <Label htmlFor="crimeType">نوع الجريمة</Label>
                <Select value={formData.crimeType} onValueChange={(value) => setFormData(prev => ({ ...prev, crimeType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع الجريمة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="قتل">قتل</SelectItem>
                    <SelectItem value="سرقة">سرقة</SelectItem>
                    <SelectItem value="احتيال">احتيال</SelectItem>
                    <SelectItem value="اعتداء">اعتداء</SelectItem>
                    <SelectItem value="تهديد">تهديد</SelectItem>
                    <SelectItem value="تخريب">تخريب</SelectItem>
                    <SelectItem value="مخالفة مرورية">مخالفة مرورية</SelectItem>
                    <SelectItem value="أخرى">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">وصف الحادثة</Label>
                <Textarea
                  id="description"
                  placeholder="اشرح تفاصيل الحادثة بدقة..."
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">الموقع (اختياري)</Label>
                <Input
                  id="location"
                  placeholder="مكان وقوع الحادثة"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
            </div>

            {/* Evidence */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">الأدلة (اختياري)</h3>
                <Button type="button" variant="outline" size="sm" onClick={addEvidenceField}>
                  + إضافة رابط
                </Button>
              </div>
              
              <div className="space-y-2">
                {formData.evidenceUrls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="رابط الدليل (صورة، فيديو، Discord)"
                      value={url}
                      onChange={(e) => updateEvidenceUrl(index, e.target.value)}
                    />
                    {formData.evidenceUrls.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeEvidenceField(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={createRequestMutation.isPending}
              >
                {createRequestMutation.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/")}
              >
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

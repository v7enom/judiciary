import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Loader2, FileText } from "lucide-react";

export default function NewCase() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    robloxUserId: "",
    robloxUsername: "",
    accusedPlayerName: "",
    complainantName: "",
    complainantDiscordId: "",
    crimeType: "",
    description: "",
    witnesses: "",
    severity: "medium" as "low" | "medium" | "high" | "critical",
  });

  const upsertPlayerMutation = trpc.players.upsert.useMutation();
  const createCaseMutation = trpc.cases.create.useMutation({
    onSuccess: (data) => {
      toast.success(`تم إنشاء القضية ${data.caseNumber} بنجاح`);
      utils.cases.getAll.invalidate();
      utils.statistics.getCaseStats.invalidate();
      setLocation(`/cases/${data.caseId}`);
    },
    onError: (error) => {
      toast.error(`فشل إنشاء القضية: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق من البيانات
    if (!formData.robloxUserId || !formData.robloxUsername || !formData.accusedPlayerName) {
      toast.error("يرجى ملء معلومات المتهم كاملة");
      return;
    }

    if (!formData.complainantName || !formData.crimeType || !formData.description) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      // إنشاء أو تحديث اللاعب أولاً
      await upsertPlayerMutation.mutateAsync({
        robloxUserId: parseInt(formData.robloxUserId),
        robloxUsername: formData.robloxUsername,
      });

      // الحصول على معلومات اللاعب
      const player = await utils.players.getByRobloxId.fetch({
        robloxUserId: parseInt(formData.robloxUserId),
      });

      if (!player) {
        toast.error("فشل في الحصول على معلومات اللاعب");
        return;
      }

      // إنشاء القضية
      await createCaseMutation.mutateAsync({
        accusedPlayerId: player.id,
        accusedPlayerName: formData.accusedPlayerName,
        complainantName: formData.complainantName,
        complainantDiscordId: formData.complainantDiscordId || undefined,
        crimeType: formData.crimeType,
        description: formData.description,
        witnesses: formData.witnesses || undefined,
        severity: formData.severity,
      });
    } catch (error) {
      console.error("Error creating case:", error);
    }
  };

  const isLoading = upsertPlayerMutation.isPending || createCaseMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">قضية جديدة</h1>
        <p className="text-muted-foreground">إنشاء قضية جنائية جديدة في النظام</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* معلومات المتهم */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              معلومات المتهم
            </CardTitle>
            <CardDescription>بيانات اللاعب المتهم في Roblox</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="robloxUserId">Roblox User ID *</Label>
                <Input
                  id="robloxUserId"
                  type="number"
                  placeholder="123456789"
                  value={formData.robloxUserId}
                  onChange={(e) => setFormData({ ...formData, robloxUserId: e.target.value })}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="robloxUsername">Roblox Username *</Label>
                <Input
                  id="robloxUsername"
                  placeholder="PlayerName"
                  value={formData.robloxUsername}
                  onChange={(e) => setFormData({ ...formData, robloxUsername: e.target.value })}
                  required
                  className="bg-background"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accusedPlayerName">اسم المتهم بالكامل *</Label>
              <Input
                id="accusedPlayerName"
                placeholder="الاسم الكامل للمتهم"
                value={formData.accusedPlayerName}
                onChange={(e) => setFormData({ ...formData, accusedPlayerName: e.target.value })}
                required
                className="bg-background"
              />
            </div>
          </CardContent>
        </Card>

        {/* معلومات المشتكي */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">معلومات المشتكي</CardTitle>
            <CardDescription>بيانات الشخص الذي قدم الشكوى</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="complainantName">اسم المشتكي *</Label>
                <Input
                  id="complainantName"
                  placeholder="الاسم الكامل"
                  value={formData.complainantName}
                  onChange={(e) => setFormData({ ...formData, complainantName: e.target.value })}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complainantDiscordId">Discord ID (اختياري)</Label>
                <Input
                  id="complainantDiscordId"
                  placeholder="123456789012345678"
                  value={formData.complainantDiscordId}
                  onChange={(e) => setFormData({ ...formData, complainantDiscordId: e.target.value })}
                  className="bg-background"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* تفاصيل القضية */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">تفاصيل القضية</CardTitle>
            <CardDescription>وصف الجريمة والمعلومات ذات الصلة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="crimeType">نوع الجريمة *</Label>
                <Input
                  id="crimeType"
                  placeholder="مثال: سرقة، اعتداء، احتيال"
                  value={formData.crimeType}
                  onChange={(e) => setFormData({ ...formData, crimeType: e.target.value })}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">مستوى الخطورة *</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value: any) => setFormData({ ...formData, severity: value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفض</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="high">عالي</SelectItem>
                    <SelectItem value="critical">حرج</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">وصف القضية *</Label>
              <Textarea
                id="description"
                placeholder="وصف تفصيلي للجريمة والأحداث..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={6}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="witnesses">الشهود (اختياري)</Label>
              <Textarea
                id="witnesses"
                placeholder="أسماء الشهود إن وجدوا (كل اسم في سطر منفصل)"
                value={formData.witnesses}
                onChange={(e) => setFormData({ ...formData, witnesses: e.target.value })}
                rows={3}
                className="bg-background"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              "إنشاء القضية"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setLocation("/cases")}
            disabled={isLoading}
          >
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
}

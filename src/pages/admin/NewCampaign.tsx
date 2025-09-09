import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Header from "@/components/Header";
import CampaignDetailCard from "@/components/wizard/CampaignDetailCard";
import { useToast } from "@/hooks/use-toast";
import { saveCampaignToNotion } from "@/lib/api-stubs";
import { addCampaign, platformOptions, statusOptions, generateDistributionUrl } from "@/lib/mock-data";
import { SocialIcon } from "@/components/SocialIcons";
import { Loader2, Eye, Copy, Check } from "lucide-react";

const NewCampaign = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [requirements, setRequirements] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState<number>(0);
  const [budgetMax, setBudgetMax] = useState<number>(0);
  const [deadline, setDeadline] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [ndaUrl, setNdaUrl] = useState("");
  const [status, setStatus] = useState<'open' | 'closed'>('open');
  const [contactEmail, setContactEmail] = useState("");
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "案件タイトルは必須です";
    }

    if (!slug.trim()) {
      newErrors.slug = "公開スラッグは必須です";
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      newErrors.slug = "スラッグは小文字の英数字とハイフンのみ使用可能です";
    }

    if (!summary.trim()) {
      newErrors.summary = "概要は必須です";
    }

    if (selectedPlatforms.length === 0) {
      newErrors.platforms = "少なくとも1つのプラットフォームを選択してください";
    }

    if (budgetMax <= budgetMin) {
      newErrors.budget = "最大予算は最小予算より大きい値を設定してください";
    }

    if (!deadline) {
      newErrors.deadline = "締切日は必須です";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "入力エラー",
        description: "必須項目をご確認ください",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const campaignData = {
        title: title.trim(),
        slug: slug.trim(),
        summary: summary.trim(),
        requirements: requirements.trim(),
        platforms: selectedPlatforms,
        budgetMin,
        budgetMax,
        deadline,
        restrictions: restrictions.trim(),
        ndaUrl: ndaUrl.trim(),
        status,
        contactEmail: contactEmail.trim(),
      };

      // Save to Notion (stub)
      await saveCampaignToNotion(campaignData);
      
      // Add to mock data
      const newCampaign = addCampaign(campaignData);
      
      toast({
        title: "案件作成完了",
        description: `案件「${newCampaign.title}」を作成しました`,
      });

      // Navigate to campaign list
      navigate('/admin/list');
    } catch (error) {
      toast({
        title: "作成エラー",
        description: "案件の作成に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlatformToggle = (platform: string, checked: boolean) => {
    if (checked) {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    } else {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    }
    if (errors.platforms) {
      setErrors(prev => ({ ...prev, platforms: '' }));
    }
  };

  const copyDistributionUrl = async () => {
    const url = `${window.location.origin}${generateDistributionUrl(slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      setUrlCopied(true);
      toast({
        title: "URLをコピーしました",
        description: url,
      });
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (error) {
      toast({
        title: "コピーに失敗しました",
        description: "手動でURLをコピーしてください",
        variant: "destructive",
      });
    }
  };

  const previewCampaign = {
    id: 'preview',
    title,
    slug,
    summary,
    requirements,
    platforms: selectedPlatforms,
    budgetMin,
    budgetMax,
    deadline,
    restrictions,
    ndaUrl,
    status,
    contactEmail,
    createdAt: new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">新規案件作成</h1>
              <p className="text-muted-foreground">インフルエンサー配布用の案件を作成します</p>
            </div>
            
            <div className="flex space-x-2">
              <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    プレビュー
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>案件詳細プレビュー</DialogTitle>
                  </DialogHeader>
                  <CampaignDetailCard campaign={previewCampaign} />
                </DialogContent>
              </Dialog>
              
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                variant="wizard"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    作成中...
                  </>
                ) : (
                  "案件を作成"
                )}
              </Button>
            </div>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    案件タイトル <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                    }}
                    placeholder="例: 春の新商品プロモーション"
                    className={errors.title ? "border-destructive" : ""}
                  />
                  {errors.title && (
                    <p className="text-xs text-destructive">{errors.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm font-medium">
                    公開スラッグ <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setSlug(value);
                      if (errors.slug) setErrors(prev => ({ ...prev, slug: '' }));
                    }}
                    placeholder="例: spring-cosmetics-2025"
                    className={errors.slug ? "border-destructive" : ""}
                  />
                  {errors.slug && (
                    <p className="text-xs text-destructive">{errors.slug}</p>
                  )}
                  {slug && (
                    <div className="flex items-center space-x-2 mt-2">
                      <p className="text-xs text-muted-foreground">
                        配布URL: /i/{slug}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyDistributionUrl}
                        disabled={!slug}
                      >
                        {urlCopied ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary" className="text-sm font-medium">
                  概要 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => {
                    setSummary(e.target.value);
                    if (errors.summary) setErrors(prev => ({ ...prev, summary: '' }));
                  }}
                  placeholder="案件の概要を簡潔に説明してください"
                  rows={3}
                  className={errors.summary ? "border-destructive" : ""}
                />
                {errors.summary && (
                  <p className="text-xs text-destructive">{errors.summary}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements" className="text-sm font-medium">
                  成果物・条件
                </Label>
                <Textarea
                  id="requirements"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="具体的な成果物や条件を記載してください（投稿回数、ハッシュタグなど）"
                  rows={5}
                />
              </div>

              {/* プラットフォーム選択 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  想定媒体 <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {platformOptions.map((platform) => (
                    <div key={platform.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={platform.value}
                        checked={selectedPlatforms.includes(platform.value)}
                        onCheckedChange={(checked) => 
                          handlePlatformToggle(platform.value, checked === true)
                        }
                      />
                      <label 
                        htmlFor={platform.value} 
                        className="text-sm cursor-pointer flex items-center space-x-2"
                      >
                        <SocialIcon platform={platform.value} className="w-4 h-4" />
                        <span>{platform.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
                {errors.platforms && (
                  <p className="text-xs text-destructive">{errors.platforms}</p>
                )}
              </div>

              {/* 予算・締切 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget-min" className="text-sm font-medium">
                    最小予算 (円)
                  </Label>
                  <Input
                    id="budget-min"
                    type="number"
                    min="0"
                    value={budgetMin || ''}
                    onChange={(e) => {
                      setBudgetMin(parseInt(e.target.value) || 0);
                      if (errors.budget) setErrors(prev => ({ ...prev, budget: '' }));
                    }}
                    placeholder="30000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget-max" className="text-sm font-medium">
                    最大予算 (円)
                  </Label>
                  <Input
                    id="budget-max"
                    type="number"
                    min="0"
                    value={budgetMax || ''}
                    onChange={(e) => {
                      setBudgetMax(parseInt(e.target.value) || 0);
                      if (errors.budget) setErrors(prev => ({ ...prev, budget: '' }));
                    }}
                    placeholder="80000"
                    className={errors.budget ? "border-destructive" : ""}
                  />
                  {errors.budget && (
                    <p className="text-xs text-destructive">{errors.budget}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline" className="text-sm font-medium">
                    締切日 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => {
                      setDeadline(e.target.value);
                      if (errors.deadline) setErrors(prev => ({ ...prev, deadline: '' }));
                    }}
                    className={errors.deadline ? "border-destructive" : ""}
                  />
                  {errors.deadline && (
                    <p className="text-xs text-destructive">{errors.deadline}</p>
                  )}
                </div>
              </div>

              {/* その他の設定 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="restrictions" className="text-sm font-medium">
                    NG事項・制約
                  </Label>
                  <Textarea
                    id="restrictions"
                    value={restrictions}
                    onChange={(e) => setRestrictions(e.target.value)}
                    placeholder="避けてほしい表現や制約事項があれば記載してください"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nda-url" className="text-sm font-medium">
                    NDA URL
                  </Label>
                  <Input
                    id="nda-url"
                    type="url"
                    value={ndaUrl}
                    onChange={(e) => setNdaUrl(e.target.value)}
                    placeholder="https://example.com/nda.pdf"
                  />
                  <p className="text-xs text-muted-foreground">
                    機密保持契約書のPDFリンクを設定してください
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium">
                      ステータス
                    </Label>
                    <Select
                      value={status}
                      onValueChange={(value: 'open' | 'closed') => setStatus(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-email" className="text-sm font-medium">
                      連絡窓口メール
                    </Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="contact@example.com"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NewCampaign;
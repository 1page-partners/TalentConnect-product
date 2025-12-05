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
import { campaignApi, generateDistributionUrl } from "@/lib/api";
import { platformOptions, platformDeliverables, ndaTemplateOptions, secondaryUsageDurationOptions, statusOptions } from "@/lib/mock-data";
import { SocialIcon } from "@/components/SocialIcons";
import { Loader2, Eye, ArrowLeft, Upload, X, Plus, Copy, Check } from "lucide-react";

const NewCampaignEnhanced = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Enhanced form state
  const [clientName, setClientName] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [requirements, setRequirements] = useState("");
  const [isTH, setIsTH] = useState(false);
  const [imageMaterials, setImageMaterials] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [platformDeliverableMap, setPlatformDeliverableMap] = useState<Record<string, string[]>>({});
  const [otherPlatformText, setOtherPlatformText] = useState("");
  const [deadline, setDeadline] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [ndaTemplate, setNdaTemplate] = useState<'PlanC' | 'MARKON' | 'custom'>('PlanC');
  const [ndaUrl, setNdaUrl] = useState("");
  const [isVideoProductionOnly, setIsVideoProductionOnly] = useState(false);
  const [hasSecondaryUsage, setHasSecondaryUsage] = useState(false);
  const [secondaryUsageDuration, setSecondaryUsageDuration] = useState<string>("");
  const [secondaryUsagePurpose, setSecondaryUsagePurpose] = useState("");
  const [hasAdvertisementAppearance, setHasAdvertisementAppearance] = useState(false);
  const [plannedPostDate, setPlannedPostDate] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [status, setStatus] = useState<'open' | 'closed'>('open');
  const [contactEmail, setContactEmail] = useState("");
  const [requiresConsent, setRequiresConsent] = useState(true);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdCampaign, setCreatedCampaign] = useState<{ slug: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!clientName.trim()) {
      newErrors.clientName = "クライアント名は必須です";
    }

    if (!title.trim()) {
      newErrors.title = "案件タイトルは必須です";
    }

    if (!summary.trim()) {
      newErrors.summary = "概要は必須です";
    }

    if (selectedPlatforms.length === 0) {
      newErrors.platforms = "少なくとも1つのプラットフォームを選択してください";
    }

    if (!deadline) {
      newErrors.deadline = "締切日は必須です";
    }

    if (hasSecondaryUsage && !secondaryUsageDuration) {
      newErrors.secondaryUsageDuration = "二次利用期間を選択してください";
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
      // Generate unique slug from title + timestamp
      const baseSlug = title.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      const slug = `${baseSlug}-${Date.now().toString(36)}`;

      const campaignData = {
        client_name: clientName.trim(),
        title: title.trim(),
        slug,
        summary: summary.trim(),
        requirements: requirements.trim() || null,
        platforms: selectedPlatforms,
        deadline,
        restrictions: restrictions.trim() || null,
        nda_url: ndaTemplate === 'custom' ? ndaUrl.trim() : null,
        nda_template: ndaTemplate,
        status,
        contact_email: contactEmail.trim() || null,
        is_th: isTH,
        image_materials: imageMaterials.length > 0 ? imageMaterials : null,
        platform_deliverables: platformDeliverableMap,
        is_video_production_only: isVideoProductionOnly,
        secondary_usage: hasSecondaryUsage ? {
          hasUsage: true,
          duration: secondaryUsageDuration,
          purpose: secondaryUsagePurpose.trim()
        } : { hasUsage: false },
        has_advertisement_appearance: hasAdvertisementAppearance,
        planned_post_date: plannedPostDate || null,
        attachments: attachments.length > 0 ? attachments : null,
        requires_consent: requiresConsent,
      };

      const newCampaign = await campaignApi.create(campaignData);
      
      setCreatedCampaign({ slug: newCampaign.slug });
      
      toast({
        title: "案件作成完了",
        description: `案件「${newCampaign.title}」を作成しました`,
      });
    } catch (error) {
      console.error('Campaign creation error:', error);
      toast({
        title: "作成エラー",
        description: "案件の作成に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyUrl = async (url: string, type: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(type);
    setTimeout(() => setCopiedUrl(null), 2000);
    toast({
      title: "コピーしました",
      description: "URLをクリップボードにコピーしました",
    });
  };

  const handlePlatformToggle = (platform: string, checked: boolean) => {
    if (checked) {
      setSelectedPlatforms([...selectedPlatforms, platform]);
      if (platform !== 'その他') {
        setPlatformDeliverableMap(prev => ({
          ...prev,
          [platform]: []
        }));
      }
    } else {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
      setPlatformDeliverableMap(prev => {
        const newMap = { ...prev };
        delete newMap[platform];
        return newMap;
      });
    }
    if (errors.platforms) {
      setErrors(prev => ({ ...prev, platforms: '' }));
    }
  };

  const handleDeliverableToggle = (platform: string, deliverable: string, checked: boolean) => {
    setPlatformDeliverableMap(prev => {
      const currentDeliverables = prev[platform] || [];
      if (checked) {
        return {
          ...prev,
          [platform]: [...currentDeliverables, deliverable]
        };
      } else {
        return {
          ...prev,
          [platform]: currentDeliverables.filter(d => d !== deliverable)
        };
      }
    });
  };

  const previewCampaign = {
    id: 'preview',
    clientName,
    title,
    slug: title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
    summary,
    requirements,
    platforms: selectedPlatforms,
    deadline,
    restrictions,
    ndaUrl: ndaTemplate === 'custom' ? ndaUrl : `https://example.com/nda-${ndaTemplate.toLowerCase()}.pdf`,
    status,
    contactEmail,
    createdAt: new Date().toISOString(),
    // Enhanced fields
    isTH,
    imageMaterials,
    platformDeliverables: platformDeliverableMap,
    ndaTemplate,
    isVideoProductionOnly,
    secondaryUsage: hasSecondaryUsage ? {
      hasUsage: true,
      duration: secondaryUsageDuration as any,
      purpose: secondaryUsagePurpose
    } : { hasUsage: false },
    hasAdvertisementAppearance,
    plannedPostDate,
    attachments,
    requiresConsent,
  };

  // 作成完了ダイアログ
  if (createdCampaign) {
    const urls = generateDistributionUrl(createdCampaign.slug, true);
    const urlWithConsent = `${window.location.origin}/i/${createdCampaign.slug}`;
    const urlWithoutConsent = `${window.location.origin}/c/${createdCampaign.slug}`;

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">案件を作成しました</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    参加許諾フロー付きURL（NDA同意→案件詳細→情報提出）
                  </Label>
                  <div className="flex gap-2">
                    <Input value={urlWithConsent} readOnly className="font-mono text-sm" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopyUrl(urlWithConsent, 'consent')}
                    >
                      {copiedUrl === 'consent' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    案件詳細のみURL（参加許諾なし）
                  </Label>
                  <div className="flex gap-2">
                    <Input value={urlWithoutConsent} readOnly className="font-mono text-sm" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopyUrl(urlWithoutConsent, 'detail')}
                    >
                      {copiedUrl === 'detail' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => navigate('/admin/list')} className="flex-1">
                  案件一覧へ
                </Button>
                <Button onClick={() => {
                  setCreatedCampaign(null);
                  setClientName("");
                  setTitle("");
                  setSummary("");
                  setRequirements("");
                  setSelectedPlatforms([]);
                  setPlatformDeliverableMap({});
                  setDeadline("");
                  setRestrictions("");
                }} className="flex-1">
                  新規案件を作成
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/admin/list')}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">新規案件作成</h1>
                <p className="text-muted-foreground">インフルエンサー配布用の案件を作成します</p>
              </div>
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

          {/* 基本情報 */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-name" className="text-sm font-medium">
                    クライアント名 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="client-name"
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value);
                      if (errors.clientName) setErrors(prev => ({ ...prev, clientName: '' }));
                    }}
                    placeholder="例: 株式会社ABC"
                    className={errors.clientName ? "border-destructive" : ""}
                  />
                  {errors.clientName && (
                    <p className="text-xs text-destructive">{errors.clientName}</p>
                  )}
                </div>

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
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-th"
                  checked={isTH}
                  onCheckedChange={(checked) => setIsTH(checked === true)}
                />
                <Label htmlFor="is-th" className="text-sm cursor-pointer">
                  TH案件
                </Label>
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
                <Label className="text-sm font-medium">
                  画像資料
                </Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    画像をドラッグ&ドロップまたはクリックして選択
                  </p>
                  <Button variant="outline" size="sm">
                    ファイルを選択
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 想定媒体と成果物 */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>想定媒体・成果物</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  想定媒体 <span className="text-destructive">*</span>
                </Label>
                
                {platformOptions.map((platform) => (
                  <div key={platform.value} className="space-y-3">
                    <div className="flex items-center space-x-2">
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

                    {selectedPlatforms.includes(platform.value) && (
                      <div className="ml-6 space-y-2">
                        {platform.value === 'その他' ? (
                          <Input
                            placeholder="詳細を入力してください"
                            value={otherPlatformText}
                            onChange={(e) => setOtherPlatformText(e.target.value)}
                            className="max-w-md"
                          />
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {platformDeliverables[platform.value]?.map((deliverable) => (
                              <div key={deliverable} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${platform.value}-${deliverable}`}
                                  checked={platformDeliverableMap[platform.value]?.includes(deliverable) || false}
                                  onCheckedChange={(checked) =>
                                    handleDeliverableToggle(platform.value, deliverable, checked === true)
                                  }
                                />
                                <Label
                                  htmlFor={`${platform.value}-${deliverable}`}
                                  className="text-xs cursor-pointer"
                                >
                                  {deliverable}
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {errors.platforms && (
                  <p className="text-xs text-destructive">{errors.platforms}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements" className="text-sm font-medium">
                  成果物・条件詳細
                </Label>
                <Textarea
                  id="requirements"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="具体的な成果物や条件を記載してください（投稿回数、ハッシュタグなど）"
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* スケジュール・契約条件 */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>スケジュール・契約条件</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="planned-post-date" className="text-sm font-medium">
                    投稿予定日
                  </Label>
                  <Input
                    id="planned-post-date"
                    type="month"
                    value={plannedPostDate}
                    onChange={(e) => setPlannedPostDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">利用NDAテンプレート</Label>
                  <Select
                    value={ndaTemplate}
                    onValueChange={(value: 'PlanC' | 'MARKON' | 'custom') => setNdaTemplate(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ndaTemplateOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {ndaTemplate === 'custom' && (
                    <div className="mt-2">
                      <Input
                        placeholder="カスタムNDA URL"
                        type="url"
                        value={ndaUrl}
                        onChange={(e) => setNdaUrl(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="video-production-only"
                    checked={isVideoProductionOnly}
                    onCheckedChange={(checked) => setIsVideoProductionOnly(checked === true)}
                  />
                  <Label htmlFor="video-production-only" className="text-sm cursor-pointer">
                    納品動画の制作のみ
                  </Label>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="secondary-usage"
                      checked={hasSecondaryUsage}
                      onCheckedChange={(checked) => setHasSecondaryUsage(checked === true)}
                    />
                    <Label htmlFor="secondary-usage" className="text-sm cursor-pointer">
                      二次利用の有無
                    </Label>
                  </div>

                  {hasSecondaryUsage && (
                    <div className="ml-6 space-y-3">
                      <div>
                        <Label className="text-sm font-medium">利用期間</Label>
                        <Select
                          value={secondaryUsageDuration}
                          onValueChange={setSecondaryUsageDuration}
                        >
                          <SelectTrigger className={errors.secondaryUsageDuration ? "border-destructive" : ""}>
                            <SelectValue placeholder="期間を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {secondaryUsageDurationOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.secondaryUsageDuration && (
                          <p className="text-xs text-destructive">{errors.secondaryUsageDuration}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="secondary-usage-purpose" className="text-sm font-medium">
                          用途
                        </Label>
                        <Input
                          id="secondary-usage-purpose"
                          placeholder="例: サイト利用、広告利用"
                          value={secondaryUsagePurpose}
                          onChange={(e) => setSecondaryUsagePurpose(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="advertisement-appearance"
                    checked={hasAdvertisementAppearance}
                    onCheckedChange={(checked) => setHasAdvertisementAppearance(checked === true)}
                  />
                  <Label htmlFor="advertisement-appearance" className="text-sm cursor-pointer">
                    広告出演の有無
                  </Label>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="requires-consent"
                      checked={requiresConsent}
                      onCheckedChange={(checked) => setRequiresConsent(checked === true)}
                    />
                    <div>
                      <Label htmlFor="requires-consent" className="text-sm cursor-pointer">
                        参加許諾フローを含める（NDA同意→案件詳細→情報提出）
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        チェックを外すと、案件詳細のみを表示するURLも生成されます
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 添付資料・その他 */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>添付資料・その他</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  添付資料アップロード（最大10個まで）
                </Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    資料をドラッグ&ドロップまたはクリックして選択
                  </p>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    ファイルを選択
                  </Button>
                </div>
              </div>

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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NewCampaignEnhanced;
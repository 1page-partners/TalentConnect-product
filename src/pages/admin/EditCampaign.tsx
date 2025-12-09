import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import FilePreviewModal from "@/components/ui/file-preview-modal";
import { useToast } from "@/hooks/use-toast";
import { useFileUpload } from "@/hooks/useFileUpload";
import { FileUpload } from "@/components/ui/file-upload";
import { campaignApi, Campaign } from "@/lib/api";
import { platformOptions, platformDeliverables, ndaTemplateOptions, secondaryUsageDurationOptions, statusOptions } from "@/lib/mock-data";
import { SocialIcon } from "@/components/SocialIcons";
import { Loader2, Eye, ArrowLeft, X, Copy, Check } from "lucide-react";

// ファイルタイプを判定するヘルパー関数
const getFileType = (url: string): 'image' | 'video' | 'pdf' | 'other' => {
  const urlWithoutQuery = url.split('?')[0];
  const extension = urlWithoutQuery.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
  if (['mp4', 'mov', 'avi', 'webm'].includes(extension)) return 'video';
  if (extension === 'pdf') return 'pdf';
  return 'other';
};

// ファイル名を取得するヘルパー関数
const getFileName = (url: string): string => {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  try {
    return decodeURIComponent(filename.split('?')[0]);
  } catch {
    return filename.split('?')[0];
  }
};

const EditCampaign = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
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
  const [status, setStatus] = useState<string>('active');
  const [contactEmail, setContactEmail] = useState("");
  // 納品物条件
  const [shootingOnly, setShootingOnly] = useState(false);
  const [editingOnly, setEditingOnly] = useState(false);
  const [shootingAndEditing, setShootingAndEditing] = useState(false);
  const [tieupPostProduction, setTieupPostProduction] = useState(false);
  
  // 募集停止フラグ
  const [isClosed, setIsClosed] = useState(false);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: 'image' | 'video' | 'pdf' | 'other'; name: string } | null>(null);

  const openFilePreview = (url: string) => {
    const fileType = getFileType(url);
    const fileName = getFileName(url);
    setPreviewFile({ url, type: fileType, name: fileName });
  };

  // File upload hooks
  const imageUpload = useFileUpload({
    folder: 'campaigns/images',
    allowedTypes: ['image/*'],
    maxSizeMB: 10,
  });
  const attachmentUpload = useFileUpload({
    folder: 'campaigns/attachments',
    allowedTypes: ['image/*', 'application/pdf', 'video/*'],
    maxSizeMB: 50,
  });

  // Load campaign data
  useEffect(() => {
    const loadCampaign = async () => {
      if (!id) return;
      
      try {
        const campaign = await campaignApi.getById(id);
        if (!campaign) {
          toast({ title: "エラー", description: "案件が見つかりません", variant: "destructive" });
          navigate('/admin/list');
          return;
        }

        // Populate form fields
        setClientName(campaign.client_name || "");
        setTitle(campaign.title || "");
        setSummary(campaign.summary || "");
        setRequirements("");
        setIsTH(false);
        setImageMaterials(campaign.image_materials || []);
        setSelectedPlatforms(campaign.platforms || []);
        
        // Parse platform deliverables
        const deliverables = campaign.deliverables as Record<string, string[]> | null;
        setPlatformDeliverableMap(deliverables || {});
        
        setDeadline(campaign.deadline || "");
        setPlannedPostDate(campaign.posting_date || "");
        setRestrictions(campaign.restrictions || "");
        setNdaTemplate((campaign.nda_template as 'PlanC' | 'MARKON' | 'custom') || 'PlanC');
        setNdaUrl(campaign.nda_url || "");
        setIsVideoProductionOnly(campaign.video_production_only || false);
        
        // Parse secondary usage (now a jsonb object)
        const secondaryUsageData = campaign.secondary_usage as { hasUsage?: boolean; duration?: string; purpose?: string } | null;
        if (secondaryUsageData?.hasUsage) {
          setHasSecondaryUsage(true);
          setSecondaryUsageDuration(secondaryUsageData.duration || "");
          setSecondaryUsagePurpose(secondaryUsageData.purpose || "");
        }
        
        setHasAdvertisementAppearance(campaign.ad_appearance || false);
        setAttachments(campaign.attachments || []);
        setStatus(campaign.status || 'active');
        setContactEmail(campaign.contact_email || "");
        // 納品物条件
        setShootingOnly(campaign.shooting_only || false);
        setEditingOnly(campaign.editing_only || false);
        setShootingAndEditing(campaign.shooting_and_editing || false);
        setTieupPostProduction(campaign.tieup_post_production || false);
        setIsClosed(campaign.is_closed || false);
      } catch (error) {
        console.error('Campaign load error:', error);
        toast({ title: "エラー", description: "案件の読み込みに失敗しました", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaign();
  }, [id, navigate, toast]);

  const handleImageUpload = async (files: FileList) => {
    const urls = await imageUpload.uploadFiles(files);
    setImageMaterials(prev => [...prev, ...urls]);
  };

  const handleImageRemove = (index: number) => {
    setImageMaterials(prev => prev.filter((_, i) => i !== index));
  };

  const handleAttachmentUpload = async (files: FileList) => {
    const urls = await attachmentUpload.uploadFiles(files);
    setAttachments(prev => [...prev, ...urls]);
  };

  const handleAttachmentRemove = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

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
    if (!validateForm() || !id) {
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
        client_name: clientName.trim(),
        title: title.trim(),
        summary: summary.trim(),
        platforms: selectedPlatforms,
        deadline: deadline || null,
        posting_date: plannedPostDate || null,
        restrictions: restrictions.trim() || null,
        nda_url: ndaTemplate === 'custom' ? ndaUrl.trim() : null,
        nda_template: ndaTemplate,
        status,
        contact_email: contactEmail.trim() || null,
        image_materials: imageMaterials.length > 0 ? imageMaterials : null,
        deliverables: platformDeliverableMap,
        video_production_only: isVideoProductionOnly,
        secondary_usage: hasSecondaryUsage
          ? { hasUsage: true, duration: secondaryUsageDuration, purpose: secondaryUsagePurpose.trim() }
          : null,
        ad_appearance: hasAdvertisementAppearance,
        attachments: attachments.length > 0 ? attachments : null,
        shooting_only: shootingOnly,
        editing_only: editingOnly,
        shooting_and_editing: shootingAndEditing,
        tieup_post_production: tieupPostProduction,
        is_closed: isClosed,
      };

      await campaignApi.update(id, campaignData);
      
      toast({
        title: "保存完了",
        description: "案件情報を更新しました",
      });
      
      navigate(`/admin/campaign/${id}`);
    } catch (error) {
      console.error('Campaign update error:', error);
      toast({
        title: "更新エラー",
        description: "案件の更新に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlatformToggle = (platform: string, checked: boolean) => {
    if (checked) {
      setSelectedPlatforms([...selectedPlatforms, platform]);
      if (platform !== 'その他') {
        setPlatformDeliverableMap(prev => ({
          ...prev,
          [platform]: prev[platform] || []
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
    slug: '',
    summary,
    requirements,
    platforms: selectedPlatforms,
    deadline,
    restrictions,
    ndaUrl: ndaTemplate === 'custom' ? ndaUrl : `https://example.com/nda-${ndaTemplate.toLowerCase()}.pdf`,
    status: status as 'open' | 'closed',
    contactEmail,
    createdAt: new Date().toISOString(),
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
    requiresConsent: true,
    shootingOnly,
    editingOnly,
    shootingAndEditing,
    tieupPostProduction,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate(`/admin/campaign/${id}`)}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              戻る
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">案件編集</h1>
              <p className="text-muted-foreground">案件情報を編集します</p>
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
                <FileUpload
                  onFilesSelected={handleImageUpload}
                  onRemove={handleImageRemove}
                  onPreview={openFilePreview}
                  files={imageMaterials}
                  accept="image/*"
                  isUploading={imageUpload.isUploading}
                  label="画像をドラッグ&ドロップまたはクリックして選択"
                  hint="PNG, JPG, GIF, WebP対応（最大10MB）"
                />
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

              {/* 納品物条件 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">納品物条件</Label>
                <div className="space-y-3 ml-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="shooting-only"
                      checked={shootingOnly}
                      onCheckedChange={(checked) => setShootingOnly(checked === true)}
                    />
                    <Label htmlFor="shooting-only" className="text-sm cursor-pointer">
                      撮影のみ
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="editing-only"
                      checked={editingOnly}
                      onCheckedChange={(checked) => setEditingOnly(checked === true)}
                    />
                    <Label htmlFor="editing-only" className="text-sm cursor-pointer">
                      編集のみ
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="shooting-and-editing"
                      checked={shootingAndEditing}
                      onCheckedChange={(checked) => setShootingAndEditing(checked === true)}
                    />
                    <Label htmlFor="shooting-and-editing" className="text-sm cursor-pointer">
                      撮影＆編集の制作のみ
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tieup-post-production"
                      checked={tieupPostProduction}
                      onCheckedChange={(checked) => setTieupPostProduction(checked === true)}
                    />
                    <Label htmlFor="tieup-post-production" className="text-sm cursor-pointer">
                      タイアップ投稿の制作
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
                <FileUpload
                  onFilesSelected={handleAttachmentUpload}
                  onRemove={handleAttachmentRemove}
                  onPreview={openFilePreview}
                  files={attachments}
                  isUploading={attachmentUpload.isUploading}
                  maxFiles={10}
                  label="資料をドラッグ&ドロップまたはクリックして選択"
                  hint="画像、PDF、動画対応（最大50MB）"
                />
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
                    onValueChange={(value: string) => setStatus(value)}
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
      
      {/* Sticky footer with action buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t shadow-lg z-50">
        <div className="container mx-auto px-4 py-4 max-w-4xl flex justify-end space-x-3">
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
                保存中...
              </>
            ) : (
              "変更を保存"
            )}
          </Button>
        </div>
      </div>

      {/* ファイルプレビューモーダル */}
      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url || ''}
        fileType={previewFile?.type || 'other'}
        fileName={previewFile?.name}
      />
    </div>
  );
};

export default EditCampaign;

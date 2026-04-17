import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useFileUpload } from "@/hooks/useFileUpload";
import { FileUpload } from "@/components/ui/file-upload";
import { submissionApi } from "@/lib/api";
import { fetchYouTubeSubs, fetchInstagramFollowers, fetchTikTokFollowers, fetchXFollowers } from "@/lib/api-stubs";
import { platformOptions, contactMethodOptions } from "@/lib/mock-data";
import { SocialIcon } from "@/components/SocialIcons";
import { Loader2, Plus, Trash2, Download, AlertTriangle, Check, ArrowLeft, Info, ExternalLink } from "lucide-react";

interface SubmissionFormEnhancedProps {
  onNext: () => void;
  onBack?: () => void;
  campaignId: string;
  isPreview?: boolean;
}

interface SocialAccount {
  platform: string;
  url: string;
  followers: number;
  fetchedAt?: string;
  isLoading?: boolean;
}

// ハンドル形式を必要とするプラットフォーム
const HANDLE_PLATFORMS = ['Instagram', 'TikTok', 'X'];
// URL形式を必要とするプラットフォーム
const URL_PLATFORMS = ['YouTube'];

// バリデーションヘルパー関数
const validateHandle = (value: string): boolean => {
  // @から始まり、英数字とアンダースコアのみ許可
  return /^@[a-zA-Z0-9_]+$/.test(value);
};

const validateYouTubeUrl = (value: string): boolean => {
  // YouTubeチャンネルURLのパターン
  return /^https?:\/\/(www\.)?(youtube\.com\/(channel\/|c\/|@|user\/)|youtu\.be\/)/i.test(value);
};

const validatePhoneNumber = (value: string): boolean => {
  // ハイフンあり形式: 090-1234-5678, 03-1234-5678, 0120-123-456 など
  return /^\d{2,4}-\d{2,4}-\d{3,4}$/.test(value);
};

const formatPhoneNumber = (value: string): string => {
  // 数字のみを抽出
  const digits = value.replace(/\D/g, '');
  
  // 長さに応じてフォーマット
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
};

const getInputPlaceholder = (platform: string): string => {
  if (HANDLE_PLATFORMS.includes(platform)) {
    return '@username （@から始まるハンドル）';
  }
  if (URL_PLATFORMS.includes(platform)) {
    return 'https://www.youtube.com/channel/... または https://www.youtube.com/@...';
  }
  if (platform === 'その他') {
    return 'アカウント名(プラットフォーム)';
  }
  return '';
};

const getInputHint = (platform: string): string => {
  if (HANDLE_PLATFORMS.includes(platform)) {
    return '⚠️ 必ず「@」から始めてください（例: @username）';
  }
  if (URL_PLATFORMS.includes(platform)) {
    return '⚠️ YouTubeチャンネルのURLを入力してください（例: https://www.youtube.com/@channelname）';
  }
  if (platform === 'その他') {
    return '💡 例: tanaka_taro(Threads)、yamada123(Weibo) など';
  }
  return '';
};

// REDやその他の場合はヒントメッセージを表示しない
const shouldShowHintBox = (platform: string): boolean => {
  return HANDLE_PLATFORMS.includes(platform) || URL_PLATFORMS.includes(platform) || platform === 'その他';
};

const SubmissionFormEnhanced = ({ onNext, onBack, campaignId, isPreview = false }: SubmissionFormEnhancedProps) => {
  const [activityName, setActivityName] = useState("");
  const [mainSns, setMainSns] = useState("");
  const [mainAccount, setMainAccount] = useState("");
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([
    { platform: "", url: "", followers: 0 }
  ]);
  const [genderRatio, setGenderRatio] = useState({ male: 50, female: 50 });
  const [portfolioFiles, setPortfolioFiles] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactMethods, setContactMethods] = useState<string[]>([]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactLineId, setContactLineId] = useState("");
  const [desiredPayment, setDesiredPayment] = useState("");
  const [fanStoryType, setFanStoryType] = useState("");
  const [productionDays, setProductionDays] = useState("");
  const [bestPostingTime, setBestPostingTime] = useState("");
  const [secondaryUsageFee, setSecondaryUsageFee] = useState("");
  const [secondaryUsageYears, setSecondaryUsageYears] = useState("1");
  const [invoiceRegistration, setInvoiceRegistration] = useState("");
  const [memo, setMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [insightScreenshot, setInsightScreenshot] = useState<string[]>([]);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const { toast } = useToast();

  // File upload hooks
  const portfolioUpload = useFileUpload({
    folder: 'submissions/portfolio',
    allowedTypes: ['image/*', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    maxSizeMB: 20,
  });
  const insightUpload = useFileUpload({
    folder: 'submissions/insights',
    allowedTypes: ['image/*'],
    maxSizeMB: 10,
  });

  const handlePortfolioUpload = async (files: FileList) => {
    const urls = await portfolioUpload.uploadFiles(files);
    setPortfolioFiles(prev => [...prev, ...urls]);
  };

  const handlePortfolioRemove = (index: number) => {
    setPortfolioFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleInsightUpload = async (files: FileList) => {
    const urls = await insightUpload.uploadFiles(files);
    setInsightScreenshot(prev => [...prev, ...urls]);
  };

  const handleInsightRemove = (index: number) => {
    setInsightScreenshot(prev => prev.filter((_, i) => i !== index));
  };

  const validateSocialAccount = (platform: string, value: string): string | null => {
    if (!platform || !value.trim()) return null;
    
    if (HANDLE_PLATFORMS.includes(platform)) {
      if (!validateHandle(value)) {
        return `【入力形式エラー】${platform}は「@username」の形式で入力してください。\n\n✅ 正しい例: @your_username\n❌ 間違い例: your_username, https://...\n\n必ず半角の「@」から始めてください。`;
      }
    }
    
    if (URL_PLATFORMS.includes(platform)) {
      if (!validateYouTubeUrl(value)) {
        return `【入力形式エラー】YouTubeはチャンネルURLを入力してください。\n\n✅ 正しい例:\n・https://www.youtube.com/@channelname\n・https://www.youtube.com/channel/UCxxxxxxx\n\n❌ 間違い例:\n・@channelname（URLではない）\n・https://youtube.com/watch?v=...（動画URL）`;
      }
    }
    
    return null;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!activityName.trim()) {
      newErrors.activityName = "活動名は必須です";
    }

    if (!mainSns) {
      newErrors.mainSns = "メインSNSは必須です";
    }

    if (!mainAccount.trim()) {
      newErrors.mainAccount = "メインアカウントは必須です";
    } else {
      const mainAccountError = validateSocialAccount(mainSns, mainAccount);
      if (mainAccountError) {
        newErrors.mainAccount = mainAccountError;
      }
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "電話番号は必須です";
    } else if (!validatePhoneNumber(phoneNumber)) {
      newErrors.phoneNumber = `【入力形式エラー】電話番号はハイフン（-）付きで入力してください。\n\n✅ 正しい例:\n・090-1234-5678（携帯電話）\n・03-1234-5678（固定電話）\n・0120-123-456（フリーダイヤル）\n\n❌ 間違い例:\n・09012345678（ハイフンなし）\n・090 1234 5678（スペース区切り）`;
    }

    if (contactMethods.length === 0) {
      newErrors.contactMethods = "希望の連絡手段を選択してください";
    }

    if (contactMethods.includes('email') && !contactEmail.trim()) {
      newErrors.contactEmail = "メールを選択した場合はメールアドレスが必要です";
    }

    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      newErrors.contactEmailFormat = "有効なメールアドレスを入力してください";
    }

    if (genderRatio.male + genderRatio.female !== 100) {
      newErrors.genderRatio = "男女比の合計は100%である必要があります";
    }

    if (!desiredPayment.trim()) {
      newErrors.desiredPayment = "ご希望の報酬金額は必須です";
    }

    if (!privacyAgreed) {
      newErrors.privacyAgreed = "プライバシーポリシーに同意してください";
    }

    // 活動SNSアカウントのバリデーション
    socialAccounts.forEach((account, index) => {
      if (account.platform && account.url) {
        const accountError = validateSocialAccount(account.platform, account.url);
        if (accountError) {
          newErrors[`socialAccount_${index}`] = accountError;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPaymentAmount = (value: string) => {
    const number = value.replace(/[^\d]/g, '');
    if (number) {
      return `¥${parseInt(number).toLocaleString()}`;
    }
    return value;
  };

  const handlePhoneChange = (value: string) => {
    // 数字とハイフンのみ許可
    const cleaned = value.replace(/[^\d-]/g, '');
    const formatted = formatPhoneNumber(cleaned);
    setPhoneNumber(formatted);
    if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: '' }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "入力エラー",
        description: "入力内容を確認してください。エラー箇所を赤枠で表示しています。",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // SNSアカウント情報をプラットフォームごとに整理
      const filteredAccounts = socialAccounts.filter(acc => acc.platform && acc.url);
      
      // メインアカウントを該当プラットフォームに追加
      const getAccountData = (platform: string) => {
        const existingAccount = filteredAccounts.find(acc => acc.platform === platform);
        if (existingAccount) {
          return { url: existingAccount.url, followers: existingAccount.followers };
        }
        // メインアカウントが該当プラットフォームの場合
        if (mainSns === platform && mainAccount) {
          return { url: mainAccount, followers: 0 };
        }
        return null;
      };

      const instagramData = getAccountData('Instagram');
      const youtubeData = getAccountData('YouTube');
      const tiktokData = getAccountData('TikTok');
      const redData = getAccountData('RED');
      
      // X とその他プラットフォーム
      const xAccount = filteredAccounts.find(acc => acc.platform === 'X');
      const otherAccounts = filteredAccounts.filter(acc => 
        !['Instagram', 'YouTube', 'TikTok', 'RED', 'X'].includes(acc.platform)
      );
      
      // メインアカウントがXの場合
      let xData = xAccount ? { platform: 'X', url: xAccount.url, followers: xAccount.followers } : null;
      if (!xData && mainSns === 'X' && mainAccount) {
        xData = { platform: 'X', url: mainAccount, followers: 0 };
      }
      
      // メインアカウントがその他の場合
      let otherData = [...otherAccounts];
      if (mainSns === 'その他' && mainAccount) {
        otherData.push({ platform: 'その他', url: mainAccount, followers: 0 });
      }

      const submission = {
        campaign_id: campaignId,
        influencer_name: activityName.trim(),
        email: contactEmail || 'no-email@example.com',
        phone: phoneNumber.trim() || null,
        line_id: contactLineId.trim() || null,
        preferred_contact: contactMethods[0] || 'email',
        main_sns: mainSns || null,
        main_account: mainAccount || null,
        instagram: instagramData ? { url: instagramData.url, followers: instagramData.followers } : null,
        youtube: youtubeData ? { url: youtubeData.url, followers: youtubeData.followers } : null,
        tiktok: tiktokData ? { url: tiktokData.url, followers: tiktokData.followers } : null,
        red: redData ? { url: redData.url, followers: redData.followers } : null,
        other_sns: [...(xData ? [xData] : []), ...otherData].length > 0 
          ? [...(xData ? [xData] : []), ...otherData].map(d => ({ platform: d.platform, url: d.url }))
          : [],
        portfolio_files: portfolioFiles.length > 0 ? portfolioFiles : [],
        insight_screenshots: insightScreenshot.length > 0 ? insightScreenshot : [],
        desired_fee: desiredPayment ? formatPaymentAmount(desiredPayment) : null,
        notes: memo.trim() || null,
        status: 'pending',
      };

      // プレビューモードの場合はDB保存をスキップ
      if (isPreview) {
        toast({
          title: "プレビューモード",
          description: "プレビューのため、データは保存されません",
        });
        onNext();
        return;
      }

      await submissionApi.create(submission);
      
      toast({
        title: "送信完了",
        description: "ご応募ありがとうございました",
      });

      onNext();
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "送信エラー",
        description: "送信に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSocialAccount = () => {
    setSocialAccounts([...socialAccounts, { platform: "", url: "", followers: 0 }]);
  };

  const removeSocialAccount = (index: number) => {
    setSocialAccounts(socialAccounts.filter((_, i) => i !== index));
    // エラーもクリア
    if (errors[`socialAccount_${index}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`socialAccount_${index}`];
        return newErrors;
      });
    }
  };

  const updateSocialAccount = (index: number, field: keyof SocialAccount, value: any) => {
    const updated = [...socialAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setSocialAccounts(updated);
    // エラーをクリア
    if (errors[`socialAccount_${index}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`socialAccount_${index}`];
        return newErrors;
      });
    }
  };

  const fetchMetrics = async (index: number) => {
    const account = socialAccounts[index];
    if (!account.platform || !account.url) {
      toast({
        title: "入力不足",
        description: "プラットフォームとURLを入力してください",
        variant: "destructive",
      });
      return;
    }

    updateSocialAccount(index, 'isLoading', true);

    try {
      let result;
      switch (account.platform.toLowerCase()) {
        case 'youtube':
          result = await fetchYouTubeSubs(account.url);
          break;
        case 'instagram':
          result = await fetchInstagramFollowers(account.url);
          break;
        case 'tiktok':
          result = await fetchTikTokFollowers(account.url);
          break;
        case 'x':
        case 'twitter':
          result = await fetchXFollowers(account.url);
          break;
        default:
          throw new Error('サポートされていないプラットフォームです');
      }

      updateSocialAccount(index, 'followers', result.count);
      updateSocialAccount(index, 'fetchedAt', result.fetchedAt);
      
      toast({
        title: "取得成功",
        description: `フォロワー数を取得しました: ${result.count.toLocaleString()}人`,
      });
    } catch (error) {
      toast({
        title: "自動取得に失敗",
        description: error instanceof Error ? error.message : "手入力またはスクリーンショットをご利用ください",
        variant: "destructive",
      });
    } finally {
      updateSocialAccount(index, 'isLoading', false);
    }
  };

  const getAutoFetchButton = (platform: string, index: number, isLoading: boolean) => {
    const isXPlatform = platform.toLowerCase() === 'x' || platform.toLowerCase() === 'twitter';
    
    if (isXPlatform) {
      return (
        <Button
          variant="outline"
          size="sm"
          disabled
          className="opacity-50 cursor-not-allowed"
          title="有料API契約が必要です"
        >
          <AlertTriangle className="w-4 h-4 mr-1" />
          自動取得
        </Button>
      );
    }

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => fetchMetrics(index)}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-1" />
        ) : (
          <Download className="w-4 h-4 mr-1" />
        )}
        自動取得
      </Button>
    );
  };

  const handleContactMethodChange = (method: string) => {
    setContactMethods([method]);
    // Clear related fields when changing method
    if (method !== 'email') {
      setContactEmail('');
    }
    if (method !== 'line') {
      setContactLineId('');
    }
    if (errors.contactMethods) {
      setErrors(prev => ({ ...prev, contactMethods: '' }));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            詳細情報の入力
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="activity-name" className="text-sm font-medium">
                活動名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="activity-name"
                value={activityName}
                onChange={(e) => {
                  setActivityName(e.target.value);
                  if (errors.activityName) setErrors(prev => ({ ...prev, activityName: '' }));
                }}
                placeholder="例: 美容系インフルエンサー太郎"
                className={errors.activityName ? "border-destructive" : ""}
              />
              {errors.activityName && (
                <p className="text-xs text-destructive">{errors.activityName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="main-sns" className="text-sm font-medium">
                メインSNS <span className="text-destructive">*</span>
              </Label>
              <Select
                value={mainSns}
                onValueChange={(value) => {
                  setMainSns(value);
                  setMainAccount(""); // プラットフォーム変更時にアカウント入力をリセット
                  if (errors.mainSns) setErrors(prev => ({ ...prev, mainSns: '' }));
                  if (errors.mainAccount) setErrors(prev => ({ ...prev, mainAccount: '' }));
                }}
              >
                <SelectTrigger className={errors.mainSns ? "border-destructive" : ""}>
                  <SelectValue placeholder="メインのSNSを選択" />
                </SelectTrigger>
                <SelectContent>
                  {platformOptions.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      <div className="flex items-center space-x-2">
                        <SocialIcon platform={platform.value} className="w-4 h-4" />
                        <span>{platform.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.mainSns && (
                <p className="text-xs text-destructive">{errors.mainSns}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="main-account" className="text-sm font-medium">
              メインアカウント <span className="text-destructive">*</span>
            </Label>
            {mainSns && mainSns !== 'RED' && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-primary/10 border border-primary/20 mb-2">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm text-primary">
                  {HANDLE_PLATFORMS.includes(mainSns) && (
                    <div>
                      <p className="font-semibold">📝 入力形式: @username</p>
                      <p className="mt-1">必ず半角の「@」から始めて、ユーザー名を入力してください。</p>
                      <p className="text-xs mt-1 opacity-80">例: @your_username</p>
                    </div>
                  )}
                  {URL_PLATFORMS.includes(mainSns) && (
                    <div>
                      <p className="font-semibold">📝 入力形式: YouTubeチャンネルURL</p>
                      <p className="mt-1">YouTubeチャンネルのURLを完全な形で入力してください。</p>
                      <p className="text-xs mt-1 opacity-80">例: https://www.youtube.com/@channelname</p>
                    </div>
                  )}
                  {mainSns === 'その他' && (
                    <div>
                      <p className="font-semibold">📝 入力形式: アカウント名(プラットフォーム)</p>
                      <p className="mt-1">アカウント名と使用プラットフォーム名を括弧書きで入力してください。</p>
                      <p className="text-xs mt-1 opacity-80">例: tanaka_taro(Threads)、yamada123(Weibo)</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <Input
              id="main-account"
              value={mainAccount}
              onChange={(e) => {
                setMainAccount(e.target.value);
                if (errors.mainAccount) setErrors(prev => ({ ...prev, mainAccount: '' }));
              }}
              placeholder={getInputPlaceholder(mainSns)}
              className={errors.mainAccount ? "border-destructive" : ""}
            />
            {errors.mainAccount && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30">
                <p className="text-sm text-destructive whitespace-pre-line">{errors.mainAccount}</p>
              </div>
            )}
          </div>

          {/* ポートフォリオ */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              ポートフォリオがあれば添付ください
            </Label>
            <FileUpload
              onFilesSelected={handlePortfolioUpload}
              onRemove={handlePortfolioRemove}
              files={portfolioFiles}
              accept="image/*,application/pdf,.docx,.pptx"
              isUploading={portfolioUpload.isUploading}
              label="ファイルをドラッグ&ドロップまたはクリックして選択"
              hint="PNG, JPG, PDF, DOCX, PPTに対応（最大20MB）"
            />
          </div>

          {/* SNSアカウント */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">活動SNS</Label>

            {socialAccounts.map((account, index) => (
              <Card key={index} className={`p-4 bg-muted/30 ${errors[`socialAccount_${index}`] ? 'border-destructive' : ''}`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      アカウント {index + 1}
                    </Label>
                    {socialAccounts.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSocialAccount(index)}
                        type="button"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Select
                      value={account.platform}
                      onValueChange={(value) => {
                        const updated = [...socialAccounts];
                        updated[index] = { ...updated[index], platform: value, url: '' };
                        setSocialAccounts(updated);
                        // エラーをクリア
                        if (errors[`socialAccount_${index}`]) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors[`socialAccount_${index}`];
                            return newErrors;
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="プラットフォームを選択" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {platformOptions.map((platform) => (
                          <SelectItem key={platform.value} value={platform.value}>
                            <div className="flex items-center space-x-2">
                              <SocialIcon platform={platform.value} className="w-4 h-4" />
                              <span>{platform.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="space-y-1">
                      <Input
                        placeholder={getInputPlaceholder(account.platform)}
                        value={account.url}
                        onChange={(e) => updateSocialAccount(index, 'url', e.target.value)}
                        className={errors[`socialAccount_${index}`] ? "border-destructive" : ""}
                      />
                    </div>
                  </div>

                  {/* ヒントメッセージ - REDの場合は表示しない */}
                  {account.platform && account.platform !== 'RED' && (
                    <div className="flex items-start gap-2 p-3 rounded-md bg-primary/10 border border-primary/20">
                      <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="text-sm text-primary">
                        {HANDLE_PLATFORMS.includes(account.platform) && (
                          <div>
                            <p className="font-semibold">📝 入力形式: @username</p>
                            <p className="mt-1">必ず半角の「@」から始めて、ユーザー名を入力してください。</p>
                            <p className="text-xs mt-1 opacity-80">例: @your_username</p>
                          </div>
                        )}
                        {URL_PLATFORMS.includes(account.platform) && (
                          <div>
                            <p className="font-semibold">📝 入力形式: YouTubeチャンネルURL</p>
                            <p className="mt-1">YouTubeチャンネルのURLを完全な形で入力してください。</p>
                            <p className="text-xs mt-1 opacity-80">例: https://www.youtube.com/@channelname</p>
                          </div>
                        )}
                        {account.platform === 'その他' && (
                          <div>
                            <p className="font-semibold">📝 入力形式: アカウント名(プラットフォーム)</p>
                            <p className="mt-1">アカウント名と使用プラットフォーム名を括弧書きで入力してください。</p>
                            <p className="text-xs mt-1 opacity-80">例: tanaka_taro(Threads)、yamada123(Weibo)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* エラーメッセージ表示 */}
                  {errors[`socialAccount_${index}`] && (
                    <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30">
                      <p className="text-sm text-destructive whitespace-pre-line">{errors[`socialAccount_${index}`]}</p>
                    </div>
                  )}

                  {/* 自動取得セクション - 一時的にコメントアウト
                  {account.platform && (
                    <div className="flex items-center justify-between p-3 bg-background rounded-md border">
                      <div className="flex-1">
                        {account.platform === 'Instagram' && (
                          <p className="text-xs text-muted-foreground">
                            Business/Creator連携で自動取得可
                          </p>
                        )}
                        {account.platform === 'TikTok' && (
                          <p className="text-xs text-muted-foreground">
                            ユーザー連携で自動取得可
                          </p>
                        )}
                        {account.platform === 'YouTube' && (
                          <p className="text-xs text-muted-foreground">
                            チャンネル登録者数を自動取得
                          </p>
                        )}
                        {(account.platform === 'X' || account.platform === 'Twitter') && (
                          <p className="text-xs text-warning">
                            有料API契約がある場合のみ自動取得
                          </p>
                        )}
                        {account.fetchedAt && (
                          <p className="text-xs text-success flex items-center mt-1">
                            <Check className="w-3 h-3 mr-1" />
                            取得: {new Date(account.fetchedAt).toLocaleString('ja-JP')}
                          </p>
                        )}
                      </div>
                      {getAutoFetchButton(account.platform, index, account.isLoading || false)}
                    </div>
                  )}
                  */}
                </div>
              </Card>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={addSocialAccount}
              type="button"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-1" />
              アカウント追加
            </Button>
          </div>

          {/* インサイトスクリーンショット */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              フォロワー男女比（インサイトスクリーンショット）
            </Label>
            <FileUpload
              onFilesSelected={handleInsightUpload}
              onRemove={handleInsightRemove}
              files={insightScreenshot}
              accept="image/*"
              multiple={false}
              isUploading={insightUpload.isUploading}
              label="インサイト画面のスクリーンショットをアップロード"
              hint="PNG, JPG, JPEG対応（最大10MB）"
            />
          </div>

          {/* 連絡先情報 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone-number" className="text-sm font-medium">
                電話番号 <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-start gap-2 p-3 rounded-md bg-primary/10 border border-primary/20 mb-2">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm text-primary">
                  <p className="font-semibold">📝 入力形式: ハイフン（-）付きで入力</p>
                  <p className="mt-1">数字を入力すると自動でハイフンが追加されます。</p>
                  <p className="text-xs mt-1 opacity-80">例: 090-1234-5678</p>
                </div>
              </div>
              <Input
                id="phone-number"
                type="tel"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="090-1234-5678"
                className={errors.phoneNumber ? "border-destructive" : ""}
              />
              {errors.phoneNumber && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30">
                  <p className="text-sm text-destructive whitespace-pre-line">{errors.phoneNumber}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                希望の連絡手段 <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {contactMethodOptions.map((method) => (
                  <div key={method.value} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={method.value}
                      name="contactMethod"
                      checked={contactMethods.includes(method.value)}
                      onChange={() => handleContactMethodChange(method.value)}
                      className="h-4 w-4 text-primary"
                    />
                    <Label htmlFor={method.value} className="text-sm cursor-pointer">
                      {method.label}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.contactMethods && (
                <p className="text-xs text-destructive">{errors.contactMethods}</p>
              )}

              {/* メール選択時の入力欄 */}
              {contactMethods.includes('email') && (
                <div className="space-y-2">
                  <Label htmlFor="contact-email" className="text-sm font-medium">
                    メールアドレス <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => {
                      setContactEmail(e.target.value);
                      if (errors.contactEmail || errors.contactEmailFormat) {
                        setErrors(prev => ({ 
                          ...prev, 
                          contactEmail: '', 
                          contactEmailFormat: '' 
                        }));
                      }
                    }}
                    placeholder="example@email.com"
                    className={errors.contactEmail || errors.contactEmailFormat ? "border-destructive" : ""}
                  />
                  {(errors.contactEmail || errors.contactEmailFormat) && (
                    <p className="text-xs text-destructive">
                      {errors.contactEmail || errors.contactEmailFormat}
                    </p>
                  )}
                </div>
              )}

              {/* LINE選択時の入力欄 */}
              {contactMethods.includes('line') && (
                <div className="space-y-2">
                  <Label htmlFor="contact-line" className="text-sm font-medium">
                    LINE ID
                  </Label>
                  <Input
                    id="contact-line"
                    value={contactLineId}
                    onChange={(e) => setContactLineId(e.target.value)}
                    placeholder="@line-id"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="desired-payment" className="text-sm font-medium">
                ご希望の報酬金額（税込） <span className="text-destructive">*</span>
              </Label>
              <Input
                id="desired-payment"
                value={desiredPayment}
                onChange={(e) => {
                  setDesiredPayment(e.target.value);
                  if (errors.desiredPayment) setErrors(prev => ({ ...prev, desiredPayment: '' }));
                }}
                onBlur={(e) => setDesiredPayment(formatPaymentAmount(e.target.value))}
                placeholder="例: 50000"
                className={errors.desiredPayment ? "border-destructive" : ""}
              />
              {errors.desiredPayment && (
                <p className="text-xs text-destructive">{errors.desiredPayment}</p>
              )}
              <p className="text-xs text-muted-foreground">
                数字のみ入力してください。自動で￥マークと桁区切りが追加されます。
              </p>
            </div>
          </div>

          {/* 備考 */}
          <div className="space-y-2">
            <Label htmlFor="memo" className="text-sm font-medium">
              備考
            </Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="その他ご質問やご要望があればご記入ください"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              ※マネジメントご担当者がいる場合はご連絡先を記入ください
            </p>
          </div>
        </CardContent>
      </Card>

      {/* プライバシーポリシー同意 */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="privacy-agreed"
                checked={privacyAgreed}
                onCheckedChange={(checked) => {
                  setPrivacyAgreed(checked as boolean);
                  if (errors.privacyAgreed) setErrors(prev => ({ ...prev, privacyAgreed: '' }));
                }}
                className={errors.privacyAgreed ? "border-destructive" : ""}
              />
              <div className="space-y-1">
                <Label htmlFor="privacy-agreed" className="text-sm font-medium cursor-pointer leading-relaxed">
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-primary underline hover:text-primary/80 transition-colors"
                  >
                    プライバシーポリシー
                  </button>
                  に同意します <span className="text-destructive">*</span>
                </Label>
                {errors.privacyAgreed && (
                  <p className="text-xs text-destructive">{errors.privacyAgreed}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る
          </Button>
        )}
        
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || !privacyAgreed}
          variant="wizard"
          className="ml-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              送信中...
            </>
          ) : (
            "送信する"
          )}
        </Button>
      </div>

      {/* プライバシーポリシーモーダル */}
      <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>プライバシーポリシー</DialogTitle>
            <DialogDescription>
              以下の内容をご確認ください
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6 text-sm">
              <section className="space-y-2">
                <h3 className="font-semibold text-base">1. 個人情報の取得について</h3>
                <p className="text-muted-foreground leading-relaxed">
                  当社は、本フォームを通じて以下の個人情報を取得します。
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  <li>氏名・活動名</li>
                  <li>電話番号</li>
                  <li>メールアドレス</li>
                  <li>LINE ID</li>
                  <li>SNSアカウント情報（フォロワー数等を含む）</li>
                  <li>ポートフォリオ・実績資料</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-base">2. 個人情報の利用目的</h3>
                <p className="text-muted-foreground leading-relaxed">
                  取得した個人情報は、以下の目的で利用します。
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  <li>タイアップ案件のご連絡・調整</li>
                  <li>報酬のお支払いに関する手続き</li>
                  <li>今後の案件のご案内</li>
                  <li>サービス改善のための統計分析（個人を特定しない形式）</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-base">3. 個人情報の第三者提供</h3>
                <p className="text-muted-foreground leading-relaxed">
                  当社は、以下の場合を除き、取得した個人情報を第三者に提供することはありません。
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  <li>ご本人の同意がある場合</li>
                  <li>法令に基づく場合</li>
                  <li>タイアップ案件の遂行に必要な範囲で、クライアント企業に提供する場合</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-base">4. 個人情報の管理</h3>
                <p className="text-muted-foreground leading-relaxed">
                  当社は、個人情報の漏洩、滅失又は毀損の防止その他の個人情報の安全管理のために必要かつ適切な措置を講じます。
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-base">5. 個人情報の開示・訂正・削除</h3>
                <p className="text-muted-foreground leading-relaxed">
                  ご本人から個人情報の開示、訂正、削除等のご請求があった場合は、適切に対応いたします。お問い合わせは下記連絡先までご連絡ください。
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-semibold text-base">6. お問い合わせ</h3>
                <p className="text-muted-foreground leading-relaxed">
                  個人情報の取り扱いに関するお問い合わせは、本サービス運営者までご連絡ください。
                </p>
              </section>
            </div>
          </ScrollArea>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setShowPrivacyModal(false)}>
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubmissionFormEnhanced;

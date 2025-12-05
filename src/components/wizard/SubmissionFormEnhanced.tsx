import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { submissionApi } from "@/lib/api";
import { fetchYouTubeSubs, fetchInstagramFollowers, fetchTikTokFollowers, fetchXFollowers } from "@/lib/api-stubs";
import { platformOptions, contactMethodOptions } from "@/lib/mock-data";
import { SocialIcon } from "@/components/SocialIcons";
import { Loader2, Plus, Trash2, Download, AlertTriangle, Check, Upload, ArrowLeft } from "lucide-react";

interface SubmissionFormEnhancedProps {
  onNext: () => void;
  onBack?: () => void;
  campaignId: string;
}

interface SocialAccount {
  platform: string;
  url: string;
  followers: number;
  fetchedAt?: string;
  isLoading?: boolean;
}

const SubmissionFormEnhanced = ({ onNext, onBack, campaignId }: SubmissionFormEnhancedProps) => {
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
  const [memo, setMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

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
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "電話番号は必須です";
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
      // SNSアカウント情報をプラットフォームごとに整理
      const filteredAccounts = socialAccounts.filter(acc => acc.platform && acc.url);
      const instagramAccount = filteredAccounts.find(acc => acc.platform === 'Instagram');
      const youtubeAccount = filteredAccounts.find(acc => acc.platform === 'YouTube');
      const tiktokAccount = filteredAccounts.find(acc => acc.platform === 'TikTok');
      const redAccount = filteredAccounts.find(acc => acc.platform === 'RED');
      const otherAccounts = filteredAccounts.filter(acc => 
        !['Instagram', 'YouTube', 'TikTok', 'RED'].includes(acc.platform)
      );

      const submission = {
        campaign_id: campaignId,
        influencer_name: activityName.trim(),
        phone: phoneNumber.trim(),
        contact_email: contactEmail || null,
        contact_methods: contactMethods,
        instagram: instagramAccount ? { url: instagramAccount.url, followers: instagramAccount.followers } : null,
        youtube: youtubeAccount ? { url: youtubeAccount.url, followers: youtubeAccount.followers } : null,
        tiktok: tiktokAccount ? { url: tiktokAccount.url, followers: tiktokAccount.followers } : null,
        red: redAccount ? { url: redAccount.url, followers: redAccount.followers } : null,
        other_platforms: otherAccounts.length > 0 ? JSON.stringify(otherAccounts) : null,
        portfolio_files: portfolioFiles.length > 0 ? portfolioFiles : null,
        preferred_fee: desiredPayment ? formatPaymentAmount(desiredPayment) : null,
        notes: memo.trim() || null,
        status: 'pending',
      };

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
  };

  const updateSocialAccount = (index: number, field: keyof SocialAccount, value: any) => {
    const updated = [...socialAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setSocialAccounts(updated);
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

  const handleContactMethodToggle = (method: string, checked: boolean) => {
    if (checked) {
      setContactMethods([...contactMethods, method]);
    } else {
      setContactMethods(contactMethods.filter(m => m !== method));
      // Clear related fields if method is unchecked
      if (method === 'email') {
        setContactEmail('');
      }
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
                  if (errors.mainSns) setErrors(prev => ({ ...prev, mainSns: '' }));
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
            <Input
              id="main-account"
              value={mainAccount}
              onChange={(e) => {
                setMainAccount(e.target.value);
                if (errors.mainAccount) setErrors(prev => ({ ...prev, mainAccount: '' }));
              }}
              placeholder="例: @username または https://..."
              className={errors.mainAccount ? "border-destructive" : ""}
            />
            {errors.mainAccount && (
              <p className="text-xs text-destructive">{errors.mainAccount}</p>
            )}
          </div>

          {/* ポートフォリオ */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              ポートフォリオがあれば添付ください
            </Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                PNG, JPG, PDF, DOCX, PPTに対応
              </p>
              <Button variant="outline" size="sm">
                ファイルを選択
              </Button>
            </div>
          </div>

          {/* SNSアカウント */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">活動SNS</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addSocialAccount}
                type="button"
              >
                <Plus className="w-4 h-4 mr-1" />
                アカウント追加
              </Button>
            </div>

            {socialAccounts.map((account, index) => (
              <Card key={index} className="p-4 bg-muted/30">
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Select
                      value={account.platform}
                      onValueChange={(value) => updateSocialAccount(index, 'platform', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="プラットフォーム" />
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

                    <Input
                      placeholder="URL または @handle"
                      value={account.url}
                      onChange={(e) => updateSocialAccount(index, 'url', e.target.value)}
                    />

                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        placeholder="フォロワー数"
                        value={account.followers || ''}
                        onChange={(e) => updateSocialAccount(index, 'followers', parseInt(e.target.value) || 0)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* 自動取得セクション */}
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
                </div>
              </Card>
            ))}
          </div>

          {/* インサイトスクリーンショット */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              フォロワー男女比（インサイトスクリーンショット）
            </Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                インサイト画面のスクリーンショットをアップロード
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                PNG, JPG, JPEG対応
              </p>
              <Button variant="outline" size="sm">
                ファイルを選択
              </Button>
            </div>
          </div>

          {/* 連絡先情報 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone-number" className="text-sm font-medium">
                電話番号 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone-number"
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: '' }));
                }}
                placeholder="例: 090-1234-5678"
                className={errors.phoneNumber ? "border-destructive" : ""}
              />
              {errors.phoneNumber && (
                <p className="text-xs text-destructive">{errors.phoneNumber}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                希望の連絡手段 <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {contactMethodOptions.map((method) => (
                  <div key={method.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={method.value}
                      checked={contactMethods.includes(method.value)}
                      onCheckedChange={(checked) =>
                        handleContactMethodToggle(method.value, checked === true)
                      }
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
                ご希望の報酬金額（税込）
              </Label>
              <Input
                id="desired-payment"
                value={desiredPayment}
                onChange={(e) => setDesiredPayment(e.target.value)}
                onBlur={(e) => setDesiredPayment(formatPaymentAmount(e.target.value))}
                placeholder="例: 50000"
              />
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

      <div className="flex justify-between">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る
          </Button>
        )}
        
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
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
    </div>
  );
};

export default SubmissionFormEnhanced;
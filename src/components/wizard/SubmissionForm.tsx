import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { saveSubmissionToNotion, fetchYouTubeSubs, fetchInstagramFollowers, fetchTikTokFollowers, fetchXFollowers } from "@/lib/api-stubs";
import { platformOptions } from "@/lib/mock-data";
import { SocialIcon } from "@/components/SocialIcons";
import { Loader2, Plus, Trash2, Download, AlertTriangle, Check } from "lucide-react";

interface SubmissionFormProps {
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

const SubmissionForm = ({ onNext, onBack, campaignId }: SubmissionFormProps) => {
  const [activityName, setActivityName] = useState("");
  const [mainSns, setMainSns] = useState("");
  const [mainAccount, setMainAccount] = useState("");
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([
    { platform: "", url: "", followers: 0 }
  ]);
  const [genderRatio, setGenderRatio] = useState({ male: 50, female: 50 });
  const [contactEmail, setContactEmail] = useState("");
  const [contactLineId, setContactLineId] = useState("");
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

    if (!contactEmail && !contactLineId) {
      newErrors.contact = "メールアドレスまたはLINE IDのいずれかが必要です";
    }

    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      newErrors.email = "有効なメールアドレスを入力してください";
    }

    if (genderRatio.male + genderRatio.female !== 100) {
      newErrors.genderRatio = "男女比の合計は100%である必要があります";
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
      const payload = {
        activityName: activityName.trim(),
        mainSns,
        mainAccount: mainAccount.trim(),
        socialAccounts: socialAccounts.filter(acc => acc.platform && acc.url),
        genderRatio,
        contact: {
          email: contactEmail || undefined,
          lineId: contactLineId || undefined,
        },
        memo: memo.trim() || undefined,
        campaignId,
      };

      await saveSubmissionToNotion(payload);
      
      toast({
        title: "送信完了",
        description: "ご応募ありがとうございました",
      });

      onNext();
    } catch (error) {
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

          {/* 男女比 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              フォロワー男女比 <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="male-ratio" className="text-xs text-muted-foreground">
                  男性 (%)
                </Label>
                <Input
                  id="male-ratio"
                  type="number"
                  min="0"
                  max="100"
                  value={genderRatio.male}
                  onChange={(e) => {
                    const male = parseInt(e.target.value) || 0;
                    const female = 100 - male;
                    setGenderRatio({ male, female });
                    if (errors.genderRatio) setErrors(prev => ({ ...prev, genderRatio: '' }));
                  }}
                  className={errors.genderRatio ? "border-destructive" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="female-ratio" className="text-xs text-muted-foreground">
                  女性 (%)
                </Label>
                <Input
                  id="female-ratio"
                  type="number"
                  min="0"
                  max="100"
                  value={genderRatio.female}
                  onChange={(e) => {
                    const female = parseInt(e.target.value) || 0;
                    const male = 100 - female;
                    setGenderRatio({ male, female });
                    if (errors.genderRatio) setErrors(prev => ({ ...prev, genderRatio: '' }));
                  }}
                  className={errors.genderRatio ? "border-destructive" : ""}
                />
              </div>
            </div>
            {errors.genderRatio && (
              <p className="text-xs text-destructive">{errors.genderRatio}</p>
            )}
            <p className="text-xs text-muted-foreground">
              スクリーンショットでの提出も可能です（アップロード機能は今回省略）
            </p>
          </div>

          {/* 連絡先 */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">
              連絡先 <span className="text-destructive">*（いずれか必須）</span>
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-email" className="text-xs text-muted-foreground">
                  メールアドレス
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => {
                    setContactEmail(e.target.value);
                    if (errors.contact || errors.email) {
                      setErrors(prev => ({ ...prev, contact: '', email: '' }));
                    }
                  }}
                  placeholder="example@email.com"
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-line" className="text-xs text-muted-foreground">
                  LINE ID
                </Label>
                <Input
                  id="contact-line"
                  value={contactLineId}
                  onChange={(e) => {
                    setContactLineId(e.target.value);
                    if (errors.contact) {
                      setErrors(prev => ({ ...prev, contact: '' }));
                    }
                  }}
                  placeholder="LINE ID"
                />
              </div>
            </div>

            {errors.contact && (
              <p className="text-xs text-destructive">{errors.contact}</p>
            )}
          </div>

          {/* メモ */}
          <div className="space-y-2">
            <Label htmlFor="memo" className="text-sm font-medium">
              メモ・備考（任意）
            </Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="特記事項、アピールポイントなどご自由にお書きください"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {onBack && (
          <div className="flex justify-start">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
            >
              ← 前へ
            </Button>
          </div>
        )}
        
        <div className="flex justify-end">
          <Button 
            variant="wizard"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                送信中...
              </>
            ) : (
              "応募する"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionForm;
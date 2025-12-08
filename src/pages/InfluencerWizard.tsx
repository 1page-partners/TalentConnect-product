import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import NDASectionEnhanced from "@/components/wizard/NDASectionEnhanced";
import CampaignDetailCard from "@/components/wizard/CampaignDetailCard";
import BranchButtons from "@/components/wizard/BranchButtons";
import SubmissionFormEnhanced from "@/components/wizard/SubmissionFormEnhanced";
import OptInForm from "@/components/wizard/OptInForm";
import ThanksPane from "@/components/wizard/ThanksPane";
import { campaignApi, Campaign } from "@/lib/api";
import { Loader2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// CampaignDetailCard用に変換
interface CampaignDisplay {
  id: string;
  title: string;
  slug: string;
  summary: string;
  requirements?: string;
  platforms: string[];
  deadline: string;
  restrictions?: string;
  ndaUrl?: string;
  status: 'open' | 'closed';
  contactEmail?: string;
  createdAt: string;
  clientName?: string;
  isTH?: boolean;
  isVideoProductionOnly?: boolean;
  secondaryUsage?: { hasUsage: boolean; duration?: string; purpose?: string };
  hasAdvertisementAppearance?: boolean;
  plannedPostDate?: string;
  platformDeliverables?: Record<string, string[]>;
  imageMaterials?: string[];
  attachments?: string[];
}

const InfluencerWizard = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isPreview = location.pathname.startsWith('/preview/');
  const [currentStep, setCurrentStep] = useState(1);
  const [campaign, setCampaign] = useState<CampaignDisplay | null>(null);
  const [isAccepted, setIsAccepted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!token) {
        navigate('/404');
        return;
      }

      try {
        const foundCampaign = await campaignApi.getBySlug(token);
        if (!foundCampaign) {
          navigate('/404');
          return;
        }

        // API結果をUIで使える形式に変換
        const displayCampaign: CampaignDisplay = {
          id: foundCampaign.id,
          title: foundCampaign.title,
          slug: foundCampaign.slug,
          summary: foundCampaign.description || '',
          requirements: undefined,
          platforms: foundCampaign.target_platforms || [],
          deadline: foundCampaign.posting_date || '',
          restrictions: foundCampaign.ng_items || undefined,
          status: (foundCampaign.status as 'open' | 'closed') || 'open',
          createdAt: foundCampaign.created_at,
          clientName: foundCampaign.client_name || undefined,
          isTH: false,
          isVideoProductionOnly: foundCampaign.video_production_only || false,
          secondaryUsage: foundCampaign.secondary_usage 
            ? { hasUsage: true, duration: foundCampaign.secondary_usage_period || undefined, purpose: foundCampaign.secondary_usage_purpose || undefined }
            : { hasUsage: false },
          hasAdvertisementAppearance: foundCampaign.ad_appearance || false,
          plannedPostDate: foundCampaign.posting_date || undefined,
          platformDeliverables: foundCampaign.deliverables as Record<string, string[]>,
          imageMaterials: foundCampaign.image_materials || [],
          attachments: foundCampaign.attachments || [],
        };

        setCampaign(displayCampaign);
      } catch (error) {
        console.error('キャンペーン取得エラー:', error);
        navigate('/404');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [token, navigate]);

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleAccept = () => {
    setIsAccepted(true);
    setCurrentStep(3);
    window.scrollTo(0, 0);
  };

  const handleDecline = () => {
    setIsAccepted(false);
    setCurrentStep(3);
    window.scrollTo(0, 0);
  };

  const handleBackToStart = () => {
    setCurrentStep(1);
    setIsAccepted(null);
  };

  const renderStep = () => {
    if (!campaign) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <NDASectionEnhanced 
            onNext={handleNext}
            ndaUrl={campaign.ndaUrl}
          />
        );
      case 2:
        return (
          <div className="space-y-6">
            <CampaignDetailCard campaign={campaign as any} />
            <BranchButtons 
              onAccept={handleAccept}
              onDecline={handleDecline}
              onBack={handleBack}
            />
          </div>
        );
      case 3:
        if (isAccepted === true) {
          return (
            <SubmissionFormEnhanced 
              onNext={handleNext}
              onBack={handleBack}
              campaignId={campaign.id}
              isPreview={isPreview}
            />
          );
        } else if (isAccepted === false) {
          return (
            <OptInForm 
              onNext={handleNext}
              onBack={handleBack}
              campaignId={campaign.id}
              isPreview={isPreview}
            />
          );
        }
        break;
      case 4:
        return (
          <ThanksPane 
            isAccepted={isAccepted === true}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground mb-2">
                案件が見つかりません
              </div>
              <div className="text-muted-foreground">
                URLをご確認ください
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* プレビューバナー */}
      {isPreview && (
        <div className="bg-amber-500 text-white py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2">
          <Eye className="w-4 h-4" />
          プレビューモード - フォームに入力してもデータは保存されません
        </div>
      )}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* ステッパー表示 */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2">
            {Array.from({ length: 4 }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`w-8 h-0.5 ${
                      step < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-2">
            <span className="text-sm text-muted-foreground">
              ステップ {currentStep} / 4
            </span>
          </div>
        </div>
        
        {renderStep()}
      </main>
    </div>
  );
};

export default InfluencerWizard;

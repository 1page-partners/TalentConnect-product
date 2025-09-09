import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import NDASection from "@/components/wizard/NDASection";
import CampaignDetailCard from "@/components/wizard/CampaignDetailCard";
import BranchButtons from "@/components/wizard/BranchButtons";
import SubmissionForm from "@/components/wizard/SubmissionForm";
import OptInForm from "@/components/wizard/OptInForm";
import ThanksPane from "@/components/wizard/ThanksPane";
import { getCampaignByToken } from "@/lib/mock-data";
import { Campaign } from "@/lib/mock-data";

const InfluencerWizard = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isAccepted, setIsAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      navigate('/404');
      return;
    }

    const foundCampaign = getCampaignByToken(token);
    if (!foundCampaign) {
      navigate('/404');
      return;
    }

    setCampaign(foundCampaign);
  }, [token, navigate]);

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
    // 次のページへ進むときに最上部にスクロール
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    // 前のページに戻るときも最上部にスクロール
    window.scrollTo(0, 0);
  };

  const handleAccept = () => {
    setIsAccepted(true);
    setCurrentStep(3);
    // 次のページへ進むときに最上部にスクロール
    window.scrollTo(0, 0);
  };

  const handleDecline = () => {
    setIsAccepted(false);
    setCurrentStep(3);
    // 次のページへ進むときに最上部にスクロール
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
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground mb-2">
              読み込み中...
            </div>
            <div className="text-muted-foreground">
              案件情報を取得しています
            </div>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <NDASection 
            onNext={handleNext}
            ndaUrl={campaign.ndaUrl}
          />
        );
      case 2:
        return (
          <div className="space-y-6">
            <CampaignDetailCard campaign={campaign} />
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
            <SubmissionForm 
              onNext={handleNext}
              onBack={handleBack}
              campaignId={campaign.id}
            />
          );
        } else if (isAccepted === false) {
          return (
            <OptInForm 
              onNext={handleNext}
              onBack={handleBack}
              campaignId={campaign.id}
            />
          );
        }
        break;
      case 4:
        return (
          <ThanksPane 
            isAccepted={isAccepted === true}
            onBackToStart={handleBackToStart}
          />
        );
      default:
        return null;
    }
  };

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
      <Header 
        showStepper={true}
        currentStep={currentStep}
        totalSteps={4}
      />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {renderStep()}
      </main>
    </div>
  );
};

export default InfluencerWizard;
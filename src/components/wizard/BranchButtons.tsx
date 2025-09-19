import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

interface BranchButtonsProps {
  onAccept: () => void;
  onDecline: () => void;
  onBack?: () => void;
}

const BranchButtons = ({ onAccept, onDecline, onBack }: BranchButtonsProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          この案件への対応可否をお選びください
        </h3>
        <p className="text-sm text-muted-foreground">
          対応可能な場合は詳細情報の入力へ、対応不可の場合は今後のご案内設定へ進みます
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          variant="success"
          size="wizard"
          onClick={onAccept}
          className="h-20 flex flex-col items-center justify-center space-y-2 text-white shadow-lg hover:scale-105 transition-all duration-300 px-4"
        >
          <CheckCircle className="w-6 h-6" />
          <span className="font-semibold">対応可能</span>
          <span className="text-xs opacity-90">詳細情報を入力</span>
        </Button>

        <Button
          variant="outline"
          size="wizard"
          onClick={onDecline}
          className="h-20 flex flex-col items-center justify-center space-y-2 border-2 hover:bg-muted/50 transition-all duration-300 px-4"
        >
          <XCircle className="w-6 h-6" />
          <span className="font-semibold">対応不可</span>
          <span className="text-xs text-muted-foreground">連絡設定のみ</span>
        </Button>
      </div>
    </div>
  );
};

export default BranchButtons;
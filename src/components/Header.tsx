import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface HeaderProps {
  showStepper?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

const Header = ({ showStepper = false, currentStep = 1, totalSteps = 4 }: HeaderProps) => {
  return (
    <header className="bg-card border-b border-border shadow-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link to="/" className="text-xl font-bold text-primary hover:text-primary/80 transition-colors">
              TalentConnect
            </Link>
          </div>
          
          {showStepper && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {currentStep} / {totalSteps}
              </span>
              <div className="flex space-x-1">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i + 1 <= currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const statusConfig = {
  active: {
    label: '募集中',
    className: 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500',
  },
  proposal: {
    label: '提案中',
    className: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500',
  },
  production: {
    label: '制作中',
    className: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500',
  },
  completed: {
    label: '終了',
    className: 'bg-slate-500 hover:bg-slate-600 text-white border-slate-500',
  },
} as const;

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    className: 'bg-muted text-muted-foreground',
  };

  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
};

interface EditableStatusBadgeProps {
  status: string;
  onStatusChange: (newStatus: string) => void;
  className?: string;
}

export const EditableStatusBadge = ({ status, onStatusChange, className }: EditableStatusBadgeProps) => {
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    className: 'bg-muted text-muted-foreground',
  };

  const handleStatusSelect = (newStatus: string) => {
    // 「終了」から他のステータスに変更しようとしている場合は警告ダイアログを表示
    if (status === 'completed' && newStatus !== 'completed') {
      setPendingStatus(newStatus);
      setShowWarningDialog(true);
    } else {
      onStatusChange(newStatus);
    }
  };

  const handleConfirmStatusChange = () => {
    if (pendingStatus) {
      onStatusChange(pendingStatus);
      setPendingStatus(null);
    }
    setShowWarningDialog(false);
  };

  const handleCancelStatusChange = () => {
    setPendingStatus(null);
    setShowWarningDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Badge className={cn(config.className, "cursor-pointer flex items-center gap-1", className)}>
            {config.label}
            <ChevronDown className="h-3 w-3" />
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {Object.entries(statusConfig).map(([key, value]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => handleStatusSelect(key)}
              className={status === key ? "bg-accent" : ""}
            >
              {value.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ステータスを変更しますか？</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                案件ステータスを「終了」から「{pendingStatus ? statusConfig[pendingStatus as keyof typeof statusConfig]?.label : ''}」に変更しようとしています。
              </p>
              <p className="text-destructive font-medium">
                ⚠️ ステータスを変更すると、募集停止が解除され、配布用URLから再び応募ができるようになります。
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelStatusChange}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStatusChange}>
              変更する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const getStatusLabel = (status: string) => {
  return statusConfig[status as keyof typeof statusConfig]?.label || status;
};

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

export const getStatusLabel = (status: string) => {
  return statusConfig[status as keyof typeof statusConfig]?.label || status;
};

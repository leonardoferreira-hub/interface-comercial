import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { StatusEmissao, STATUS_LABELS, STATUS_COLORS } from '@/types';

interface StatusBadgeProps {
  status: StatusEmissao | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = STATUS_LABELS[status as StatusEmissao] || status;
  const colorClass = STATUS_COLORS[status as StatusEmissao] || 'bg-gray-100 text-gray-800';
  
  return (
    <Badge 
      variant="secondary" 
      className={cn(colorClass, className)}
    >
      {label}
    </Badge>
  );
}

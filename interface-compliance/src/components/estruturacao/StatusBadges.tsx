import { Badge } from '@/components/ui/badge';
import { Check, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StatusOkNok, StatusBoletagem } from '@/types/dados-estruturacao';
import { STATUS_OKNOK_LABELS, STATUS_OKNOK_COLORS, STATUS_BOLETAGEM_LABELS } from '@/types/dados-estruturacao';

interface StatusBadgeOkNokProps {
  status: StatusOkNok | null | undefined;
  size?: 'sm' | 'md';
}

export function StatusBadgeOkNok({ status, size = 'md' }: StatusBadgeOkNokProps) {
  const value = status || 'pendente';
  const label = STATUS_OKNOK_LABELS[value];
  const colorClasses = STATUS_OKNOK_COLORS[value];
  
  const Icon = value === 'ok' ? Check : value === 'nok' ? X : Clock;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        colorClasses,
        size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-sm px-2 py-0.5'
      )}
    >
      <Icon className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      {label}
    </Badge>
  );
}

interface StatusBadgeBoletagemProps {
  status: StatusBoletagem | null | undefined;
  size?: 'sm' | 'md';
}

export function StatusBadgeBoletagem({ status, size = 'md' }: StatusBadgeBoletagemProps) {
  const value = status || 'pendente';
  const label = STATUS_BOLETAGEM_LABELS[value];
  
  const getColorClasses = () => {
    switch (value) {
      case 'sim': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'nao': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'na': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        getColorClasses(),
        size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-sm px-2 py-0.5'
      )}
    >
      {label}
    </Badge>
  );
}

interface MajoracaoBadgeProps {
  volume: number;
}

export function MajoracaoBadge({ volume }: MajoracaoBadgeProps) {
  const isMajorado = volume > 50_000_000;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        isMajorado 
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      )}
    >
      {isMajorado ? 'SIM' : 'NÃO'}
    </Badge>
  );
}

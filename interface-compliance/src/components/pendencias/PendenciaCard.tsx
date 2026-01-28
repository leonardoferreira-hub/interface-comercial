import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pendencia, PRIORIDADE_LABELS, PRIORIDADE_COLORS, CATEGORIA_LABELS } from '@/types';
import { formatDate, isOverdue, getDaysUntil } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { Calendar, User } from 'lucide-react';

interface PendenciaCardProps {
  pendencia: Pendencia;
  onClick?: () => void;
  isDragging?: boolean;
}

export function PendenciaCard({ pendencia, onClick, isDragging }: PendenciaCardProps) {
  const overdue = isOverdue(pendencia.data_limite);
  const daysUntil = getDaysUntil(pendencia.data_limite);

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isDragging && 'opacity-50 rotate-2',
        overdue && 'border-red-300 bg-red-50/50'
      )}
      onClick={onClick}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            {pendencia.emissao_codigo}
          </span>
          <Badge className={cn('text-xs', PRIORIDADE_COLORS[pendencia.prioridade])}>
            {PRIORIDADE_LABELS[pendencia.prioridade]}
          </Badge>
        </div>
        <h4 className="font-medium text-sm leading-tight">{pendencia.titulo}</h4>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        <Badge variant="outline" className="text-xs">
          {CATEGORIA_LABELS[pendencia.categoria]}
        </Badge>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {pendencia.responsavel && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {pendencia.responsavel}
            </div>
          )}
          {pendencia.data_limite && (
            <div className={cn('flex items-center gap-1', overdue && 'text-red-600 font-medium')}>
              <Calendar className="h-3 w-3" />
              {formatDate(pendencia.data_limite)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

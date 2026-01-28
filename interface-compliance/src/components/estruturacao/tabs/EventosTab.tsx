import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Plus, 
  Loader2,
  Check,
  Clock,
  AlertCircle,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEventosChave, useUpdateEventoStatus, useDeleteEventoChave } from '@/hooks/useEventosChave';
import { 
  STATUS_EVENTO_LABELS, 
  STATUS_EVENTO_COLORS,
  type StatusEvento 
} from '@/types/estruturacao';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EventosTabProps {
  idEmissao: string;
}

export function EventosTab({ idEmissao }: EventosTabProps) {
  const { data: eventos, isLoading } = useEventosChave(idEmissao);
  const updateStatus = useUpdateEventoStatus();
  const deleteEvento = useDeleteEventoChave();

  const handleStatusChange = (id: string, status: StatusEvento) => {
    updateStatus.mutate(
      { 
        id, 
        status, 
        idEmissao,
        dataRealizada: status === 'concluido' ? new Date().toISOString() : undefined
      },
      {
        onSuccess: () => toast.success('Status atualizado'),
        onError: () => toast.error('Erro ao atualizar status'),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteEvento.mutate(
      { id, idEmissao },
      {
        onSuccess: () => toast.success('Evento removido'),
        onError: () => toast.error('Erro ao remover evento'),
      }
    );
  };

  const getStatusIcon = (status: StatusEvento) => {
    switch (status) {
      case 'concluido':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'em_andamento':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'atrasado':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Estatísticas
  const concluidos = eventos?.filter(e => e.status === 'concluido').length || 0;
  const total = eventos?.length || 0;
  const progresso = total > 0 ? (concluidos / total) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Cronograma de Eventos</h3>
          <p className="text-sm text-muted-foreground">
            {concluidos} de {total} concluído(s) ({progresso.toFixed(0)}%)
          </p>
        </div>
        <Button size="sm" disabled>
          <Plus className="h-4 w-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      {/* Barra de Progresso */}
      {total > 0 && (
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${progresso}%` }}
          />
        </div>
      )}

      {!eventos || eventos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum evento cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {eventos.map((evento, index) => (
            <Card key={evento.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      evento.status === 'concluido' ? 'bg-green-100' : 
                      evento.status === 'atrasado' ? 'bg-red-100' : 'bg-muted'
                    )}>
                      {getStatusIcon(evento.status)}
                    </div>
                    {index < eventos.length - 1 && (
                      <div className="w-0.5 h-full bg-border mt-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{evento.nome_evento}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {evento.data_prevista && (
                            <span className="text-sm text-muted-foreground">
                              Previsto: {new Date(evento.data_prevista).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          {evento.data_realizada && (
                            <span className="text-sm text-green-600">
                              • Realizado: {new Date(evento.data_realizada).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                        {evento.responsavel && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Responsável: {evento.responsavel}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={cn(STATUS_EVENTO_COLORS[evento.status])}
                        >
                          {STATUS_EVENTO_LABELS[evento.status]}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStatusChange(evento.id, 'pendente')}>
                              Marcar como Pendente
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(evento.id, 'em_andamento')}>
                              Marcar como Em Andamento
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(evento.id, 'concluido')}>
                              Marcar como Concluído
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(evento.id, 'atrasado')}>
                              Marcar como Atrasado
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(evento.id)}
                              className="text-destructive"
                            >
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

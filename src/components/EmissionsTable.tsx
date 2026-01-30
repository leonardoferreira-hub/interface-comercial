import { useEffect, useState, memo, useMemo } from 'react';
import { Eye, Edit, FileDown, MoreHorizontal, Send, Check, X, RotateCcw, Shield, ShieldCheck, ShieldAlert, Loader2, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './StatusBadge';
import { finalizarProposta, type Emissao } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedListItem } from '@/components/ui/animations';
import { TableSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { motion } from 'framer-motion';

interface EmissionsTableProps {
  emissoes: Emissao[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onExport: (id: string) => void;
  onStatusChange?: () => void;
  isLoading?: boolean;
}

// Cores acessíveis com contraste WCAG AA
const categoryColors: Record<string, string> = {
  DEB: 'bg-blue-100 text-blue-800 border-blue-300',
  CRA: 'bg-green-100 text-green-800 border-green-300',
  CRI: 'bg-purple-100 text-purple-800 border-purple-300',
  NC: 'bg-amber-100 text-amber-800 border-amber-300',
  CR: 'bg-rose-100 text-rose-800 border-rose-300',
};

// Componente para mostrar status do compliance com acessibilidade - memoizado
const ComplianceBadge = memo(function ComplianceBadge({ emissaoId }: { emissaoId: string }) {
  const [status, setStatus] = useState<string>('loading');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data, error } = await supabase.rpc('get_status_compliance_emissao', {
          p_emissao_id: emissaoId
        });
        
        if (error) throw error;
        setStatus(data?.status || 'pendente');
      } catch (err) {
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    // Atualiza a cada 10 segundos
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [emissaoId]);

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  // Status config com contraste acessível
  const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    aprovado: {
      label: 'Aprovado',
      className: 'bg-green-100 text-green-800 border-green-300 font-medium',
      icon: <ShieldCheck className="h-3 w-3 mr-1" />
    },
    reprovado: {
      label: 'Reprovado',
      className: 'bg-red-100 text-red-800 border-red-300 font-medium',
      icon: <ShieldAlert className="h-3 w-3 mr-1" />
    },
    em_analise: {
      label: 'Em Análise',
      className: 'bg-blue-100 text-blue-800 border-blue-300 font-medium',
      icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" />
    },
    pendente: {
      label: 'Aguardando',
      className: 'bg-amber-100 text-amber-800 border-amber-300 font-medium',
      icon: <Shield className="h-3 w-3 mr-1" />
    },
    error: {
      label: 'Erro',
      className: 'bg-gray-100 text-gray-800 border-gray-300 font-medium',
      icon: <Shield className="h-3 w-3 mr-1" />
    }
  };

  const config = statusConfig[status] || statusConfig.pendente;

  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
});

export const EmissionsTable = memo(function EmissionsTable({ emissoes, onView, onEdit, onExport, onStatusChange, isLoading }: EmissionsTableProps) {
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [complianceStatus, setComplianceStatus] = useState<Record<string, any>>({});

  // Buscar status do compliance para todas as emissões
  useEffect(() => {
    const fetchAllComplianceStatus = async () => {
      const statuses: Record<string, any> = {};
      
      for (const emissao of emissoes) {
        try {
          const { data, error } = await supabase.rpc('get_status_compliance_emissao', {
            p_emissao_id: emissao.id
          });
          if (!error && data) {
            statuses[emissao.id] = data;
          }
        } catch (err) {
          console.error('Erro ao buscar status do compliance:', err);
        }
      }
      
      setComplianceStatus(statuses);
    };

    if (emissoes.length > 0) {
      fetchAllComplianceStatus();
    }
  }, [emissoes]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleStatusChange = async (emissaoId: string, nextStatus: string) => {
    setUpdatingId(emissaoId);
    try {
      await finalizarProposta(emissaoId, nextStatus);
      toast({
        title: 'Status atualizado!',
        description: `Proposta atualizada para "${nextStatus}".`,
      });
      onStatusChange?.();
    } catch (error) {
      toast({
        title: 'Erro ao atualizar status',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Verificar se pode aceitar proposta (compliance aprovado)
  const podeAceitar = (emissaoId: string) => {
    const status = complianceStatus[emissaoId];
    return status?.aprovado === true;
  };

  // Gerar ações disponíveis
  const getStatusActions = (emissao: Emissao) => {
    const baseActions: Record<string, { label: string; nextStatus: string; icon: React.ReactNode; disabled?: boolean; disabledReason?: string }[]> = {
      rascunho: [
        { label: 'Marcar como Enviada', nextStatus: 'enviada', icon: <Send className="h-4 w-4 mr-2" /> },
      ],
      enviada: [
        { 
          label: 'Marcar como Aceita', 
          nextStatus: 'aceita', 
          icon: <Check className="h-4 w-4 mr-2" />,
          disabled: !podeAceitar(emissao.id),
          disabledReason: 'Aguardando compliance'
        },
        { label: 'Marcar como Rejeitada', nextStatus: 'rejeitada', icon: <X className="h-4 w-4 mr-2" /> },
      ],
      aceita: [],
      rejeitada: [
        { label: 'Reabrir como Rascunho', nextStatus: 'rascunho', icon: <RotateCcw className="h-4 w-4 mr-2" /> },
      ],
      em_estruturacao: [],
    };

    return baseActions[emissao.status_proposta] || [];
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl card-shadow overflow-hidden border-0">
        <TableSkeleton rows={5} columns={8} />
      </div>
    );
  }

  if (emissoes.length === 0) {
    return (
      <div className="bg-card rounded-xl card-shadow overflow-hidden border-0">
        <EmptyState
          icon={Inbox}
          title="Nenhuma emissão encontrada"
          description="Não há emissões cadastradas no sistema."
          variant="compact"
        />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl card-shadow overflow-hidden border-0">
      {/* Mobile Cards View */}
      <div className="sm:hidden p-3 space-y-3">
        {emissoes.map((emissao, index) => {
          const actions = getStatusActions(emissao);
          const isUpdating = updatingId === emissao.id;
          const complianceAprovado = podeAceitar(emissao.id);

          return (
            <AnimatedListItem key={emissao.id} index={index}>
              <div 
                className="rounded-xl border border-border/50 bg-card p-4 shadow-sm cursor-pointer hover:shadow-md hover:border-border transition-all"
                onClick={() => onView(emissao.id)}
              >
                {/* Header: Empresa + Valor */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {emissao.demandante_proposta || 'Sem demandante'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {emissao.numero_emissao}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-foreground tabular-nums">
                      {formatCurrency(emissao.volume)}
                    </p>
                  </div>
                </div>

                {/* Tags: Categoria + Status */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${categoryColors[emissao.categoria] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                    {emissao.categoria}
                  </span>
                  <StatusBadge status={emissao.status_proposta} />
                </div>

                {/* Footer: Compliance + Data + Ações */}
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <ComplianceBadge emissaoId={emissao.id} />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(emissao.data_criacao)}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" onClick={() => onView(emissao.id)} className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Visualizar">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(emissao.id)} className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Editar">
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" disabled={isUpdating}>
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onExport(emissao.id)}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Exportar PDF
                      </DropdownMenuItem>
                      {actions.length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          {actions.map((action) => (
                            <DropdownMenuItem
                              key={action.nextStatus}
                              onClick={() => !action.disabled && handleStatusChange(emissao.id, action.nextStatus)}
                              disabled={action.disabled}
                              className={action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                              {action.icon}
                              {action.label}
                              {action.disabled && action.disabledReason && (
                                <span className="ml-auto text-xs text-amber-600">({action.disabledReason})</span>
                              )}
                            </DropdownMenuItem>
                          ))}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </AnimatedListItem>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold whitespace-nowrap">Número</TableHead>
              <TableHead className="font-semibold whitespace-nowrap">Demandante</TableHead>
              <TableHead className="font-semibold whitespace-nowrap">Categoria</TableHead>
              <TableHead className="font-semibold text-right whitespace-nowrap">Volume</TableHead>
              <TableHead className="font-semibold whitespace-nowrap">Status</TableHead>
              <TableHead className="font-semibold whitespace-nowrap">Compliance</TableHead>
              <TableHead className="font-semibold whitespace-nowrap">Data</TableHead>
              <TableHead className="font-semibold text-right whitespace-nowrap">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emissoes.map((emissao, index) => {
              const actions = getStatusActions(emissao);
              const isUpdating = updatingId === emissao.id;
              const complianceAprovado = podeAceitar(emissao.id);

              return (
                  <TableRow
                    key={emissao.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors group"
                    onClick={() => onView(emissao.id)}
                  >
                    <TableCell className="font-medium text-primary whitespace-nowrap">{emissao.numero_emissao}</TableCell>
                    <TableCell className="whitespace-nowrap">{emissao.demandante_proposta}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${categoryColors[emissao.categoria] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                        {emissao.categoria}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">{formatCurrency(emissao.volume)}</TableCell>
                    <TableCell>
                      <StatusBadge status={emissao.status_proposta} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <ComplianceBadge emissaoId={emissao.id} />
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(emissao.data_criacao)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => onView(emissao.id)} className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" title="Visualizar">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(emissao.id)} className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isUpdating}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => onExport(emissao.id)}>
                              <FileDown className="h-4 w-4 mr-2" />
                              Exportar PDF
                            </DropdownMenuItem>
                            {actions.length > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                {actions.map((action) => (
                                  <DropdownMenuItem
                                    key={action.nextStatus}
                                    onClick={() => !action.disabled && handleStatusChange(emissao.id, action.nextStatus)}
                                    disabled={action.disabled}
                                    className={action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                  >
                                    {action.icon}
                                    {action.label}
                                    {action.disabled && action.disabledReason && (
                                      <span className="ml-auto text-xs text-amber-600">({action.disabledReason})</span>
                                    )}
                                  </DropdownMenuItem>
                                ))}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

import { useEffect, useState } from 'react';
import { Eye, Edit, FileDown, MoreHorizontal, Send, Check, X, RotateCcw, Shield, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './StatusBadge';
import { finalizarProposta, type Emissao } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EmissionsTableProps {
  emissoes: Emissao[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onExport: (id: string) => void;
  onStatusChange?: () => void;
}

const categoryColors: Record<string, string> = {
  DEB: 'bg-blue-100 text-blue-700',
  CRA: 'bg-green-100 text-green-700',
  CRI: 'bg-purple-100 text-purple-700',
  NC: 'bg-amber-100 text-amber-700',
  CR: 'bg-rose-100 text-rose-700',
};

// Componente para mostrar status do compliance
function ComplianceBadge({ emissaoId }: { emissaoId: string }) {
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

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    aprovado: {
      label: 'Aprovado',
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: <ShieldCheck className="h-3 w-3 mr-1" />
    },
    reprovado: {
      label: 'Reprovado',
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: <ShieldAlert className="h-3 w-3 mr-1" />
    },
    em_analise: {
      label: 'Em Análise',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" />
    },
    pendente: {
      label: 'Aguardando',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: <Shield className="h-3 w-3 mr-1" />
    },
    error: {
      label: 'Erro',
      color: 'bg-gray-100 text-gray-700 border-gray-200',
      icon: <Shield className="h-3 w-3 mr-1" />
    }
  };

  const config = statusConfig[status] || statusConfig.pendente;

  return (
    <Badge variant="outline" className={`text-xs ${config.color}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

export function EmissionsTable({ emissoes, onView, onEdit, onExport, onStatusChange }: EmissionsTableProps) {
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
    const baseActions: Record<string, { label: string; nextStatus: string; icon: React.ReactNode; disabled?: boolean }[]> = {
      rascunho: [
        { label: 'Marcar como Enviada', nextStatus: 'enviada', icon: <Send className="h-4 w-4 mr-2" /> },
      ],
      enviada: [
        { 
          label: 'Marcar como Aceita', 
          nextStatus: 'aceita', 
          icon: <Check className="h-4 w-4 mr-2" />,
          disabled: !podeAceitar(emissao.id)
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

  return (
    <div className="bg-card rounded-xl card-shadow overflow-hidden border-0">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">Número</TableHead>
            <TableHead className="font-semibold">Demandante</TableHead>
            <TableHead className="font-semibold">Categoria</TableHead>
            <TableHead className="font-semibold text-right">Volume</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Compliance</TableHead>
            <TableHead className="font-semibold">Data</TableHead>
            <TableHead className="font-semibold text-right">Ações</TableHead>
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
                className="animate-fade-in cursor-pointer hover:bg-muted/30 transition-colors"
                style={{ animationDelay: `${index * 30}ms` }}
                onClick={() => onView(emissao.id)}
              >
                <TableCell className="font-medium text-primary">{emissao.numero_emissao}</TableCell>
                <TableCell>{emissao.demandante_proposta}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-md text-xs font-semibold ${categoryColors[emissao.categoria] || 'bg-gray-100 text-gray-700'}`}>
                    {emissao.categoria}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(emissao.volume)}</TableCell>
                <TableCell>
                  <StatusBadge status={emissao.status_proposta} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <ComplianceBadge emissaoId={emissao.id} />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(emissao.data_criacao)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={() => onView(emissao.id)} className="h-8 w-8" title="Visualizar">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(emissao.id)} className="h-8 w-8" title="Editar">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isUpdating}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
                                {action.disabled && action.nextStatus === 'aceita' && (
                                  <span className="ml-2 text-xs text-amber-600">(Aguardando compliance)</span>
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
  );
}

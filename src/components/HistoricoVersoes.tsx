import { useEffect, useState } from 'react';
import { Clock, FileEdit, DollarSign, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { buscarHistorico } from '@/lib/supabase';

interface HistoricoItem {
  id: string;
  criado_em: string;
  tipo_alteracao: string;
  status_anterior: string | null;
  status_novo: string;
  motivo: string | null;
  versao: number | null;
  dados_anteriores: Record<string, any> | null;
  dados_alterados: Record<string, any> | null;
}

interface HistoricoVersoesProps {
  emissaoId: string;
  versaoAtual?: number;
  onRefresh?: () => void;
}

const tipoAlteracaoConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  status: {
    icon: <RefreshCw className="h-4 w-4" />,
    label: 'Status alterado',
    color: 'bg-blue-500',
  },
  dados: {
    icon: <FileEdit className="h-4 w-4" />,
    label: 'Dados atualizados',
    color: 'bg-green-500',
  },
  custos: {
    icon: <DollarSign className="h-4 w-4" />,
    label: 'Custos atualizados',
    color: 'bg-yellow-500',
  },
  criacao: {
    icon: <Clock className="h-4 w-4" />,
    label: 'Emissão criada',
    color: 'bg-primary',
  },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatFieldName = (key: string): string => {
  const fieldNames: Record<string, string> = {
    demandante_proposta: 'Demandante',
    empresa_destinataria: 'Empresa Destinatária',
    empresa_cnpj: 'CNPJ',
    empresa_razao_social: 'Razão Social',
    empresa_endereco: 'Endereço',
    contato_nome: 'Nome do Contato',
    contato_email: 'E-mail do Contato',
    volume: 'Volume',
    status: 'Status',
    oferta: 'Oferta',
    categoria: 'Categoria',
    veiculo: 'Veículo',
    lastro: 'Lastro',
    nome_operacao: 'Nome da Operação',
  };
  return fieldNames[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

export function HistoricoVersoes({ emissaoId, versaoAtual = 1, onRefresh }: HistoricoVersoesProps) {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadHistorico();
  }, [emissaoId]);

  const loadHistorico = async () => {
    try {
      const result = await buscarHistorico(emissaoId);
      if (result.success && result.data) {
        setHistorico(result.data.historico || []);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getChangedFields = (item: HistoricoItem): string[] => {
    if (item.dados_alterados && typeof item.dados_alterados === 'object') {
      return Object.keys(item.dados_alterados);
    }
    return [];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-muted-foreground">Carregando histórico...</div>
      </div>
    );
  }

  if (historico.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma alteração registrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />

        {/* Items */}
        <div className="space-y-4">
          {historico.map((item, index) => {
            const config = tipoAlteracaoConfig[item.tipo_alteracao] || tipoAlteracaoConfig.dados;
            const changedFields = getChangedFields(item);
            const hasDetails =
              changedFields.length > 0 ||
              (item.dados_anteriores && Object.keys(item.dados_anteriores).length > 0);

            return (
              <div key={item.id} className="relative pl-10">
                {/* Icon */}
                <div
                  className={`absolute left-0 top-0 w-8 h-8 rounded-full ${config.color} flex items-center justify-center text-white`}
                >
                  {config.icon}
                </div>

                {/* Content */}
                <div className="bg-muted/30 rounded-lg p-3 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{config.label}</span>
                      {item.versao && (
                        <Badge variant="outline" className="text-xs">
                          v{item.versao}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(item.criado_em)}</span>
                  </div>

                  {/* Status change */}
                  {item.tipo_alteracao === 'status' && item.status_anterior && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">{item.status_anterior}</span>
                      <span className="mx-2">→</span>
                      <span className="font-medium text-foreground">{item.status_novo}</span>
                    </p>
                  )}

                  {/* Motivo */}
                  {item.motivo && <p className="text-sm text-muted-foreground mt-1">{item.motivo}</p>}

                  {/* Changed fields summary */}
                  {changedFields.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Campos alterados: {changedFields.map((f) => formatFieldName(f)).join(', ')}
                    </p>
                  )}

                  {/* Expandable details */}
                  {hasDetails && (
                    <Collapsible open={expandedItems[item.id]} onOpenChange={() => toggleExpanded(item.id)}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs">
                          {expandedItems[item.id] ? (
                            <>
                              <ChevronUp className="h-3 w-3 mr-1" />
                              Ocultar detalhes
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 mr-1" />
                              Ver detalhes
                            </>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="bg-background rounded p-3 text-xs space-y-2 border border-border">
                          {changedFields.map((field) => (
                            <div key={field} className="grid grid-cols-3 gap-2">
                              <span className="font-medium text-muted-foreground">{formatFieldName(field)}</span>
                              <span className="text-destructive/70 line-through">
                                {formatValue(item.dados_anteriores?.[field])}
                              </span>
                              <span className="text-primary font-medium">
                                {formatValue(item.dados_alterados?.[field])}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

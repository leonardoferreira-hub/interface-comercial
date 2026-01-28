import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Loader2,
  User,
  Building
} from 'lucide-react';
import { useSeries } from '@/hooks/useEmissoes';
import { useAlocacoesPorEmissao } from '@/hooks/useInvestidores';
import { 
  TIPO_INVESTIDOR_LABELS, 
  STATUS_ALOCACAO_LABELS,
  STATUS_ALOCACAO_COLORS 
} from '@/types/estruturacao';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { InvestidorDocumentos } from '../InvestidorDocumentos';
import { NovaAlocacaoDrawer } from '../NovaAlocacaoDrawer';

interface InvestidoresTabProps {
  idEmissao: string;
}

export function InvestidoresTab({ idEmissao }: InvestidoresTabProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: series, isLoading: seriesLoading } = useSeries(idEmissao);
  const seriesIds = series?.map(s => s.id) || [];
  const { data: alocacoes, isLoading: alocacoesLoading } = useAlocacoesPorEmissao(idEmissao, seriesIds);

  const isLoading = seriesLoading || alocacoesLoading;

  // Agrupa alocações por série
  const alocacoesPorSerie = series?.map(serie => ({
    serie,
    alocacoes: alocacoes?.filter(a => a.id_serie === serie.id) || [],
    totalAlocado: alocacoes?.filter(a => a.id_serie === serie.id)
      .reduce((sum, a) => sum + a.valor_alocado, 0) || 0,
  })) || [];

  const totalGeralAlocado = alocacoes?.reduce((sum, a) => sum + a.valor_alocado, 0) || 0;

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
          <h3 className="text-lg font-medium">Investidores & Alocações</h3>
          <p className="text-sm text-muted-foreground">
            Total alocado: {formatCurrency(totalGeralAlocado)}
          </p>
        </div>
        <Button size="sm" onClick={() => setDrawerOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Alocação
        </Button>
      </div>

      {!series || series.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma série cadastrada.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crie séries para gerenciar alocações.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {alocacoesPorSerie.map(({ serie, alocacoes: serieAlocacoes, totalAlocado }) => (
            <Card key={serie.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium">Série {serie.numero}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(serie.valor_emissao || 0)} • 
                      {totalAlocado > 0 && (
                        <span className="ml-1">
                          {((totalAlocado / (serie.valor_emissao || 1)) * 100).toFixed(1)}% alocado
                        </span>
                      )}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {serieAlocacoes.length} investidor(es)
                  </Badge>
                </div>

                {serieAlocacoes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum investidor alocado nesta série.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {serieAlocacoes.map((alocacao) => (
                      <Card key={alocacao.id} className="bg-muted/30">
                        <CardContent className="py-4">
                          {/* Cabeçalho do Investidor */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-background rounded-full">
                                {alocacao.investidor?.tipo_investidor === 'varejo' ? (
                                  <User className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Building className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {alocacao.investidor?.nome || 'Investidor'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {alocacao.investidor?.tipo_investidor && 
                                    TIPO_INVESTIDOR_LABELS[alocacao.investidor.tipo_investidor]
                                  }
                                  {alocacao.investidor?.cpf_cnpj && (
                                    <span className="ml-2 text-xs">
                                      CPF/CNPJ: {alocacao.investidor.cpf_cnpj}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(alocacao.valor_alocado)}</p>
                              <Badge 
                                variant="outline" 
                                className={cn('text-xs', STATUS_ALOCACAO_COLORS[alocacao.status])}
                              >
                                {STATUS_ALOCACAO_LABELS[alocacao.status]}
                              </Badge>
                            </div>
                          </div>

                          {/* Documentos do Investidor */}
                          {alocacao.investidor?.id && (
                            <div className="border-t pt-4 mt-4">
                              <InvestidorDocumentos 
                                idInvestidor={alocacao.investidor.id}
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Drawer para nova alocação */}
      <NovaAlocacaoDrawer
        idEmissao={idEmissao}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { NavigationTabs } from '@/components/NavigationTabs';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusActions } from '@/components/StatusActions';
import { EnvioProposta } from '@/components/EnvioProposta';
import { HistoricoVersoes } from '@/components/HistoricoVersoes';
import { detalhesEmissao } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function Proposal() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const id = searchParams.get('id');

  const [emissao, setEmissao] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEnvioDialog, setShowEnvioDialog] = useState(false);

  useEffect(() => {
    if (id) {
      loadEmissao();
    } else {
      setIsLoading(false);
    }
  }, [id]);

  const loadEmissao = async () => {
    try {
      const result = await detalhesEmissao(id!);
      if (result.data) {
        setEmissao(result.data);
      }
    } catch (error) {
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar a emissão.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePropostaGerada = () => {
    setShowEnvioDialog(false);
    loadEmissao();
    toast({
      title: 'Proposta gerada com sucesso!',
      description: 'A proposta foi aberta em uma nova aba.',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Group costs by type - uses custos_linhas format from DB
  const groupCostsByType = (custosData: any) => {
    const groups: Record<string, any[]> = {
      upfront: [],
      anual: [],
      mensal: [],
      outros: [],
    };

    // Handle custos_linhas format from custos_emissao
    const linhas = custosData?.custos_linhas || [];
    
    linhas.forEach((linha: any) => {
      // Add upfront cost if exists
      if (linha.preco_upfront > 0 || linha.valor_upfront_bruto > 0) {
        groups.upfront.push({
          tipo: linha.papel || 'Custo',
          valor: linha.valor_upfront_bruto || linha.preco_upfront,
        });
      }
      
      // Add recurrent cost if exists
      if (linha.preco_recorrente > 0 || linha.valor_recorrente_bruto > 0) {
        const periodicidade = linha.periodicidade?.toLowerCase() || 'anual';
        const targetGroup = periodicidade === 'mensal' ? groups.mensal : groups.anual;
        targetGroup.push({
          tipo: linha.papel || 'Custo',
          valor: linha.valor_recorrente_bruto || linha.preco_recorrente,
        });
      }
    });

    return groups;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <NavigationTabs />
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <NavigationTabs />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="border-0 card-shadow">
            <CardContent className="py-16 text-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma proposta selecionada</h3>
              <p className="text-muted-foreground mb-6">
                Selecione uma emissão no Dashboard para visualizar a proposta.
              </p>
              <Button onClick={() => navigate('/')}>
                Ir para Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!emissao) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <NavigationTabs />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Emissão não encontrada.</p>
          <Button onClick={() => navigate('/')} className="mx-auto mt-4 block">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const costGroups = emissao.custos ? groupCostsByType(emissao.custos) : { upfront: [], anual: [], mensal: [], outros: [] };
  const totalCosts = emissao.custos?.total_primeiro_ano || 0;
  const percentualVolume = emissao.volume > 0 ? ((totalCosts / emissao.volume) * 100).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <NavigationTabs />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="ghost" onClick={() => navigate('/')} className="mb-2 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Proposta - {emissao.numero_emissao}</h2>
              {emissao.versao && (
                <Badge variant="outline" className="text-xs">
                  v{emissao.versao}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={emissao.status || emissao.status_proposta || 'rascunho'} />
              <span className="text-sm text-muted-foreground">
                Criada em {new Date(emissao.criado_em || emissao.data_criacao).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <StatusActions
              currentStatus={emissao.status || emissao.status_proposta || 'rascunho'}
              emissaoId={id!}
              onStatusChange={loadEmissao}
              onOpenEnvioDialog={() => setShowEnvioDialog(true)}
            />
            <Dialog open={showEnvioDialog} onOpenChange={setShowEnvioDialog}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Preencher dados para envio</DialogTitle>
                </DialogHeader>
                <EnvioProposta
                  emissaoId={id!}
                  dadosIniciais={{
                    empresa_cnpj: emissao.empresa_cnpj,
                    empresa_razao_social: emissao.empresa_razao_social,
                    empresa_endereco: emissao.empresa_endereco,
                    contato_nome: emissao.contato_nome,
                    contato_email: emissao.contato_email,
                  }}
                  onSuccess={handlePropostaGerada}
                  onCancel={() => setShowEnvioDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-6">
          {/* Emission Data */}
          <Card className="border-0 card-shadow">
            <CardHeader>
              <CardTitle>Dados da Emissão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Demandante</p>
                  <p className="font-semibold">{emissao.demandante_proposta || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Empresa Destinatária</p>
                  <p className="font-semibold">{emissao.empresa_destinataria || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <p className="font-semibold">{emissao.categoria_info?.codigo || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Oferta</p>
                  <p className="font-semibold">{emissao.tipo_oferta_info?.nome || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Veículo</p>
                  <p className="font-semibold">{emissao.veiculo_info?.nome || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Volume Total</p>
                  <p className="font-semibold">{formatCurrency(emissao.volume)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantidade de Séries</p>
                  <p className="font-semibold">{emissao.series?.length || 0}</p>
                </div>
                {emissao.lastro_info && (
                  <div>
                    <p className="text-sm text-muted-foreground">Lastro</p>
                    <p className="font-semibold">{emissao.lastro_info.nome}</p>
                  </div>
                )}
              </div>

              {/* Séries da Emissão */}
              {emissao.series && emissao.series.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm text-muted-foreground mb-3">Séries</p>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Série</TableHead>
                          <TableHead className="text-right">Volume</TableHead>
                          <TableHead className="text-right">Prazo (anos)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {emissao.series.map((serie: any) => (
                          <TableRow key={serie.id}>
                            <TableCell className="font-medium">Série {serie.numero}</TableCell>
                            <TableCell className="text-right">{formatCurrency(serie.valor_emissao)}</TableCell>
                            <TableCell className="text-right">{serie.prazo || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {emissao.observacao && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="text-sm">{emissao.observacao}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Costs by Category */}
          {emissao.custos && (costGroups.upfront.length > 0 || costGroups.anual.length > 0 || costGroups.mensal.length > 0) && (
            <>
              {/* Upfront Costs */}
              {costGroups.upfront.length > 0 && (
                <Card className="border-0 card-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Despesas Up Front (Flat)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Prestador</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {costGroups.upfront.map((custo: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{custo.tipo}</TableCell>
                              <TableCell className="text-right">{formatCurrency(custo.valor)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/30 font-semibold">
                            <TableCell>TOTAL</TableCell>
                            <TableCell className="text-right text-primary">
                              {formatCurrency(costGroups.upfront.reduce((sum: number, c: any) => sum + c.valor, 0))}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Annual Costs */}
              {costGroups.anual.length > 0 && (
                <Card className="border-0 card-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Despesas Anuais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Prestador</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {costGroups.anual.map((custo: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{custo.tipo}</TableCell>
                              <TableCell className="text-right">{formatCurrency(custo.valor)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/30 font-semibold">
                            <TableCell>TOTAL</TableCell>
                            <TableCell className="text-right text-primary">
                              {formatCurrency(costGroups.anual.reduce((sum: number, c: any) => sum + c.valor, 0))}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Monthly Costs */}
              {costGroups.mensal.length > 0 && (
                <Card className="border-0 card-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Despesas Mensais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Prestador</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {costGroups.mensal.map((custo: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{custo.tipo}</TableCell>
                              <TableCell className="text-right">{formatCurrency(custo.valor)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/30 font-semibold">
                            <TableCell>TOTAL</TableCell>
                            <TableCell className="text-right text-primary">
                              {formatCurrency(costGroups.mensal.reduce((sum: number, c: any) => sum + c.valor, 0))}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Other Costs */}
              {costGroups.outros.length > 0 && (
                <Card className="border-0 card-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Outros Custos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {costGroups.outros.map((custo: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{custo.tipo}</TableCell>
                              <TableCell className="text-right">{formatCurrency(custo.valor)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Summary */}
          <Card className="border-0 card-shadow bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader className="pb-3">
              <CardTitle>Resumo de Custos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card rounded-lg p-4 card-shadow">
                  <p className="text-sm text-muted-foreground mb-1">Total de Custos</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(totalCosts)}</p>
                </div>
                <div className="bg-card rounded-lg p-4 card-shadow">
                  <p className="text-sm text-muted-foreground mb-1">Volume da Emissão</p>
                  <p className="text-2xl font-bold">{formatCurrency(emissao.volume)}</p>
                </div>
                <div className="bg-card rounded-lg p-4 card-shadow">
                  <p className="text-sm text-muted-foreground mb-1">% de Custos</p>
                  <p className="text-2xl font-bold text-warning">{percentualVolume}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Versões */}
          <Card className="border-0 card-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                Histórico de Alterações
                {emissao.versao && (
                  <Badge variant="outline">v{emissao.versao}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HistoricoVersoes 
                emissaoId={id!} 
                versaoAtual={emissao.versao || 1}
                onRefresh={loadEmissao}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Plus, 
  Loader2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useSeries } from '@/hooks/useEmissoes';
import { useFluxoCaixaPorEmissao } from '@/hooks/useFluxoCaixa';
import { TIPO_EVENTO_FLUXO_LABELS } from '@/types/estruturacao';
import { formatCurrency } from '@/utils/formatters';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface FluxoCaixaTabProps {
  idEmissao: string;
}

export function FluxoCaixaTab({ idEmissao }: FluxoCaixaTabProps) {
  const { data: series, isLoading: seriesLoading } = useSeries(idEmissao);
  const seriesIds = series?.map(s => s.id) || [];
  const { data: fluxos, isLoading: fluxosLoading } = useFluxoCaixaPorEmissao(seriesIds);

  const isLoading = seriesLoading || fluxosLoading;

  // Agrupa fluxos por data
  const fluxosAgrupados = fluxos?.reduce((acc, fluxo) => {
    const data = fluxo.data_evento;
    if (!acc[data]) {
      acc[data] = [];
    }
    acc[data].push(fluxo);
    return acc;
  }, {} as Record<string, typeof fluxos>) || {};

  const datasOrdenadas = Object.keys(fluxosAgrupados).sort();

  // Calcula totais
  const totalEntradas = fluxos?.filter(f => f.tipo_evento === 'receita' || f.tipo_evento === 'amortizacao')
    .reduce((sum, f) => sum + f.valor_projetado, 0) || 0;
  const totalSaidas = fluxos?.filter(f => f.tipo_evento === 'despesa' || f.tipo_evento === 'juros')
    .reduce((sum, f) => sum + f.valor_projetado, 0) || 0;

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
          <h3 className="text-lg font-medium">Fluxo de Caixa Projetado</h3>
          <p className="text-sm text-muted-foreground">
            {fluxos?.length || 0} evento(s)
          </p>
        </div>
        <Button size="sm" disabled>
          <Plus className="h-4 w-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entradas</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(totalEntradas)}
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saídas</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(totalSaidas)}
                </p>
              </div>
              <ArrowDownRight className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-xl font-bold ${totalEntradas - totalSaidas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalEntradas - totalSaidas)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {!fluxos || fluxos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum evento de fluxo cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Série</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasOrdenadas.flatMap(data => 
                fluxosAgrupados[data].map((fluxo, idx) => {
                  const serie = series?.find(s => s.id === fluxo.id_serie);
                  const isEntrada = fluxo.tipo_evento === 'receita' || fluxo.tipo_evento === 'amortizacao';
                  
                  return (
                    <TableRow key={fluxo.id}>
                      <TableCell>
                        {idx === 0 ? new Date(data).toLocaleDateString('pt-BR') : ''}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {TIPO_EVENTO_FLUXO_LABELS[fluxo.tipo_evento]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        Série {serie?.numero || '-'}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${isEntrada ? 'text-green-600' : 'text-red-600'}`}>
                        {isEntrada ? '+' : '-'} {formatCurrency(fluxo.valor_projetado)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertCircle, Save, Loader2, Download } from 'lucide-react';
import { CostSection, type CostType } from './despesas/CostSection';
import type { CostItem } from './despesas/CostRow';
import { useCustosEmissao, useCustosLinhas } from '@/hooks/useCustos';
import { useSeries } from '@/hooks/useEmissoes';
import { formatCurrency } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { convertToApiFormat, salvarCustos } from '@/lib/supabase-custos';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { exportDespesasLayoutToExcel } from '@/lib/excel-despesas';
import { useQuery } from '@tanstack/react-query';

interface DespesasTabProps {
  idEmissao: string;
}

export interface CostsData {
  upfront: CostItem[];
  anual: CostItem[];
  mensal: CostItem[];
}

export function DespesasTab({ idEmissao }: DespesasTabProps) {
  const queryClient = useQueryClient();
  const { data: custos, isLoading: isLoadingCustos } = useCustosEmissao(idEmissao);
  const { data: custosLinhas, isLoading: isLoadingLinhas } = useCustosLinhas(custos?.id);
  const { data: series = [] } = useSeries(idEmissao);

  const { data: emissaoMeta } = useQuery({
    queryKey: ['emissao-meta', idEmissao],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emissoes')
        .select('numero_emissao')
        .eq('id', idEmissao)
        .maybeSingle();
      if (error) throw error;
      return data as { numero_emissao: string } | null;
    },
    enabled: !!idEmissao,
  });

  const [costsData, setCostsData] = useState<CostsData>({
    upfront: [],
    anual: [],
    mensal: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Volume total das séries
  const volume = series.reduce((acc, s) => acc + (s.valor_emissao || 0), 0);

  // Converter dados do banco para o formato do componente
  useEffect(() => {
    if (custosLinhas && custosLinhas.length > 0) {
      const upfront: CostItem[] = [];
      const anual: CostItem[] = [];
      const mensal: CostItem[] = [];

      custosLinhas.forEach((linha) => {
        const prestadorNome = (linha.prestador as { nome?: string })?.nome || linha.papel || '';

        // Classificar APENAS por periodicidade
        if (linha.periodicidade === 'mensal') {
          // MENSAL: usar preco_recorrente
          mensal.push({
            id: linha.id,
            prestador: prestadorNome,
            papel: linha.papel,
            valor: linha.preco_recorrente || 0,
            grossUp: linha.gross_up || 0,
            valorBruto: linha.valor_recorrente_bruto || linha.preco_recorrente || 0,
            tipo: 'auto',
            origem: (linha as any).origem || 'manual',
            id_prestador: linha.id_prestador,
            periodicidade: 'mensal',
          });
        } else if (linha.periodicidade === 'anual') {
          // ANUAL: usar preco_recorrente
          anual.push({
            id: linha.id,
            prestador: prestadorNome,
            papel: linha.papel,
            valor: linha.preco_recorrente || 0,
            grossUp: linha.gross_up || 0,
            valorBruto: linha.valor_recorrente_bruto || linha.preco_recorrente || 0,
            tipo: 'auto',
            origem: (linha as any).origem || 'manual',
            id_prestador: linha.id_prestador,
            periodicidade: 'anual',
          });
        } else {
          // UPFRONT: periodicidade null/undefined, usar preco_upfront
          if (linha.preco_upfront && linha.preco_upfront > 0) {
            upfront.push({
              id: linha.id,
              prestador: prestadorNome,
              papel: linha.papel,
              valor: linha.preco_upfront,
              grossUp: linha.gross_up || 0,
              valorBruto: linha.valor_upfront_bruto || linha.preco_upfront,
              tipo: 'auto',
              origem: (linha as any).origem || 'manual',
              id_prestador: linha.id_prestador,
              periodicidade: null,
            });
          }
        }
      });

      setCostsData({ upfront, anual, mensal });
      setHasChanges(false);
    } else if (custos) {
      // Fallback: usar campos diretos da tabela custos se não houver linhas
      const upfront: CostItem[] = [];
      const anual: CostItem[] = [];

      const upfrontFields = [
        { key: 'fee_agente_fiduciario_upfront', papel: 'Agente Fiduciário' },
        { key: 'fee_securitizadora_upfront', papel: 'Securitizadora' },
        { key: 'fee_custodiante_lastro_upfront', papel: 'Custodiante Lastro' },
        { key: 'fee_liquidante_upfront', papel: 'Liquidante' },
        { key: 'fee_escriturador_upfront', papel: 'Escriturador' },
        { key: 'fee_servicer_upfront', papel: 'Servicer' },
        { key: 'fee_escriturador_nc_upfront', papel: 'Escriturador NC' },
        { key: 'fee_gerenciador_obra_upfront', papel: 'Gerenciador de Obra' },
        { key: 'fee_coordenador_lider_upfront', papel: 'Coordenador Líder' },
        { key: 'fee_assessor_legal_upfront', papel: 'Assessor Legal' },
        { key: 'taxa_fiscalizacao_oferta_upfront', papel: 'Taxa Fiscalização Oferta' },
        { key: 'taxa_anbima_upfront', papel: 'Taxa ANBIMA' },
      ];

      const recorrenteFields = [
        { key: 'fee_agente_fiduciario_recorrente', papel: 'Agente Fiduciário' },
        { key: 'fee_securitizadora_recorrente', papel: 'Securitizadora' },
        { key: 'fee_custodiante_lastro_recorrente', papel: 'Custodiante Lastro' },
        { key: 'fee_liquidante_recorrente', papel: 'Liquidante' },
        { key: 'fee_escriturador_recorrente', papel: 'Escriturador' },
        { key: 'fee_servicer_recorrente', papel: 'Servicer' },
        { key: 'fee_escriturador_nc_recorrente', papel: 'Escriturador NC' },
        { key: 'fee_gerenciador_obra_recorrente', papel: 'Gerenciador de Obra' },
        { key: 'fee_auditoria_recorrente', papel: 'Auditoria' },
        { key: 'fee_contabilidade_recorrente', papel: 'Contabilidade' },
      ];

      upfrontFields.forEach(({ key, papel }) => {
        const valor = (custos as Record<string, unknown>)[key] as number | null;
        if (valor && valor > 0) {
          upfront.push({
            id: key,
            prestador: papel,
            papel,
            valor,
            grossUp: 0,
            valorBruto: valor,
            tipo: 'auto',
          });
        }
      });

      recorrenteFields.forEach(({ key, papel }) => {
        const valor = (custos as Record<string, unknown>)[key] as number | null;
        if (valor && valor > 0) {
          anual.push({
            id: key,
            prestador: papel,
            papel,
            valor,
            grossUp: 0,
            valorBruto: valor,
            tipo: 'auto',
          });
        }
      });

      setCostsData({ upfront, anual, mensal: [] });
      setHasChanges(false);
    }
  }, [custosLinhas, custos]);

  const handleSectionChange = (type: CostType, items: CostItem[]) => {
    setCostsData((prev) => ({ ...prev, [type]: items }));
    setHasChanges(true);
  };

  const handleExport = async () => {
    try {
      const numero = emissaoMeta?.numero_emissao || 'emissao';
      exportDespesasLayoutToExcel({
        numeroEmissao: numero,
        volumeEmissao: volume,
        upfront: costsData.upfront,
        anual: costsData.anual,
        mensal: costsData.mensal,
      });
      toast.success('Excel de despesas gerado');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Falha ao exportar despesas');
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    
    try {
      const allCosts = [
        ...convertToApiFormat(costsData.upfront, 'upfront'),
        ...convertToApiFormat(costsData.anual, 'anual'),
        ...convertToApiFormat(costsData.mensal, 'mensal'),
      ];

      const totalUpfrontCalc = costsData.upfront.reduce((s, i) => s + i.valorBruto, 0);
      const totalAnualCalc = costsData.anual.reduce((s, i) => s + i.valorBruto, 0);
      const totalMensalCalc = costsData.mensal.reduce((s, i) => s + i.valorBruto, 0);

      const result = await salvarCustos({
        id_emissao_comercial: idEmissao,
        custos: allCosts,
        totais: {
          total_upfront: totalUpfrontCalc,
          total_anual: totalAnualCalc,
          total_mensal: totalMensalCalc,
          total_primeiro_ano: totalUpfrontCalc + totalAnualCalc + (totalMensalCalc * 12),
          total_anos_subsequentes: totalAnualCalc + (totalMensalCalc * 12),
        },
      });

      if (result.success) {
        toast.success(`Custos salvos com sucesso${result.versao ? ` (v${result.versao})` : ''}`);
        setHasChanges(false);
        // linhas são sempre identificadas por id_custos_emissao
        const idCustosEmissao = result.id_custos_emissao || custos?.id;
        if (idCustosEmissao) {
          queryClient.invalidateQueries({ queryKey: ['custos-linhas', idCustosEmissao] });
        }
        queryClient.invalidateQueries({ queryKey: ['custos', idEmissao] });
      } else {
        toast.error(result.error || 'Erro ao salvar custos');
      }
    } catch (error) {
      console.error('Erro ao salvar custos:', error);
      toast.error('Erro inesperado ao salvar custos');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingCustos || isLoadingLinhas) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const totalUpfront = costsData.upfront.reduce((sum, item) => sum + item.valorBruto, 0);
  const totalAnual = costsData.anual.reduce((sum, item) => sum + item.valorBruto, 0);
  const totalMensal = costsData.mensal.reduce((sum, item) => sum + item.valorBruto, 0);

  const custoPrimeiroAno = totalUpfront + totalAnual + (totalMensal * 12);
  const custoAnosSubsequentes = totalAnual + (totalMensal * 12);

  const percentualVolume = volume > 0 ? ((custoPrimeiroAno / volume) * 100).toFixed(2) : '0.00';

  const hasCosts = costsData.upfront.length > 0 || costsData.anual.length > 0 || costsData.mensal.length > 0;

  return (
    <div className="space-y-6">
      {!hasCosts && (
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-900/10">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Nenhum custo encontrado para esta emissão</p>
                <p className="text-sm text-muted-foreground">
                  Você pode adicionar custos manualmente nas seções abaixo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <CostSection
        type="upfront"
        items={costsData.upfront}
        onChange={(items) => handleSectionChange('upfront', items)}
      />

      <CostSection
        type="anual"
        items={costsData.anual}
        onChange={(items) => handleSectionChange('anual', items)}
      />

      <CostSection
        type="mensal"
        items={costsData.mensal}
        onChange={(items) => handleSectionChange('mensal', items)}
      />

      {/* Summary Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">CUSTO TOTAL DA OPERAÇÃO</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card rounded-lg p-4 shadow-sm">
              <p className="text-sm text-muted-foreground mb-1">Primeiro Ano</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(custoPrimeiroAno)}</p>
            </div>
            <div className="bg-card rounded-lg p-4 shadow-sm">
              <p className="text-sm text-muted-foreground mb-1">Anos Subsequentes</p>
              <p className="text-2xl font-bold">{formatCurrency(custoAnosSubsequentes)}</p>
              <p className="text-xs text-muted-foreground">/ano</p>
            </div>
            <div className="bg-card rounded-lg p-4 shadow-sm">
              <p className="text-sm text-muted-foreground mb-1">% do Volume</p>
              <p className="text-2xl font-bold text-amber-600">{percentualVolume}%</p>
              <p className="text-xs text-muted-foreground">Volume: {formatCurrency(volume)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <Button variant="outline" onClick={handleExport} className="gap-2 w-full sm:w-auto">
          <Download className="h-4 w-4" />
          Exportar despesas (Excel)
        </Button>

        {hasChanges ? (
          <div className="flex justify-end">
            <Button
              onClick={handleSaveAll}
              disabled={isSaving}
              size="lg"
              className="gap-2 w-full sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground sm:text-right">
            Sem alterações pendentes
          </div>
        )}
      </div>
    </div>
  );
}

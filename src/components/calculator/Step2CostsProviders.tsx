import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, Save, TrendingUp, AlertCircle } from 'lucide-react';
import { CostSection, type CostItem, type CostType } from './CostSection';

export type { CostItem } from './CostSection';

export interface CostsData {
  upfront: CostItem[];
  anual: CostItem[];
  mensal: CostItem[];
}

interface Step2Props {
  costsData: CostsData;
  volume: number;
  onChange: (data: CostsData) => void;
}

export function Step2CostsProviders({ costsData, volume, onChange }: Step2Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSectionChange = (type: CostType, items: CostItem[]) => {
    onChange({ ...costsData, [type]: items });
  };

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
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 text-warning">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Nenhum custo encontrado para esta combinação</p>
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
      <Card className="border-0 card-shadow bg-gradient-to-r from-primary/5 to-primary/10">
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
            <div className="bg-card rounded-lg p-4 card-shadow">
              <p className="text-sm text-muted-foreground mb-1">Primeiro Ano</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(custoPrimeiroAno)}</p>
            </div>
            <div className="bg-card rounded-lg p-4 card-shadow">
              <p className="text-sm text-muted-foreground mb-1">Anos Subsequentes</p>
              <p className="text-2xl font-bold">{formatCurrency(custoAnosSubsequentes)}</p>
              <p className="text-xs text-muted-foreground">/ano</p>
            </div>
            <div className="bg-card rounded-lg p-4 card-shadow">
              <p className="text-sm text-muted-foreground mb-1">% do Volume</p>
              <p className="text-2xl font-bold text-warning">{percentualVolume}%</p>
              <p className="text-xs text-muted-foreground">Volume: {formatCurrency(volume)}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
            <Button variant="outline">
              <Bookmark className="h-4 w-4 mr-2" />
              Salvar no Histórico
            </Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Usar na Proposta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Legacy exports for backward compatibility
export interface Provider {
  id: string;
  nome: string;
  precoDefault: number;
  precoAtual: number;
  selecionado: boolean;
  motivo: string;
  editing?: boolean;
}

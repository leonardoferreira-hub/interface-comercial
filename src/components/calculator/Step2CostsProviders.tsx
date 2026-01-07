import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, Save, TrendingUp } from 'lucide-react';
import { CostSection, type CostItem, type CostType } from './CostSection';

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

const defaultUpfrontItems: CostItem[] = [
  { id: '1', prestador: 'Fee de Estruturação', valor: 0, grossUp: 15, valorBruto: 0, tipo: 'input' },
  { id: '2', prestador: 'Assessor Legal', valor: 0, grossUp: 15, valorBruto: 0, tipo: 'input' },
  { id: '3', prestador: 'CETIP - Registro Ativo', valor: 6714.50, grossUp: 0, valorBruto: 6714.50, tipo: 'calculado' },
  { id: '4', prestador: 'Registro Cartório', valor: 8547.03, grossUp: 0, valorBruto: 8547.03, tipo: 'calculado' },
  { id: '5', prestador: 'Publicação AGE', valor: 8000, grossUp: 0, valorBruto: 8000, tipo: 'auto' },
  { id: '6', prestador: 'Custodiante do Lastro', valor: 8000, grossUp: 0, valorBruto: 8000, tipo: 'auto' },
  { id: '7', prestador: 'Implantação do Escriturador', valor: 2000, grossUp: 0, valorBruto: 2000, tipo: 'auto' },
  { id: '8', prestador: 'Escriturador (1ª Parcela)', valor: 6000, grossUp: 0, valorBruto: 6000, tipo: 'auto' },
  { id: '9', prestador: 'Liquidante (1ª Parcela)', valor: 4000, grossUp: 0, valorBruto: 4000, tipo: 'auto' },
];

const defaultAnualItems: CostItem[] = [
  { id: '10', prestador: 'Custodiante do Lastro', valor: 8000, grossUp: 0, valorBruto: 8000, tipo: 'auto' },
  { id: '11', prestador: 'Escriturador', valor: 6000, grossUp: 0, valorBruto: 6000, tipo: 'auto' },
  { id: '12', prestador: 'Liquidante', valor: 4000, grossUp: 0, valorBruto: 4000, tipo: 'auto' },
  { id: '13', prestador: 'Auditoria Patrimônio Separado', valor: 6000, grossUp: 0, valorBruto: 6000, tipo: 'auto' },
  { id: '14', prestador: 'Contabilidade Patrimônio Separado', valor: 3600, grossUp: 0, valorBruto: 3600, tipo: 'auto' },
];

const defaultMensalItems: CostItem[] = [
  { id: '15', prestador: 'Gestão Securitizadora', valor: 0, grossUp: 0, valorBruto: 0, tipo: 'input' },
  { id: '16', prestador: 'B3/CETIP - Custódia', valor: 262.50, grossUp: 0, valorBruto: 262.50, tipo: 'calculado' },
  { id: '17', prestador: 'Contabilidade Patrimônio Separado', valor: 600, grossUp: 0, valorBruto: 600, tipo: 'auto' },
];

export const defaultCostsData: CostsData = {
  upfront: defaultUpfrontItems,
  anual: defaultAnualItems,
  mensal: defaultMensalItems,
};

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

  return (
    <div className="space-y-6">
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

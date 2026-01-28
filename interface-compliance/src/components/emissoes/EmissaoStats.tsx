import { Card, CardContent } from '@/components/ui/card';
import { Emissao } from '@/types';
import { formatCurrencyCompact, formatNumber } from '@/utils/formatters';
import { FileText, DollarSign, Clock, CheckCircle } from 'lucide-react';

interface EmissaoStatsProps {
  emissoes: Emissao[];
}

export function EmissaoStats({ emissoes }: EmissaoStatsProps) {
  const totalEmissoes = emissoes.length;
  const valorTotal = emissoes.reduce((acc, e) => acc + e.valor_total, 0);
  const emEstruturacao = emissoes.filter(e => 
    e.status === 'em_estruturacao' || e.status === 'em_analise'
  ).length;
  const registradas = emissoes.filter(e => e.status === 'registrado').length;

  const stats = [
    {
      label: 'Total de Emissões',
      value: formatNumber(totalEmissoes),
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Valor Total',
      value: formatCurrencyCompact(valorTotal),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Em Estruturação',
      value: formatNumber(emEstruturacao),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      label: 'Registradas',
      value: formatNumber(registradas),
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-full p-3 ${stat.bgColor}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

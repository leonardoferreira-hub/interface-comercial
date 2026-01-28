import { ShieldCheck, Users, Building2, FileCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/layout/Navigation';
import { useDashboard } from '@/hooks/useCompliance';

export default function Dashboard() {
  const { data: stats } = useDashboard();

  const cards = [
    {
      title: 'Verificações Pendentes',
      value: stats?.verificacoes_pendentes || 0,
      icon: Building2,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Em Análise',
      value: stats?.verificacoes_em_analise || 0,
      icon: FileCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Investidores Pendentes',
      value: stats?.investidores_pendentes || 0,
      icon: Users,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'CNPJs Verificados (30d)',
      value: stats?.cnpjs_verificados_30d || 0,
      icon: ShieldCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Compliance</h1>
          <p className="text-muted-foreground">
            Gestão de verificações e onboarding
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title}>
                <CardHeader className="pb-2">
                  <div className={`p-2 w-fit rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

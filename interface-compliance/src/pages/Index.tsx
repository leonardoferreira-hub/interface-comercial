import { useState } from 'react';
import { ShieldCheck, Users, Building2, FileCheck, AlertCircle, CheckCircle, Clock, ArrowRight, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from '@/components/layout/Navigation';
import { useDashboard, useVerificacoesPendentes, useInvestidores } from '@/hooks/useCompliance';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboard();
  const { data: verificacoes } = useVerificacoesPendentes();
  const { data: investidores } = useInvestidores();

  const cards = [
    {
      title: 'Verificações Pendentes',
      value: stats?.verificacoes_pendentes || 0,
      icon: Building2,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      path: '/verificacoes',
      urgent: (stats?.verificacoes_pendentes || 0) > 0,
    },
    {
      title: 'Em Análise',
      value: stats?.verificacoes_em_analise || 0,
      icon: FileCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      path: '/verificacoes',
    },
    {
      title: 'Investidores Pendentes',
      value: stats?.investidores_pendentes || 0,
      icon: Users,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      path: '/investidores',
      urgent: (stats?.investidores_pendentes || 0) > 0,
    },
    {
      title: 'CNPJs Verificados (30d)',
      value: stats?.cnpjs_verificados_30d || 0,
      icon: ShieldCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      path: '/historico',
    },
  ];

  // Filtrar apenas itens pendentes para o To-Do
  const pendentesVerificacao = verificacoes?.filter(v => v.status === 'pendente').slice(0, 5) || [];
  const pendentesInvestidor = investidores?.filter(i => 
    i.status_onboarding === 'pendente' || i.status_onboarding === 'documentacao_pendente'
  ).slice(0, 5) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navigation />
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Compliance</h1>
          </div>
          <p className="text-muted-foreground">
            Gestão de verificações, onboarding e due diligence
          </p>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card 
                key={card.title} 
                className={`cursor-pointer hover:shadow-md transition-shadow ${card.urgent ? 'border-amber-400' : ''}`}
                onClick={() => navigate(card.path)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${card.bgColor}`}>
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    {card.urgent && (
                      <Bell className="h-4 w-4 text-amber-500 animate-pulse" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{card.value}</div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs com To-Do e Atividades */}
        <Tabs defaultValue="pendentes" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="pendentes">
              <AlertCircle className="h-4 w-4 mr-2" />
              Pendentes ({pendentesVerificacao.length + pendentesInvestidor.length})
            </TabsTrigger>
            <TabsTrigger value="verificacoes">
              <Building2 className="h-4 w-4 mr-2" />
              Últimas Verificações
            </TabsTrigger>
            <TabsTrigger value="investidores">
              <Users className="h-4 w-4 mr-2" />
              Últimos Investidores
            </TabsTrigger>
          </TabsList>

          {/* Tab Pendentes */}
          <TabsContent value="pendentes" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* To-Do Verificações */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-amber-600" />
                      Verificações Pendentes
                    </CardTitle>
                    {pendentesVerificacao.length > 0 && (
                      <Badge variant="secondary">{pendentesVerificacao.length} pendentes</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {pendentesVerificacao.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                      <p>Nenhuma verificação pendente!</p>
                      <p className="text-sm">Todas as análises estão em dia.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendentesVerificacao.map((v) => (
                        <div 
                          key={v.id} 
                          className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-100"
                          onClick={() => navigate('/verificacoes')}
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{v.nome_entidade || v.cnpj}</p>
                            <p className="text-xs text-muted-foreground">{v.numero_emissao} • {v.tipo_entidade}</p>
                          </div>
                          <Badge variant="outline" className="text-amber-600 shrink-0">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        </div>
                      ))}
                      {verificacoes && verificacoes.filter(v => v.status === 'pendente').length > 5 && (
                        <Button 
                          variant="ghost" 
                          className="w-full text-sm"
                          onClick={() => navigate('/verificacoes')}
                        >
                          Ver todas ({verificacoes.filter(v => v.status === 'pendente').length})
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* To-Do Investidores */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-amber-600" />
                      Investidores Pendentes
                    </CardTitle>
                    {pendentesInvestidor.length > 0 && (
                      <Badge variant="secondary">{pendentesInvestidor.length} pendentes</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {pendentesInvestidor.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                      <p>Nenhum investidor pendente!</p>
                      <p className="text-sm">Todos os onboards estão completos.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendentesInvestidor.map((inv) => (
                        <div 
                          key={inv.id} 
                          className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-100"
                          onClick={() => navigate('/investidores')}
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{inv.nome}</p>
                            <p className="text-xs text-muted-foreground">{inv.tipo_investidor} • {inv.cpf_cnpj}</p>
                          </div>
                          <Badge variant="outline" className="text-amber-600 shrink-0">
                            {inv.status_onboarding === 'documentacao_pendente' ? 'Doc. Pendente' : 'Pendente'}
                          </Badge>
                        </div>
                      ))}
                      {investidores && investidores.filter(i => 
                        i.status_onboarding === 'pendente' || i.status_onboarding === 'documentacao_pendente'
                      ).length > 5 && (
                        <Button 
                          variant="ghost" 
                          className="w-full text-sm"
                          onClick={() => navigate('/investidores')}
                        >
                          Ver todos ({investidores.filter(i => 
                            i.status_onboarding === 'pendente' || i.status_onboarding === 'documentacao_pendente'
                          ).length})
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Últimas Verificações */}
          <TabsContent value="verificacoes">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Últimas Verificações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {verificacoes?.slice(0, 10).map((v) => (
                    <div 
                      key={v.id} 
                      className="py-3 flex items-center justify-between cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate('/verificacoes')}
                    >
                      <div>
                        <p className="font-medium text-sm">{v.nome_entidade || v.cnpj}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.numero_emissao} • {format(new Date(v.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant={v.status === 'aprovado' ? 'default' : v.status === 'reprovado' ? 'destructive' : 'secondary'}>
                        {v.status === 'pendente' ? 'Pendente' : v.status === 'em_analise' ? 'Em Análise' : v.status === 'aprovado' ? 'Aprovado' : 'Reprovado'}
                      </Badge>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma verificação encontrada
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Últimos Investidores */}
          <TabsContent value="investidores">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Últimos Investidores Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {investidores?.slice(0, 10).map((inv) => (
                    <div 
                      key={inv.id} 
                      className="py-3 flex items-center justify-between cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate('/investidores')}
                    >
                      <div>
                        <p className="font-medium text-sm">{inv.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {inv.tipo_investidor} • {format(new Date(inv.criado_em), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant={
                        inv.status_onboarding === 'aprovado' ? 'default' : 
                        inv.status_onboarding === 'reprovado' ? 'destructive' : 
                        'secondary'
                      }>
                        {inv.status_onboarding === 'pendente' ? 'Pendente' : 
                         inv.status_onboarding === 'documentacao_pendente' ? 'Doc. Pendente' :
                         inv.status_onboarding === 'em_analise' ? 'Em Análise' :
                         inv.status_onboarding === 'aprovado' ? 'Aprovado' : 'Reprovado'}
                      </Badge>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum investidor encontrado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

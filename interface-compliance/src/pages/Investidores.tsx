import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Search, Plus, Filter, MoreHorizontal, 
  User, Building2, CheckCircle, XCircle, Clock, 
  FileText, ChevronRight, Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from '@/components/layout/Navigation';
import { DocumentosUpload } from '@/components/DocumentosUpload';
import { FadeIn, StaggerContainer, StaggerItem, HoverScale } from '@/components/animations';
import { 
  useInvestidores,
  useInvestidorDetalhes,
  useCriarInvestidor,
  useAnalisarInvestidor,
  type Investidor
} from '@/hooks/useCompliance';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  documentacao_pendente: { label: 'Doc. Pendente', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  em_analise: { label: 'Em Análise', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  aprovado: { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  reprovado: { label: 'Reprovado', color: 'bg-rose-100 text-rose-700 border-rose-200' },
};

export default function InvestidoresPage() {
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [busca, setBusca] = useState('');
  const [drawerNovo, setDrawerNovo] = useState(false);
  const [drawerDetalhes, setDrawerDetalhes] = useState(false);
  const [investidorSelecionado, setInvestidorSelecionado] = useState<Investidor | null>(null);

  const { data: investidores, isLoading } = useInvestidores(filtroStatus || undefined);
  const { data: detalhes } = useInvestidorDetalhes(investidorSelecionado?.id);
  const criar = useCriarInvestidor();
  const analisar = useAnalisarInvestidor();

  const filtered = investidores?.filter(i => 
    i.cpf_cnpj.includes(busca) ||
    i.nome.toLowerCase().includes(busca.toLowerCase())
  ) || [];

  const stats = {
    total: investidores?.length || 0,
    pendentes: investidores?.filter(i => i.status_onboarding === 'pendente' || i.status_onboarding === 'documentacao_pendente').length || 0,
    emAnalise: investidores?.filter(i => i.status_onboarding === 'em_analise').length || 0,
    aprovados: investidores?.filter(i => i.status_onboarding === 'aprovado').length || 0,
    reprovados: investidores?.filter(i => i.status_onboarding === 'reprovado').length || 0,
  };

  const handleCriar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    await criar.mutateAsync({
      cpf_cnpj: formData.get('cpf_cnpj') as string,
      nome: formData.get('nome') as string,
      email: formData.get('email') as string,
      telefone: formData.get('telefone') as string,
      tipo: formData.get('tipo') as string,
      tipo_investidor: formData.get('tipo_investidor') as string,
    });
    
    setDrawerNovo(false);
    form.reset();
    toast.success('Investidor cadastrado com sucesso!');
  };

  const abrirDetalhes = (inv: Investidor) => {
    setInvestidorSelecionado(inv);
    setDrawerDetalhes(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Navigation />
      
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <FadeIn>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                Investidores
              </h1>
              <p className="text-slate-500 mt-1">
                Gestão de onboarding e documentação
              </p>
            </div>
            <Button 
              onClick={() => setDrawerNovo(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Investidor
            </Button>
          </div>
        </FadeIn>

        {/* Stats Cards */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StaggerItem>
            <Card className="bg-white/80 backdrop-blur border-slate-200/60">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500">Total</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className="bg-amber-50/80 border-amber-200/60">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-amber-700">{stats.pendentes}</p>
                <p className="text-xs text-amber-600">Pendentes</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className="bg-blue-50/80 border-blue-200/60">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-blue-700">{stats.emAnalise}</p>
                <p className="text-xs text-blue-600">Em Análise</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className="bg-emerald-50/80 border-emerald-200/60">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-emerald-700">{stats.aprovados}</p>
                <p className="text-xs text-emerald-600">Aprovados</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className="bg-rose-50/80 border-rose-200/60">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-rose-700">{stats.reprovados}</p>
                <p className="text-xs text-rose-600">Reprovados</p>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        {/* Filtros */}
        <FadeIn delay={0.3}>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou CPF/CNPJ..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 bg-white/80 border-slate-200"
              />
            </div>
            <Select value={filtroStatus || 'todos'} onValueChange={(v) => setFiltroStatus(v === 'todos' ? '' : v)}>
              <SelectTrigger className="w-full sm:w-56 bg-white/80">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="documentacao_pendente">Doc. Pendente</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="reprovado">Reprovado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FadeIn>

        {/* Tabela */}
        <FadeIn delay={0.4}>
          <Card className="bg-white/80 backdrop-blur border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Investidor</th>
                    <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Tipo</th>
                    <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Perfil</th>
                    <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Cadastro</th>
                    <th className="text-right py-4 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((inv, index) => {
                    const status = statusConfig[inv.status_onboarding];
                    
                    return (
                      <motion.tr
                        key={inv.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => abrirDetalhes(inv)}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                              {inv.tipo === 'pessoa_fisica' ? (
                                <User className="h-4 w-4 text-slate-500" />
                              ) : (
                                <Building2 className="h-4 w-4 text-slate-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{inv.nome}</p>
                              <p className="text-sm text-slate-500">{inv.cpf_cnpj}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-slate-600">
                            {inv.tipo === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm capitalize text-slate-600">{inv.tipo_investidor}</span>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={`${status.color} border`}>
                            {status.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-slate-500">
                            {format(new Date(inv.criado_em), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            Ver detalhes
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </FadeIn>
      </div>

      {/* Drawer Novo Investidor */}
      <Sheet open={drawerNovo} onOpenChange={setDrawerNovo}>
        <SheetContent className="w-full sm:max-w-lg bg-white">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="text-xl">Novo Investidor</SheetTitle>
          </SheetHeader>
          
          <form onSubmit={handleCriar} className="py-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Nome completo *</label>
              <Input name="nome" required className="bg-slate-50" placeholder="Digite o nome do investidor" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">CPF/CNPJ *</label>
              <Input name="cpf_cnpj" required className="bg-slate-50" placeholder="000.000.000-00 ou 00.000.000/0000-00" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <Input name="email" type="email" className="bg-slate-50" placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Telefone</label>
                <Input name="telefone" className="bg-slate-50" placeholder="(00) 00000-0000" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tipo</label>
                <Select name="tipo" defaultValue="pessoa_fisica">
                  <SelectTrigger className="bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                    <SelectItem value="pessoa_juridica">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Perfil</label>
                <Select name="tipo_investidor" defaultValue="varejo">
                  <SelectTrigger className="bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="varejo">Varejo</SelectItem>
                    <SelectItem value="qualificado">Qualificado</SelectItem>
                    <SelectItem value="profissional">Profissional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="pt-4 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDrawerNovo(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={criar.isPending}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                {criar.isPending ? 'Cadastrando...' : 'Cadastrar Investidor'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Drawer Detalhes */}
      <Sheet open={drawerDetalhes} onOpenChange={setDrawerDetalhes}>
        <SheetContent className="w-full sm:max-w-xl bg-white overflow-y-auto">
          {investidorSelecionado && (
            <>
              <SheetHeader className="border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    {investidorSelecionado.tipo === 'pessoa_fisica' ? (
                      <User className="h-5 w-5 text-slate-600" />
                    ) : (
                      <Building2 className="h-5 w-5 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <SheetTitle className="text-xl">{investidorSelecionado.nome}</SheetTitle>
                    <p className="text-sm text-slate-500">{investidorSelecionado.cpf_cnpj}</p>
                  </div>
                </div>
              </SheetHeader>

              <div className="py-6">
                <Tabs defaultValue="documentos">
                  <TabsList className="w-full grid grid-cols-3 bg-slate-100">
                    <TabsTrigger value="documentos">Documentos</TabsTrigger>
                    <TabsTrigger value="informacoes">Informações</TabsTrigger>
                    <TabsTrigger value="analise">Análise</TabsTrigger>
                  </TabsList>

                  <TabsContent value="documentos" className="mt-6">
                    <DocumentosUpload investidorId={investidorSelecionado.id} isCompliance={true} />
                  </TabsContent>

                  <TabsContent value="informacoes" className="mt-6 space-y-4">
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-slate-500">Tipo</p>
                            <p className="font-medium">{investidorSelecionado.tipo === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Perfil</p>
                            <p className="font-medium capitalize">{investidorSelecionado.tipo_investidor}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Email</p>
                            <p className="font-medium">{investidorSelecionado.email || 'Não informado'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Telefone</p>
                            <p className="font-medium">{investidorSelecionado.telefone || 'Não informado'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="analise" className="mt-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-500">Status atual</p>
                            <Badge className={`${statusConfig[investidorSelecionado.status_onboarding].color} mt-1`}>
                              {statusConfig[investidorSelecionado.status_onboarding].label}
                            </Badge>
                          </div>
                        </div>
                        
                        {investidorSelecionado.status_onboarding !== 'aprovado' && (
                          <div className="flex gap-2 mt-6">
                            <Button variant="outline" className="flex-1">
                              <Clock className="h-4 w-4 mr-2" />
                              Em Análise
                            </Button>
                            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Aprovar
                            </Button>
                            <Button variant="destructive" className="flex-1">
                              <XCircle className="h-4 w-4 mr-2" />
                              Reprovar
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

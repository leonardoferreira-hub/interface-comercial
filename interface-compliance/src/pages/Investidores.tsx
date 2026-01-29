import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Search, 
  Plus, 
  CheckCircle, 
  XCircle,
  Clock,
  FileText,
  User,
  Building,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Navigation } from '@/components/layout/Navigation';
import { 
  useInvestidores,
  useCriarInvestidor,
  useAnalisarInvestidor,
  useInvestidorDetalhes,
  type Investidor
} from '@/hooks/useCompliance';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-gray-100 text-gray-700' },
  documentacao_pendente: { label: 'Doc. Pendente', color: 'bg-amber-100 text-amber-700' },
  em_analise: { label: 'Em Análise', color: 'bg-blue-100 text-blue-700' },
  aprovado: { label: 'Aprovado', color: 'bg-green-100 text-green-700' },
  reprovado: { label: 'Reprovado', color: 'bg-red-100 text-red-700' },
};

export default function InvestidoresPage() {
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [busca, setBusca] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detalheOpen, setDetalheOpen] = useState(false);
  const [investidorSelecionado, setInvestidorSelecionado] = useState<Investidor | null>(null);
  const [observacaoAnalise, setObservacaoAnalise] = useState('');
  
  const { data: investidores, isLoading, error } = useInvestidores(filtroStatus || undefined);
  const { data: detalhes } = useInvestidorDetalhes(investidorSelecionado?.id);
  const criar = useCriarInvestidor();
  const analisar = useAnalisarInvestidor();

  const filtered = investidores?.filter(i => 
    i.cpf_cnpj.includes(busca) ||
    i.nome.toLowerCase().includes(busca.toLowerCase())
  ) || [];

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
    
    setDrawerOpen(false);
    form.reset();
  };

  const handleAnalisar = async (status: 'aprovado' | 'reprovado' | 'em_analise') => {
    if (!investidorSelecionado) return;
    
    await analisar.mutateAsync({
      id: investidorSelecionado.id,
      status,
      observacoes: observacaoAnalise,
    });
    
    setObservacaoAnalise('');
    toast.success('Análise registrada');
  };

  const abrirDetalhes = (inv: Investidor) => {
    setInvestidorSelecionado(inv);
    setDetalheOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex justify-center py-20">
          <Clock className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto py-6 px-4">
          <Card className="border-red-200">
            <CardContent className="py-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <p className="text-red-600">Erro ao carregar dados</p>
              <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navigation />
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Investidores</h1>
            <p className="text-muted-foreground">
              Gestão de onboarding e documentação
            </p>
          </div>
          <Button onClick={() => setDrawerOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Investidor
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por CPF/CNPJ ou nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filtroStatus || 'todos'} onValueChange={(v) => setFiltroStatus(v === 'todos' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="documentacao_pendente">Doc. Pendente</SelectItem>
              <SelectItem value="em_analise">Em Análise</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="reprovado">Reprovado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela de Investidores */}
        <Card>
          <CardContent className="p-0">
            {investidores === undefined ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Carregando dados...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum investidor encontrado</p>
              </div>
            ) : (
              <div className="divide-y">
                {/* Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-muted/50 text-sm font-medium text-muted-foreground">
                  <div className="col-span-4">Nome / Documento</div>
                  <div className="col-span-2">Tipo</div>
                  <div className="col-span-2">Perfil</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2 text-right">Ações</div>
                </div>
                
                {/* Linhas */}
                {filtered.map((inv) => {
                  const status = statusConfig[inv.status_onboarding];
                  
                  return (
                    <div 
                      key={inv.id} 
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => abrirDetalhes(inv)}
                    >
                      {/* Nome e Documento */}
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg shrink-0">
                          {inv.tipo === 'pessoa_fisica' ? (
                            <User className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Building className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{inv.nome}</p>
                          <p className="text-sm text-muted-foreground">{inv.cpf_cnpj}</p>
                        </div>
                      </div>
                      
                      {/* Tipo */}
                      <div className="col-span-2">
                        <span className="text-sm text-muted-foreground">
                          {inv.tipo === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                        </span>
                      </div>
                      
                      {/* Perfil */}
                      <div className="col-span-2">
                        <span className="text-sm capitalize">{inv.tipo_investidor}</span>
                        {inv.perfil_risco && (
                          <p className="text-xs text-muted-foreground">Perfil: {inv.perfil_risco}</p>
                        )}
                      </div>
                      
                      {/* Status */}
                      <div className="col-span-2">
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                      
                      {/* Ações */}
                      <div className="col-span-2 flex justify-end">
                        <Button variant="ghost" size="sm">
                          Ver detalhes
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Drawer de criação */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Novo Investidor</SheetTitle>
          </SheetHeader>
          
          <form onSubmit={handleCriar} className="py-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" name="nome" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cpf_cnpj">CPF/CNPJ *</Label>
              <Input id="cpf_cnpj" name="cpf_cnpj" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" name="telefone" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select name="tipo" defaultValue="pessoa_fisica">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                  <SelectItem value="pessoa_juridica">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo_investidor">Tipo de Investidor</Label>
              <Select name="tipo_investidor" defaultValue="varejo">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="varejo">Varejo</SelectItem>
                  <SelectItem value="qualificado">Qualificado</SelectItem>
                  <SelectItem value="profissional">Profissional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={criar.isPending}>
                {criar.isPending ? 'Criando...' : 'Criar Investidor'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Drawer de detalhes */}
      <Sheet open={detalheOpen} onOpenChange={setDetalheOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          {investidorSelecionado && (
            <>
              <SheetHeader className="pb-4 border-b">
                <div className="flex items-center gap-2">
                  {investidorSelecionado.tipo === 'pessoa_fisica' ? (
                    <User className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Building className="h-5 w-5 text-muted-foreground" />
                  )}
                  <SheetTitle className="text-lg">{investidorSelecionado.nome}</SheetTitle>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{investidorSelecionado.cpf_cnpj}</p>
                  <p>Cadastrado em: {format(new Date(investidorSelecionado.criado_em), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
              </SheetHeader>

              <div className="py-4">
                <Tabs defaultValue="kyc">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="kyc">
                      <FileText className="h-4 w-4 mr-2" />
                      KYC
                    </TabsTrigger>
                    <TabsTrigger value="suitability">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Suitability
                    </TabsTrigger>
                    <TabsTrigger value="analise">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Análise
                    </TabsTrigger>
                  </TabsList>

                  {/* Aba KYC */}
                  <TabsContent value="kyc" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Informações do KYC</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Tipo</p>
                            <p className="font-medium">{investidorSelecionado.tipo === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Perfil</p>
                            <p className="font-medium capitalize">{investidorSelecionado.tipo_investidor}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Email</p>
                            <p className="font-medium">{investidorSelecionado.email || 'Não informado'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Telefone</p>
                            <p className="font-medium">{investidorSelecionado.telefone || 'Não informado'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Documentos */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Documentos Enviados</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {detalhes?.documentos?.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Nenhum documento enviado</p>
                        ) : (
                          <div className="space-y-2">
                            {detalhes?.documentos?.map((doc: any) => (
                              <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm">{doc.tipo_documento}</span>
                                <Badge variant={doc.status === 'aprovado' ? 'default' : doc.status === 'rejeitado' ? 'destructive' : 'secondary'}>
                                  {doc.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Aba Suitability */}
                  <TabsContent value="suitability" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Perfil de Risco</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {investidorSelecionado.perfil_risco ? (
                          <div className="text-center py-4">
                            <p className="text-2xl font-bold capitalize">{investidorSelecionado.perfil_risco}</p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Perfil definido no suitability
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Suitability ainda não preenchido
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Aba Análise */}
                  <TabsContent value="analise" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Status Atual</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge className={statusConfig[investidorSelecionado.status_onboarding].color}>
                            {statusConfig[investidorSelecionado.status_onboarding].label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {investidorSelecionado.data_analise ? 
                              `Analisado em: ${format(new Date(investidorSelecionado.data_analise), 'dd/MM/yyyy')}` : 
                              'Aguardando análise'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Ações de análise */}
                    {investidorSelecionado.status_onboarding !== 'aprovado' && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Realizar Análise</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Observações</Label>
                            <Textarea
                              value={observacaoAnalise}
                              onChange={(e) => setObservacaoAnalise(e.target.value)}
                              placeholder="Adicione observações sobre a análise..."
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              className="flex-1" 
                              variant="outline"
                              onClick={() => handleAnalisar('em_analise')}
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Em Análise
                            </Button>
                            <Button 
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => handleAnalisar('aprovado')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Aprovar
                            </Button>
                            <Button 
                              className="flex-1" 
                              variant="destructive"
                              onClick={() => handleAnalisar('reprovado')}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reprovar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
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

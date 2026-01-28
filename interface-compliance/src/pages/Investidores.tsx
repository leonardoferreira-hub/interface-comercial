import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Search, 
  Plus, 
  CheckCircle, 
  XCircle,
  Clock,
  FileText,
  User,
  Building
} from 'lucide-react';
import { Navigation } from '@/components/layout/Navigation';
import { 
  useInvestidores,
  useCriarInvestidor,
  useAnalisarInvestidor,
  type Investidor
} from '@/hooks/useCompliance';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [investidorSelecionado, setInvestidorSelecionado] = useState<Investidor | null>(null);
  
  const { data: investidores, isLoading, error } = useInvestidores(filtroStatus || undefined);
  const criar = useCriarInvestidor();
  const analisar = useAnalisarInvestidor();

  console.log('Investidores:', investidores);
  console.log('Error:', error);

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
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto py-6 px-4">
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
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="documentacao_pendente">Doc. Pendente</SelectItem>
              <SelectItem value="em_analise">Em Análise</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="reprovado">Reprovado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {investidores === undefined ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Carregando dados...</p>
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum investidor encontrado</p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((inv) => {
              const status = statusConfig[inv.status_onboarding];
              
              return (
                <Card key={inv.id} className="cursor-pointer hover:border-primary" onClick={() => setInvestidorSelecionado(inv)}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-muted rounded-lg">
                        {inv.tipo === 'pessoa_fisica' ? (
                          <User className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Building className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                    
                    <h3 className="font-medium truncate">{inv.nome}</h3>
                    <p className="text-sm text-muted-foreground">{inv.cpf_cnpj}</p>
                    
                    <div className="mt-3 text-xs text-muted-foreground space-y-1">
                      <p>Tipo: {inv.tipo_investidor}</p>
                      {inv.perfil_risco && <p>Perfil: {inv.perfil_risco}</p>}
                      <p>Cadastrado em: {format(new Date(inv.criado_em), 'dd/MM/yyyy', { locale: ptBR })}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
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
    </div>
  );
}

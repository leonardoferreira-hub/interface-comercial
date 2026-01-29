import { useEffect, useState } from 'react';
import { FileDown, FileSpreadsheet, Search, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Header } from '@/components/Header';
import { NavigationTabs } from '@/components/NavigationTabs';
import { StatusBadge } from '@/components/StatusBadge';
import { listarEmissoes, type Emissao } from '@/lib/supabase';
import { exportToCSV, exportToXLSX } from '@/lib/exportUtils';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Reports() {
  const { toast } = useToast();
  const [emissoes, setEmissoes] = useState<Emissao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  useEffect(() => {
    loadAllEmissoes();
  }, []);

  const loadAllEmissoes = async () => {
    setIsLoading(true);
    try {
      // Load all pages
      let allData: Emissao[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const result = await listarEmissoes(page, 100);
        if (result.data && result.data.length > 0) {
          allData = [...allData, ...result.data];
          page++;
          hasMore = result.data.length === 100;
        } else {
          hasMore = false;
        }
      }

      setEmissoes(allData);
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEmissoes = emissoes.filter((e) => {
    const matchesSearch =
      e.numero_emissao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.demandante_proposta.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status_proposta === statusFilter;
    const matchesCategory = categoryFilter === 'all' || e.categoria === categoryFilter;

    const emissaoDate = new Date(e.data_criacao);
    const matchesDateFrom = !dateFrom || emissaoDate >= dateFrom;
    const matchesDateTo = !dateTo || emissaoDate <= dateTo;

    return matchesSearch && matchesStatus && matchesCategory && matchesDateFrom && matchesDateTo;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleExportCSV = () => {
    if (filteredEmissoes.length === 0) {
      toast({
        title: 'Nenhum dado para exportar',
        description: 'Aplique filtros diferentes ou aguarde os dados carregarem.',
        variant: 'destructive',
      });
      return;
    }
    exportToCSV(filteredEmissoes, 'emissoes');
    toast({
      title: 'Exportação concluída',
      description: `${filteredEmissoes.length} registros exportados para CSV.`,
    });
  };

  const handleExportXLSX = async () => {
    if (filteredEmissoes.length === 0) {
      toast({
        title: 'Nenhum dado para exportar',
        description: 'Aplique filtros diferentes ou aguarde os dados carregarem.',
        variant: 'destructive',
      });
      return;
    }
    await exportToXLSX(filteredEmissoes, 'emissoes');
    toast({
      title: 'Exportação concluída',
      description: `${filteredEmissoes.length} registros exportados para Excel.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <NavigationTabs />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Relatórios</h2>
          <p className="text-muted-foreground">Exporte dados das emissões em CSV ou Excel</p>
        </div>

        {/* Filters */}
        <Card className="border-0 card-shadow mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="enviada">Enviada</SelectItem>
                  <SelectItem value="aceita">Aceita</SelectItem>
                  <SelectItem value="rejeitada">Rejeitada</SelectItem>
                  <SelectItem value="estruturando">Estruturando</SelectItem>
                  <SelectItem value="estruturada">Estruturada</SelectItem>
                  <SelectItem value="liquidada">Liquidada</SelectItem>
                  <SelectItem value="arquivada">Arquivada</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  <SelectItem value="DEB">DEB</SelectItem>
                  <SelectItem value="CRA">CRA</SelectItem>
                  <SelectItem value="CRI">CRI</SelectItem>
                  <SelectItem value="NC">NC</SelectItem>
                  <SelectItem value="CR">CR</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: ptBR }) : 'Data início'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: ptBR }) : 'Data fim'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Export Buttons and Table */}
        <Card className="border-0 card-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Dados ({filteredEmissoes.length} registros)
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExportCSV} disabled={isLoading}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button onClick={handleExportXLSX} disabled={isLoading}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Número</TableHead>
                      <TableHead>Demandante</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Volume</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmissoes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhum registro encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmissoes.map((emissao) => (
                        <TableRow key={emissao.id}>
                          <TableCell className="font-medium">{emissao.numero_emissao}</TableCell>
                          <TableCell>{emissao.demandante_proposta}</TableCell>
                          <TableCell>{emissao.categoria}</TableCell>
                          <TableCell>{formatCurrency(emissao.volume)}</TableCell>
                          <TableCell>
                            <StatusBadge status={emissao.status_proposta} />
                          </TableCell>
                          <TableCell>
                            {new Date(emissao.data_criacao).toLocaleDateString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

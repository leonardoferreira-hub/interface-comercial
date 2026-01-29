import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/Header';
import { NavigationTabs } from '@/components/NavigationTabs';
import { KPICards } from '@/components/KPICards';
import { EmissionsTable } from '@/components/EmissionsTable';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { VolumeBarChart } from '@/components/charts/VolumeBarChart';
import { listarEmissoes, type Emissao } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Index() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [emissoes, setEmissoes] = useState<Emissao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadEmissoes();
  }, [page]);

  const loadEmissoes = async () => {
    setIsLoading(true);
    try {
      const result = await listarEmissoes(page, 10);
      if (result.data) {
        setEmissoes(result.data);
        setTotalPages(result.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast({
        title: 'Erro ao carregar emissões',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEmissoes = useMemo(() => emissoes.filter((e) => {
    const matchesSearch =
      e.numero_emissao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.demandante_proposta.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status_proposta === statusFilter;
    const matchesCategory = categoryFilter === 'all' || e.categoria === categoryFilter;

    const emissaoDate = new Date(e.data_criacao);
    const matchesDateFrom = !dateFrom || emissaoDate >= dateFrom;
    const matchesDateTo = !dateTo || emissaoDate <= dateTo;

    return matchesSearch && matchesStatus && matchesCategory && matchesDateFrom && matchesDateTo;
  }), [emissoes, searchTerm, statusFilter, categoryFilter, dateFrom, dateTo]);

  // KPI calculations - memoizados
  const kpiData = useMemo(() => {
    const total = emissoes.length;
    const aceitas = emissoes.filter((e) => e.status_proposta === 'aceita').length;
    const estruturando = emissoes.filter(
      (e) => e.status_proposta === 'em_estruturacao'
    ).length;
    const volumeTotal = emissoes.reduce((sum, e) => sum + e.volume, 0);
    return { total, aceitas, estruturando, volumeTotal };
  }, [emissoes]);

  // Chart data - memoizado
  const categoryData = useMemo(() => ['DEB', 'CRA', 'CRI', 'NC', 'CR'].map((cat) => ({
    name: cat,
    value: emissoes.filter((e) => e.categoria === cat).length,
    color: '',
  })).filter((d) => d.value > 0), [emissoes]);

  // Status labels - definido fora do componente (constante)
  const statusVolumeData = useMemo(() => {
    const statusLabels: Record<string, string> = {
      aceita: 'Aceita',
      em_estruturacao: 'Em Estruturação',
      enviada: 'Enviada',
      rascunho: 'Rascunho',
      rejeitada: 'Rejeitada',
    };
    return ['aceita', 'em_estruturacao', 'enviada', 'rascunho'].map((status) => ({
      name: statusLabels[status] || status,
      value: emissoes.filter((e) => e.status_proposta === status).reduce((sum, e) => sum + e.volume, 0),
      color: '',
    })).filter((d) => d.value > 0);
  }, [emissoes]);

  const handleView = (id: string) => {
    navigate(`/proposta?id=${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/calculadora?edit=${id}`);
  };

  const handleExport = (id: string) => {
    navigate(`/proposta?id=${id}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <NavigationTabs />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPIs */}
        <div className="mb-8">
          <KPICards
            total={kpiData.total}
            aceitas={kpiData.aceitas}
            estruturando={kpiData.estruturando}
            volumeTotal={kpiData.volumeTotal}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <CategoryPieChart data={categoryData} />
          <VolumeBarChart data={statusVolumeData} />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="enviada">Enviada</SelectItem>
                  <SelectItem value="aceita">Aceita</SelectItem>
                  <SelectItem value="rejeitada">Rejeitada</SelectItem>
                  <SelectItem value="em_estruturacao">Em Estruturação</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="DEB">DEB</SelectItem>
                  <SelectItem value="CRA">CRA</SelectItem>
                  <SelectItem value="CRI">CRI</SelectItem>
                  <SelectItem value="NC">NC</SelectItem>
                  <SelectItem value="CR">CR</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'dd/MM', { locale: ptBR }) : 'De'}
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
                  <Button variant="outline" size="sm" className="h-10">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'dd/MM', { locale: ptBR }) : 'Até'}
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

              {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Limpar
                </Button>
              )}
            </div>

            <Button onClick={() => navigate('/calculadora')} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nova Cotação
            </Button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">Carregando emissões...</div>
          </div>
        ) : filteredEmissoes.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl card-shadow">
            <div className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || dateFrom || dateTo
                ? 'Nenhuma emissão encontrada com os filtros aplicados.'
                : 'Nenhuma emissão cadastrada ainda.'}
            </div>
            <Button onClick={() => navigate('/calculadora')}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Cotação
            </Button>
          </div>
        ) : (
          <>
            <EmissionsTable
              emissoes={filteredEmissoes}
              onView={handleView}
              onEdit={handleEdit}
              onExport={handleExport}
              onStatusChange={loadEmissoes}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

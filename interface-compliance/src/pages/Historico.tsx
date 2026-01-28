import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navigation } from '@/components/layout/Navigation';
import { useCNPJsVerificados } from '@/hooks/useCompliance';
import { ShieldCheck, Search, CheckCircle, XCircle, History } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function HistoricoPage() {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const { data: cnpjs, isLoading } = useCNPJsVerificados();

  const filtered = cnpjs?.filter(c => {
    const matchBusca = c.cnpj.includes(busca) || 
                       c.razao_social?.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = !filtroStatus || c.status_compliance === filtroStatus;
    return matchBusca && matchStatus;
  });

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
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <History className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Histórico</h1>
          </div>
          <p className="text-muted-foreground">
            Base histórica de CNPJs verificados
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por CNPJ ou razão social..."
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
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="reprovado">Reprovado</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-bold text-green-600">
                {cnpjs?.filter(c => c.status_compliance === 'aprovado').length || 0}
              </div>
              <p className="text-sm text-muted-foreground">CNPJs Aprovados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-bold text-red-600">
                {cnpjs?.filter(c => c.status_compliance === 'reprovado').length || 0}
              </div>
              <p className="text-sm text-muted-foreground">CNPJs Reprovados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-bold">
                {cnpjs?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Total na Base</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              CNPJs Verificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filtered?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum CNPJ encontrado no histórico</p>
              </div>
            ) : (
              <div className="divide-y">
                {filtered?.map((cnpj) => (
                  <div key={cnpj.id} className="py-4 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {cnpj.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                        </span>
                        {cnpj.status_compliance === 'aprovado' ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aprovado
                          </Badge>
                        ) : cnpj.status_compliance === 'reprovado' ? (
                          <Badge className="bg-red-100 text-red-700">
                            <XCircle className="h-3 w-3 mr-1" />
                            Reprovado
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {cnpj.razao_social || 'Razão social não informada'}
                      </p>
                      {cnpj.observacoes && (
                        <p className="text-sm text-red-600 mt-1">
                          <strong>Obs:</strong> {cnpj.observacoes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Verificado em: {cnpj.data_verificacao ? 
                          format(new Date(cnpj.data_verificacao), 'dd/MM/yyyy', { locale: ptBR }) : 
                          'Data não registrada'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

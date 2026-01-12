import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText } from 'lucide-react';
import { useEffect } from 'react';
import { CurrencyInput } from '@/components/ui/currency-input';

export interface Serie {
  numero: number;
  valor_emissao: number;
  prazo?: number; // Em anos, apenas para DEB
}

export interface EmissaoData {
  demandante_proposta: string;
  empresa_destinataria: string;
  categoria: string;
  oferta: string;
  veiculo: string;
  lastro: string;
  quantidade_series: string;
  series: Serie[];
}

interface Step1Props {
  data: EmissaoData;
  onChange: (data: EmissaoData) => void;
}

export function Step1BasicData({ data, onChange }: Step1Props) {
  const handleChange = (field: keyof EmissaoData, value: string | Serie[]) => {
    onChange({ ...data, [field]: value });
  };

  // Lógica condicional: CRI/CRA usam Lastro, DEB/CR usam Oferta/Veículo
  const showLastro = ['CRI', 'CRA'].includes(data.categoria);
  const showOfertaVeiculo = ['DEB', 'CR', 'NC'].includes(data.categoria);
  
  // Prazo obrigatório para Privada Cetipada e CVM 160
  const requiresPrazo = ['Oferta Privada Cetipada', 'Oferta CVM 160'].includes(data.oferta);

  // Limpar campos quando categoria muda
  useEffect(() => {
    if (showLastro) {
      // Limpar oferta e veiculo quando mudar para CRI/CRA
      if (data.oferta || data.veiculo) {
        onChange({ ...data, oferta: '', veiculo: '' });
      }
    } else if (showOfertaVeiculo) {
      // Limpar lastro quando mudar para DEB/CR/NC
      if (data.lastro) {
        onChange({ ...data, lastro: '' });
      }
    }
  }, [data.categoria]);

  // Update series array when quantidade_series changes
  useEffect(() => {
    const count = parseInt(data.quantidade_series) || 1;
    const currentSeries = data.series || [];

    if (count !== currentSeries.length) {
      const newSeries: Serie[] = [];
      for (let i = 1; i <= count; i++) {
        const existing = currentSeries.find(s => s.numero === i);
        newSeries.push({
          numero: i,
          valor_emissao: existing?.valor_emissao || 0,
          prazo: existing?.prazo
        });
      }
      onChange({ ...data, series: newSeries });
    }
  }, [data.quantidade_series]);

  const handleSerieVolumeChange = (numero: number, valor_emissao: number) => {
    const updatedSeries = data.series.map(s =>
      s.numero === numero ? { ...s, valor_emissao } : s
    );
    handleChange('series', updatedSeries);
  };

  const handleSeriePrazoChange = (numero: number, prazo: number) => {
    const updatedSeries = data.series.map(s =>
      s.numero === numero ? { ...s, prazo } : s
    );
    handleChange('series', updatedSeries);
  };

  const volumeTotal = data.series.reduce((sum, s) => sum + (s.valor_emissao || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card className="border-0 card-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl">Dados Básicos</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="demandante">Demandante da Proposta *</Label>
            <Input
              id="demandante"
              placeholder="Nome do demandante"
              value={data.demandante_proposta}
              onChange={(e) => handleChange('demandante_proposta', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="empresa">Empresa Destinatária *</Label>
            <Input
              id="empresa"
              placeholder="Nome da empresa destinatária"
              value={data.empresa_destinataria}
              onChange={(e) => handleChange('empresa_destinataria', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria *</Label>
            <Select value={data.categoria} onValueChange={(value) => handleChange('categoria', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEB">DEB - Debênture</SelectItem>
                <SelectItem value="CRA">CRA - Certificado de Recebíveis do Agronegócio</SelectItem>
                <SelectItem value="CRI">CRI - Certificado de Recebíveis Imobiliários</SelectItem>
                <SelectItem value="NC">NC - Nota Comercial</SelectItem>
                <SelectItem value="CR">CR - Certificado de Recebíveis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campos condicionais: Lastro para CRI/CRA */}
          {showLastro && (
            <div className="space-y-2">
              <Label htmlFor="lastro">Lastro *</Label>
              <Select value={data.lastro} onValueChange={(value) => handleChange('lastro', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o lastro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="origem">Origem</SelectItem>
                  <SelectItem value="destinacao">Destinação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Campos condicionais: Oferta para DEB/CR/NC */}
          {showOfertaVeiculo && (
            <div className="space-y-2">
              <Label htmlFor="oferta">Tipo de Oferta *</Label>
              <Select value={data.oferta} onValueChange={(value) => handleChange('oferta', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Oferta Privada Pura">Oferta Privada Pura</SelectItem>
                  <SelectItem value="Oferta Privada Cetipada">Oferta Privada Cetipada</SelectItem>
                  <SelectItem value="Oferta CVM 160">Oferta CVM 160</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Veículo - apenas para DEB/CR/NC */}
        {showOfertaVeiculo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="veiculo">Veículo *</Label>
              <Select value={data.veiculo} onValueChange={(value) => handleChange('veiculo', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Veículo Exclusivo">Veículo Exclusivo</SelectItem>
                  <SelectItem value="Patrimônio Separado">Patrimônio Separado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="series">Quantidade de Séries *</Label>
              <Input
                id="series"
                type="number"
                min="1"
                placeholder="1"
                value={data.quantidade_series}
                onChange={(e) => handleChange('quantidade_series', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Quantidade de séries para CRI/CRA */}
        {showLastro && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="series">Quantidade de Séries *</Label>
              <Input
                id="series"
                type="number"
                min="1"
                placeholder="1"
                value={data.quantidade_series}
                onChange={(e) => handleChange('quantidade_series', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Dynamic Series Table */}
        {data.series.length > 0 && (
          <div className="space-y-3">
            <Label>Séries e Valores de Emissão</Label>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-24">Série</TableHead>
                    <TableHead>Valor de Emissão (R$)</TableHead>
                    {requiresPrazo && (
                      <TableHead className="w-40">Prazo (anos) *</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.series.map((serie) => (
                    <TableRow key={serie.numero}>
                      <TableCell className="font-medium">{serie.numero}</TableCell>
                      <TableCell>
                        <CurrencyInput
                          value={serie.valor_emissao}
                          onChange={(value) => handleSerieVolumeChange(serie.numero, value)}
                          className="max-w-xs"
                        />
                      </TableCell>
                      {requiresPrazo && (
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="5"
                            value={serie.prazo || ''}
                            onChange={(e) => handleSeriePrazoChange(serie.numero, parseInt(e.target.value) || 0)}
                            className="w-24"
                            required
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Volume Total */}
            <div className="flex justify-end">
              <div className="bg-primary/10 px-4 py-2 rounded-lg">
                <span className="text-sm text-muted-foreground mr-2">Volume Total Calculado:</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(volumeTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

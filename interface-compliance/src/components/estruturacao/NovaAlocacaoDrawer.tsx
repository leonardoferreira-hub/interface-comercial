import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useInvestidores, 
  useCreateAlocacao,
  type AlocacaoInvestidorInsert 
} from '@/hooks/useInvestidores';
import { useSeries } from '@/hooks/useEmissoes';
import { TIPO_INVESTIDOR_LABELS } from '@/types/estruturacao';
import { toast } from 'sonner';
import { Plus, UserPlus } from 'lucide-react';

interface NovaAlocacaoDrawerProps {
  idEmissao: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovaAlocacaoDrawer({ idEmissao, open, onOpenChange }: NovaAlocacaoDrawerProps) {
  const { data: series } = useSeries(idEmissao);
  const { data: investidores } = useInvestidores();
  const createAlocacao = useCreateAlocacao();

  const [idSerie, setIdSerie] = useState('');
  const [idInvestidor, setIdInvestidor] = useState('');
  const [valorAlocado, setValorAlocado] = useState('');
  const [status, setStatus] = useState<AlocacaoInvestidorInsert['status']>('reservado');

  const handleSubmit = async () => {
    if (!idSerie || !idInvestidor || !valorAlocado) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const valor = parseFloat(valorAlocado.replace(/[^\d,]/g, '').replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      toast.error('Valor inválido');
      return;
    }

    try {
      await createAlocacao.mutateAsync({
        id_serie: idSerie,
        id_investidor: idInvestidor,
        valor_alocado: valor,
        status,
      });
      
      toast.success('Investidor alocado com sucesso');
      onOpenChange(false);
      
      // Reset form
      setIdSerie('');
      setIdInvestidor('');
      setValorAlocado('');
      setStatus('reservado');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao alocar investidor');
    }
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const formatted = (parseInt(numbers || '0') / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    return formatted;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <SheetTitle>Nova Alocação</SheetTitle>
          </div>
        </SheetHeader>

        <div className="py-6 space-y-4">
          {/* Série */}
          <div className="space-y-2">
            <Label htmlFor="serie">Série *</Label>
            <Select value={idSerie} onValueChange={setIdSerie}>
              <SelectTrigger id="serie">
                <SelectValue placeholder="Selecione a série" />
              </SelectTrigger>
              <SelectContent>
                {series?.map((serie) => (
                  <SelectItem key={serie.id} value={serie.id}>
                    Série {serie.numero} - {formatCurrency(String(serie.valor_emissao || 0))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Investidor */}
          <div className="space-y-2">
            <Label htmlFor="investidor">Investidor *</Label>
            <Select value={idInvestidor} onValueChange={setIdInvestidor}>
              <SelectTrigger id="investidor">
                <SelectValue placeholder="Selecione o investidor" />
              </SelectTrigger>
              <SelectContent>
                {investidores?.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.nome} ({TIPO_INVESTIDOR_LABELS[inv.tipo_investidor]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {investidores?.length === 0 && (
              <p className="text-xs text-amber-600">
                Nenhum investidor cadastrado. Cadastre investidores primeiro.
              </p>
            )}
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="valor">Valor Alocado *</Label>
            <Input
              id="valor"
              placeholder="R$ 0,00"
              value={valorAlocado}
              onChange={(e) => setValorAlocado(formatCurrency(e.target.value))}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reservado">Reservado</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="liquidado">Liquidado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createAlocacao.isPending || !idSerie || !idInvestidor || !valorAlocado}
          >
            {createAlocacao.isPending ? 'Alocando...' : 'Alocar Investidor'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

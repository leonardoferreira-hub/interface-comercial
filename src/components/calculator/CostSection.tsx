import { Plus, DollarSign, Calendar, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CostRow, type CostItem } from './CostRow';

export type CostType = 'upfront' | 'anual' | 'mensal';

interface CostSectionProps {
  type: CostType;
  items: CostItem[];
  onChange: (items: CostItem[]) => void;
}

const sectionConfig = {
  upfront: {
    title: 'DESPESAS UP FRONT (FLAT)',
    icon: DollarSign,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  anual: {
    title: 'DESPESAS ANUAIS',
    icon: Calendar,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  mensal: {
    title: 'DESPESAS MENSAIS',
    icon: CalendarDays,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
};

export function CostSection({ type, items, onChange }: CostSectionProps) {
  const config = sectionConfig[type];
  const Icon = config.icon;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleItemChange = (index: number, item: CostItem) => {
    const updated = [...items];
    updated[index] = item;
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    onChange([
      ...items,
      {
        id: crypto.randomUUID(),
        prestador: '',
        valor: 0,
        grossUp: 0,
        valorBruto: 0,
        tipo: 'input',
      },
    ]);
  };

  const total = items.reduce((sum, item) => sum + item.valorBruto, 0);

  return (
    <Card className="border-0 card-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${config.bgColor} p-2 rounded-lg`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <CardTitle className="text-lg">{config.title}</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[250px]">Prestador do Serviço</TableHead>
                <TableHead className="w-[140px]">Valor (R$)</TableHead>
                <TableHead className="w-[100px]">Gross Up</TableHead>
                <TableHead className="w-[140px]">Valor Bruto</TableHead>
                <TableHead className="w-[100px]">Tipo</TableHead>
                <TableHead className="w-[80px] text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    Nenhuma despesa adicionada
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <CostRow
                    key={item.id}
                    item={item}
                    onChange={(updated) => handleItemChange(index, updated)}
                    onRemove={() => handleRemove(index)}
                  />
                ))
              )}
              {items.length > 0 && (
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell colSpan={2}></TableCell>
                  <TableCell className="text-primary font-bold">
                    {formatCurrency(total)}
                  </TableCell>
                  <TableCell>Auto</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export type { CostItem };

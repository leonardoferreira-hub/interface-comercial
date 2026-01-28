import { Plus, DollarSign, Calendar, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CostRow, type CostItem } from './CostRow';
import { CostCard } from './CostCard';
import { formatCurrency } from '@/utils/formatters';

export type CostType = 'upfront' | 'anual' | 'mensal';

interface CostSectionProps {
  type: CostType;
  items: CostItem[];
  onChange: (items: CostItem[]) => void;
  onItemSave?: (item: CostItem) => void;
  onItemDelete?: (id: string) => void;
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
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  mensal: {
    title: 'DESPESAS MENSAIS',
    icon: CalendarDays,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
};

export function CostSection({ type, items, onChange, onItemSave, onItemDelete }: CostSectionProps) {
  const config = sectionConfig[type];
  const Icon = config.icon;

  const handleItemChange = (index: number, item: CostItem) => {
    const updated = [...items];
    updated[index] = item;
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    const item = items[index];
    onChange(items.filter((_, i) => i !== index));
    if (onItemDelete && item.id && !item.id.startsWith('temp-')) {
      onItemDelete(item.id);
    }
  };

  const uuidv4 = () => {
    // browser-safe uuid
    return (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
  };

  const handleAdd = () => {
    onChange([
      ...items,
      {
        id: `temp-${uuidv4()}`,
        prestador: '',
        papel: '',
        valor: 0,
        grossUp: 0,
        valorBruto: 0,
        tipo: 'input',
        periodicidade: type === 'upfront' ? null : type,
      },
    ]);
  };

  const handleItemSave = (index: number, item: CostItem) => {
    handleItemChange(index, item);
    if (onItemSave) {
      onItemSave(item);
    }
  };

  const total = items.reduce((sum, item) => sum + item.valorBruto, 0);

  return (
    <Card className="border-0 shadow-sm">
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
        {/* Mobile: cards */}
        <div className="sm:hidden space-y-2">
          {items.length === 0 ? (
            <div className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">
              Nenhuma despesa adicionada
            </div>
          ) : (
            <>
              {items.map((item, index) => (
                <CostCard
                  key={item.id}
                  item={item}
                  onChange={(updated) => handleItemChange(index, updated)}
                  onRemove={() => handleRemove(index)}
                  onSave={(updated) => handleItemSave(index, updated)}
                />
              ))}

              <div className="rounded-xl border border-border bg-muted/30 p-3 flex items-center justify-between">
                <div className="text-sm font-semibold">TOTAL</div>
                <div className="text-sm font-bold text-primary tabular-nums">{formatCurrency(total)}</div>
              </div>
            </>
          )}
        </div>

        {/* Desktop/Tablet: table */}
        <div className="hidden sm:block rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[180px]">Papel</TableHead>
                <TableHead className="w-[200px]">Prestador do Serviço</TableHead>
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
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
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
                    onSave={(updated) => handleItemSave(index, updated)}
                  />
                ))
              )}
              {items.length > 0 && (
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell colSpan={2}>TOTAL</TableCell>
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

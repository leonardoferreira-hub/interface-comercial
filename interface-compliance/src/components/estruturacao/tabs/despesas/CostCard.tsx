import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/utils/formatters';
import type { CostItem } from './CostRow';

interface CostCardProps {
  item: CostItem;
  onChange: (item: CostItem) => void;
  onRemove: () => void;
  onSave?: (item: CostItem) => void;
}

export function CostCard({ item, onChange, onRemove, onSave }: CostCardProps) {
  const [isEditing, setIsEditing] = useState(!item.prestador || item.id?.startsWith('temp-'));
  const [editData, setEditData] = useState(item);

  const calculateValorBruto = (valor: number, grossUp: number) => {
    const grossUpDecimal = grossUp / 100;
    if (grossUpDecimal >= 1) return valor;
    return valor / (1 - grossUpDecimal);
  };

  const handleSave = () => {
    const valorBruto = calculateValorBruto(editData.valor, editData.grossUp);
    const updatedItem = { ...editData, valorBruto };
    onChange(updatedItem);
    setIsEditing(false);
    onSave?.(updatedItem);
  };

  const handleCancel = () => {
    setEditData(item);
    setIsEditing(false);
    if (!item.prestador || item.id?.startsWith('temp-')) {
      onRemove();
    }
  };

  const handleValorChange = (valor: number) => {
    const valorBruto = calculateValorBruto(valor, editData.grossUp);
    setEditData({ ...editData, valor, valorBruto });
  };

  const handleGrossUpChange = (grossUp: number) => {
    const valorBruto = calculateValorBruto(editData.valor, grossUp);
    setEditData({ ...editData, grossUp, valorBruto });
  };

  const tipoBadgeVariant = {
    input: 'outline' as const,
    calculado: 'secondary' as const,
    auto: 'default' as const,
  };

  if (isEditing) {
    return (
      <div className="rounded-xl border border-border bg-background p-3 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Despesa</div>
            <div className="text-sm font-medium truncate">{editData.papel || '—'}</div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave}>
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancel}>
              <X className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2">
          <Input
            value={editData.papel || ''}
            onChange={(e) => setEditData({ ...editData, papel: e.target.value })}
            placeholder="Papel (ex.: Agente Fiduciário)"
            className="h-10"
          />

          <Input
            value={editData.prestador}
            onChange={(e) => setEditData({ ...editData, prestador: e.target.value })}
            placeholder="Prestador do serviço"
            className="h-10"
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Valor</div>
              <CurrencyInput value={editData.valor} onChange={handleValorChange} className="h-10" />
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">Gross Up (%)</div>
              <Input
                type="number"
                value={editData.grossUp}
                onChange={(e) => handleGrossUpChange(Number(e.target.value))}
                className="h-10"
                min={0}
                max={100}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2">
            <div className="text-xs text-muted-foreground">Valor bruto</div>
            <div className="text-sm font-semibold tabular-nums">{formatCurrency(editData.valorBruto)}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Tipo</div>
            <Select
              value={editData.tipo}
              onValueChange={(value: 'input' | 'calculado' | 'auto') => setEditData({ ...editData, tipo: value })}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="input">Input</SelectItem>
                <SelectItem value="calculado">Calculado</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium truncate">{item.papel || '—'}</div>
            <Badge variant={tipoBadgeVariant[item.tipo]} className="text-[11px]">
              {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
            </Badge>
          </div>
          <div className="mt-1 text-xs text-muted-foreground truncate">{item.prestador || '—'}</div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-muted/40 p-2">
          <div className="text-[11px] text-muted-foreground">Valor</div>
          <div className="text-sm font-semibold tabular-nums">{formatCurrency(item.valor)}</div>
        </div>
        <div className="rounded-lg bg-muted/40 p-2">
          <div className="text-[11px] text-muted-foreground">Gross Up</div>
          <div className="text-sm font-semibold tabular-nums">{item.grossUp.toFixed(2)}%</div>
        </div>
        <div className="rounded-lg bg-muted/40 p-2">
          <div className="text-[11px] text-muted-foreground">Bruto</div>
          <div className="text-sm font-semibold tabular-nums">{formatCurrency(item.valorBruto)}</div>
        </div>
      </div>
    </div>
  );
}

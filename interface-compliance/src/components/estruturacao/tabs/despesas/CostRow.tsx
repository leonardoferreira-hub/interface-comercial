import { Pencil, Trash2, Check, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatters';

export interface CostItem {
  id: string;
  prestador: string;
  valor: number;
  grossUp: number;
  valorBruto: number;
  tipo: 'input' | 'calculado' | 'auto';
  /** origem de persistência: manual (usuário) vs auto (recalculo) */
  origem?: 'manual' | 'auto';
  // Campos adicionais para integração com Supabase
  id_prestador?: string | null;
  papel?: string;
  periodicidade?: string | null;
}

interface CostRowProps {
  item: CostItem;
  onChange: (item: CostItem) => void;
  onRemove: () => void;
  onSave?: (item: CostItem) => void;
}

export function CostRow({ item, onChange, onRemove, onSave }: CostRowProps) {
  const [isEditing, setIsEditing] = useState(!item.prestador || item.id?.startsWith('temp-'));
  const [editData, setEditData] = useState(item);

  const calculateValorBruto = (valor: number, grossUp: number) => {
    const grossUpDecimal = grossUp / 100;
    // Proteção: se grossUp >= 100%, retorna o valor original
    if (grossUpDecimal >= 1) return valor;
    return valor / (1 - grossUpDecimal);
  };

  const handleSave = () => {
    const valorBruto = calculateValorBruto(editData.valor, editData.grossUp);
    const updatedItem = { ...editData, valorBruto };
    onChange(updatedItem);
    setIsEditing(false);
    if (onSave) {
      onSave(updatedItem);
    }
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
      <TableRow>
        <TableCell>
          <Input
            value={editData.papel || ''}
            onChange={(e) => setEditData({ ...editData, papel: e.target.value })}
            placeholder="Papel"
            className="h-8"
          />
        </TableCell>
        <TableCell>
          <Input
            value={editData.prestador}
            onChange={(e) => setEditData({ ...editData, prestador: e.target.value })}
            placeholder="Nome do prestador"
            className="h-8"
          />
        </TableCell>
        <TableCell>
          <CurrencyInput
            value={editData.valor}
            onChange={handleValorChange}
            className="h-8"
          />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={editData.grossUp}
              onChange={(e) => handleGrossUpChange(Number(e.target.value))}
              className="h-8 w-16"
              min={0}
              max={100}
            />
            <span className="text-muted-foreground">%</span>
          </div>
        </TableCell>
        <TableCell className="font-medium">
          {formatCurrency(editData.valorBruto)}
        </TableCell>
        <TableCell>
          <Select
            value={editData.tipo}
            onValueChange={(value: 'input' | 'calculado' | 'auto') =>
              setEditData({ ...editData, tipo: value })
            }
          >
            <SelectTrigger className="h-8 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="input">Input</SelectItem>
              <SelectItem value="calculado">Calculado</SelectItem>
              <SelectItem value="auto">Auto</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSave}>
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancel}>
              <X className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell className="text-muted-foreground">{item.papel || '-'}</TableCell>
      <TableCell className="font-medium">{item.prestador}</TableCell>
      <TableCell>{formatCurrency(item.valor)}</TableCell>
      <TableCell>{item.grossUp.toFixed(2)}%</TableCell>
      <TableCell className="font-medium">{formatCurrency(item.valorBruto)}</TableCell>
      <TableCell>
        <Badge variant={tipoBadgeVariant[item.tipo]} className="text-xs">
          {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

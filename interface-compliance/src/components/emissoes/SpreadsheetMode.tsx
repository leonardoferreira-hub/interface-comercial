import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Emissao, 
  StatusEmissao, 
  STATUS_LABELS,
  TipoEmissao 
} from '@/types';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { Save, X } from 'lucide-react';

interface SpreadsheetModeProps {
  emissoes: Emissao[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onSave: (changes: Partial<Emissao>[]) => void;
  onCancel: () => void;
}

const STATUS_OPTIONS: StatusEmissao[] = [
  'em_estruturacao',
  'em_analise',
  'aguardando_documentos',
  'em_registro',
  'registrado',
];

const TIPO_OPTIONS: TipoEmissao[] = ['CRI', 'CRA', 'CR', 'FIDC', 'FII', 'FIAGRO', 'DEBENTURE'];

export function SpreadsheetMode({
  emissoes,
  selectedIds,
  onSelectionChange,
  onSave,
  onCancel,
}: SpreadsheetModeProps) {
  const [editedData, setEditedData] = useState<Record<string, Partial<Emissao>>>({});

  const handleFieldChange = (id: string, field: keyof Emissao, value: unknown) => {
    setEditedData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        id,
        [field]: value,
      },
    }));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === emissoes.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(emissoes.map((e) => e.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSave = () => {
    const changes = Object.values(editedData);
    onSave(changes);
  };

  const hasChanges = Object.keys(editedData).length > 0;

  const getValue = (emissao: Emissao, field: keyof Emissao) => {
    if (editedData[emissao.id]?.[field] !== undefined) {
      return editedData[emissao.id][field];
    }
    return emissao[field];
  };

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Modo Planilha - {emissoes.length} registros
          </span>
          {hasChanges && (
            <span className="text-sm text-yellow-600">
              ({Object.keys(editedData).length} alteração(ões))
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-1" />
            Salvar Alterações
          </Button>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="border rounded-lg overflow-auto max-h-[600px]">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0 z-10">
            <tr>
              <th className="p-2 w-10">
                <Checkbox
                  checked={selectedIds.length === emissoes.length}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th className="p-2 text-left font-medium">Código</th>
              <th className="p-2 text-left font-medium min-w-[200px]">Nome</th>
              <th className="p-2 text-left font-medium w-28">Tipo</th>
              <th className="p-2 text-left font-medium w-40">Status</th>
              <th className="p-2 text-left font-medium min-w-[150px]">Originador</th>
              <th className="p-2 text-right font-medium w-32">Valor Total</th>
              <th className="p-2 text-left font-medium w-32">Data Emissão</th>
            </tr>
          </thead>
          <tbody>
            {emissoes.map((emissao) => {
              const isEdited = !!editedData[emissao.id];
              return (
                <tr
                  key={emissao.id}
                  className={cn(
                    'border-b hover:bg-muted/50',
                    isEdited && 'bg-yellow-50'
                  )}
                >
                  <td className="p-2">
                    <Checkbox
                      checked={selectedIds.includes(emissao.id)}
                      onCheckedChange={() => handleSelectOne(emissao.id)}
                    />
                  </td>
                  <td className="p-2 font-mono text-xs">
                    {emissao.codigo}
                  </td>
                  <td className="p-2">
                    <Input
                      value={getValue(emissao, 'nome') as string}
                      onChange={(e) => handleFieldChange(emissao.id, 'nome', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="p-2">
                    <Select
                      value={getValue(emissao, 'tipo') as string}
                      onValueChange={(value) => handleFieldChange(emissao.id, 'tipo', value)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPO_OPTIONS.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Select
                      value={getValue(emissao, 'status') as string}
                      onValueChange={(value) => handleFieldChange(emissao.id, 'status', value)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Input
                      value={getValue(emissao, 'originador') as string}
                      onChange={(e) => handleFieldChange(emissao.id, 'originador', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="p-2 text-right font-mono text-xs">
                    {formatCurrency(emissao.valor_total)}
                  </td>
                  <td className="p-2">
                    <Input
                      type="date"
                      value={getValue(emissao, 'data_emissao') as string || ''}
                      onChange={(e) => handleFieldChange(emissao.id, 'data_emissao', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

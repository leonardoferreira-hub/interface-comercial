import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ArrowUpDown, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  FileText,
  AlertTriangle
} from 'lucide-react';
import { Emissao } from '@/types';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface EmissaoTableProps {
  emissoes: Emissao[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onRowClick: (emissao: Emissao) => void;
  onEdit?: (emissao: Emissao) => void;
}

type SortField = 'codigo' | 'nome' | 'tipo' | 'status' | 'valor_total' | 'originador' | 'data_emissao';
type SortDirection = 'asc' | 'desc';

export function EmissaoTable({
  emissoes,
  selectedIds,
  onSelectionChange,
  onRowClick,
  onEdit,
}: EmissaoTableProps) {
  const [sortField, setSortField] = useState<SortField>('codigo');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedEmissoes = [...emissoes].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'codigo':
        comparison = a.codigo.localeCompare(b.codigo);
        break;
      case 'nome':
        comparison = a.nome.localeCompare(b.nome);
        break;
      case 'tipo':
        comparison = a.tipo.localeCompare(b.tipo);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'valor_total':
        comparison = a.valor_total - b.valor_total;
        break;
      case 'originador':
        comparison = a.originador.localeCompare(b.originador);
        break;
      case 'data_emissao':
        comparison = (a.data_emissao || '').localeCompare(b.data_emissao || '');
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const allSelected = emissoes.length > 0 && selectedIds.length === emissoes.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < emissoes.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(emissoes.map(e => e.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) {
                    (el as unknown as HTMLInputElement).indeterminate = someSelected;
                  }
                }}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>
              <SortableHeader field="codigo">Código</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader field="nome">Nome</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader field="tipo">Tipo</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader field="status">Status</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader field="originador">Originador</SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader field="valor_total">Valor Total</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader field="data_emissao">Emissão</SortableHeader>
            </TableHead>
            <TableHead className="w-12">Pend.</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEmissoes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-24 text-center">
                Nenhuma emissão encontrada.
              </TableCell>
            </TableRow>
          ) : (
            sortedEmissoes.map((emissao) => (
              <TableRow
                key={emissao.id}
                className={cn(
                  'cursor-pointer',
                  selectedIds.includes(emissao.id) && 'bg-muted/50'
                )}
                onClick={() => onRowClick(emissao)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.includes(emissao.id)}
                    onCheckedChange={() => handleSelectOne(emissao.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{emissao.codigo}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={emissao.nome}>
                  {emissao.nome}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{emissao.tipo}</Badge>
                </TableCell>
                <TableCell>
                  <StatusBadge status={emissao.status} />
                </TableCell>
                <TableCell>{emissao.originador}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(emissao.valor_total)}
                </TableCell>
                <TableCell>{formatDate(emissao.data_emissao)}</TableCell>
                <TableCell>
                  {emissao.pendencias_count && emissao.pendencias_count > 0 ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {emissao.pendencias_count}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onRowClick(emissao)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(emissao)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        Exportar PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

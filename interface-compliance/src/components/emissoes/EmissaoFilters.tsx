import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, X } from 'lucide-react';
import { 
  TipoEmissao, 
  StatusEmissao, 
  FilterState,
  STATUS_LABELS 
} from '@/types';

const TIPOS: TipoEmissao[] = ['CRI', 'CRA', 'CR', 'FIDC', 'FII', 'FIAGRO', 'DEBENTURE'];
const STATUS: StatusEmissao[] = [
  'em_estruturacao',
  'em_analise',
  'aguardando_documentos',
  'em_registro',
  'registrado',
];

interface EmissaoFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  originadores: string[];
}

export function EmissaoFilters({ filters, onFiltersChange, originadores }: EmissaoFiltersProps) {
  const activeFiltersCount = 
    (filters.tipo?.length || 0) + 
    (filters.status?.length || 0) + 
    (filters.originador?.length || 0);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleTipoToggle = (tipo: TipoEmissao) => {
    const current = filters.tipo || [];
    const updated = current.includes(tipo)
      ? current.filter(t => t !== tipo)
      : [...current, tipo];
    onFiltersChange({ ...filters, tipo: updated.length > 0 ? updated : undefined });
  };

  const handleStatusToggle = (status: StatusEmissao) => {
    const current = filters.status || [];
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    onFiltersChange({ ...filters, status: updated.length > 0 ? updated : undefined });
  };

  const handleOriginadorChange = (value: string) => {
    if (value === 'all') {
      onFiltersChange({ ...filters, originador: undefined });
    } else {
      onFiltersChange({ ...filters, originador: [value] });
    }
  };

  const clearFilters = () => {
    onFiltersChange({ search: '' });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por código, nome..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tipo Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            Tipo
            {filters.tipo?.length ? (
              <Badge variant="secondary" className="ml-1 px-1.5">
                {filters.tipo.length}
              </Badge>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-3">
          <div className="space-y-2">
            {TIPOS.map((tipo) => (
              <label
                key={tipo}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={filters.tipo?.includes(tipo) || false}
                  onCheckedChange={() => handleTipoToggle(tipo)}
                />
                <span className="text-sm">{tipo}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Status Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            Status
            {filters.status?.length ? (
              <Badge variant="secondary" className="ml-1 px-1.5">
                {filters.status.length}
              </Badge>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3">
          <div className="space-y-2">
            {STATUS.map((status) => (
              <label
                key={status}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={filters.status?.includes(status) || false}
                  onCheckedChange={() => handleStatusToggle(status)}
                />
                <span className="text-sm">{STATUS_LABELS[status]}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Originador Filter */}
      <Select
        value={filters.originador?.[0] || 'all'}
        onValueChange={handleOriginadorChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Originador" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos originadores</SelectItem>
          {originadores.map((orig) => (
            <SelectItem key={orig} value={orig}>
              {orig}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="gap-1 text-muted-foreground"
        >
          <X className="h-4 w-4" />
          Limpar ({activeFiltersCount})
        </Button>
      )}
    </div>
  );
}

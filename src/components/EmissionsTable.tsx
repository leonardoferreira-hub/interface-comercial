import { Eye, Edit, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from './StatusBadge';
import type { Emissao } from '@/lib/supabase';

interface EmissionsTableProps {
  emissoes: Emissao[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onExport: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  DEB: 'bg-blue-100 text-blue-700',
  CRA: 'bg-green-100 text-green-700',
  CRI: 'bg-purple-100 text-purple-700',
  NC: 'bg-amber-100 text-amber-700',
  CR: 'bg-rose-100 text-rose-700',
};

export function EmissionsTable({ emissoes, onView, onEdit, onExport }: EmissionsTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-card rounded-xl card-shadow overflow-hidden border-0">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">Número</TableHead>
            <TableHead className="font-semibold">Demandante</TableHead>
            <TableHead className="font-semibold">Categoria</TableHead>
            <TableHead className="font-semibold text-right">Volume</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Data</TableHead>
            <TableHead className="font-semibold text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {emissoes.map((emissao, index) => (
            <TableRow
              key={emissao.id}
              className="animate-fade-in cursor-pointer hover:bg-muted/30 transition-colors"
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => onView(emissao.id)}
            >
              <TableCell className="font-medium text-primary">{emissao.numero_emissao}</TableCell>
              <TableCell>{emissao.demandante_proposta}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${categoryColors[emissao.categoria] || 'bg-gray-100 text-gray-700'}`}>
                  {emissao.categoria}
                </span>
              </TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(emissao.volume)}</TableCell>
              <TableCell>
                <StatusBadge status={emissao.status_proposta} />
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(emissao.data_criacao)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" onClick={() => onView(emissao.id)} className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(emissao.id)} className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onExport(emissao.id)} className="h-8 w-8">
                    <FileDown className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

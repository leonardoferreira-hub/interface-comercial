import { Eye, Edit, FileDown, MoreHorizontal, Send, Check, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StatusBadge } from './StatusBadge';
import { finalizarProposta, type Emissao } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface EmissionsTableProps {
  emissoes: Emissao[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onExport: (id: string) => void;
  onStatusChange?: () => void;
}

const categoryColors: Record<string, string> = {
  DEB: 'bg-blue-100 text-blue-700',
  CRA: 'bg-green-100 text-green-700',
  CRI: 'bg-purple-100 text-purple-700',
  NC: 'bg-amber-100 text-amber-700',
  CR: 'bg-rose-100 text-rose-700',
};

const statusActions: Record<string, { label: string; nextStatus: string; icon: React.ReactNode }[]> = {
  rascunho: [
    { label: 'Marcar como Enviada', nextStatus: 'enviada', icon: <Send className="h-4 w-4 mr-2" /> },
  ],
  enviada: [
    { label: 'Marcar como Aceita', nextStatus: 'aceita', icon: <Check className="h-4 w-4 mr-2" /> },
    { label: 'Marcar como Rejeitada', nextStatus: 'rejeitada', icon: <X className="h-4 w-4 mr-2" /> },
  ],
  aceita: [
    // Fluxo automático: emissão vai para estruturação automaticamente via trigger
    // quando o compliance aprovar o CNPJ e o status for 'aceita'
  ],
  rejeitada: [
    { label: 'Reabrir como Rascunho', nextStatus: 'rascunho', icon: <RotateCcw className="h-4 w-4 mr-2" /> },
  ],
  em_estruturacao: [],
};

export function EmissionsTable({ emissoes, onView, onEdit, onExport, onStatusChange }: EmissionsTableProps) {
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const handleStatusChange = async (emissaoId: string, nextStatus: string) => {
    setUpdatingId(emissaoId);
    try {
      await finalizarProposta(emissaoId, nextStatus);
      toast({
        title: 'Status atualizado!',
        description: `Proposta atualizada para "${nextStatus}".`,
      });
      onStatusChange?.();
    } catch (error) {
      toast({
        title: 'Erro ao atualizar status',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
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
          {emissoes.map((emissao, index) => {
            const actions = statusActions[emissao.status_proposta] || [];
            const isUpdating = updatingId === emissao.id;

            return (
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
                    <Button variant="ghost" size="icon" onClick={() => onView(emissao.id)} className="h-8 w-8" title="Visualizar">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(emissao.id)} className="h-8 w-8" title="Editar">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isUpdating}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onExport(emissao.id)}>
                          <FileDown className="h-4 w-4 mr-2" />
                          Exportar PDF
                        </DropdownMenuItem>
                        {actions.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            {actions.map((action) => (
                              <DropdownMenuItem
                                key={action.nextStatus}
                                onClick={() => handleStatusChange(emissao.id, action.nextStatus)}
                              >
                                {action.icon}
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

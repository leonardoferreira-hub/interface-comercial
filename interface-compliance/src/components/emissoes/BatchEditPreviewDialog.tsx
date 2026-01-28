import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Emissao, STATUS_LABELS } from '@/types';
import { AlertTriangle } from 'lucide-react';

interface BatchEditPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changes: Partial<Emissao>[];
  emissoes: Emissao[];
  onConfirm: () => void;
}

export function BatchEditPreviewDialog({
  open,
  onOpenChange,
  changes,
  emissoes,
  onConfirm,
}: BatchEditPreviewDialogProps) {
  const getEmissaoById = (id: string) => emissoes.find((e) => e.id === id);

  const getChangedFields = (change: Partial<Emissao>) => {
    const emissao = getEmissaoById(change.id!);
    if (!emissao) return [];

    const fields: { field: string; from: string; to: string }[] = [];

    if (change.nome && change.nome !== emissao.nome) {
      fields.push({ field: 'Nome', from: emissao.nome, to: change.nome });
    }
    if (change.tipo && change.tipo !== emissao.tipo) {
      fields.push({ field: 'Tipo', from: emissao.tipo, to: change.tipo });
    }
    if (change.status && change.status !== emissao.status) {
      fields.push({
        field: 'Status',
        from: STATUS_LABELS[emissao.status],
        to: STATUS_LABELS[change.status],
      });
    }
    if (change.originador && change.originador !== emissao.originador) {
      fields.push({ field: 'Originador', from: emissao.originador, to: change.originador });
    }
    if (change.data_emissao && change.data_emissao !== emissao.data_emissao) {
      fields.push({
        field: 'Data Emissão',
        from: emissao.data_emissao || '-',
        to: change.data_emissao,
      });
    }

    return fields;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Confirmar Alterações em Lote
          </DialogTitle>
          <DialogDescription>
            Revise as alterações antes de salvar. Esta ação afetará {changes.length} registro(s).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {changes.map((change) => {
            const emissao = getEmissaoById(change.id!);
            const changedFields = getChangedFields(change);

            if (!emissao || changedFields.length === 0) return null;

            return (
              <div key={change.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">{emissao.codigo}</Badge>
                  <span className="text-sm text-muted-foreground truncate">
                    {emissao.nome}
                  </span>
                </div>
                <div className="space-y-2">
                  {changedFields.map((field, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="font-medium w-24">{field.field}:</span>
                      <span className="text-red-600 line-through">{field.from}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-green-600">{field.to}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>
            Confirmar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

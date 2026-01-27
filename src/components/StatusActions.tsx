import { Check, X, Play, RotateCcw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { finalizarProposta } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface StatusActionsProps {
  currentStatus: string;
  emissaoId: string;
  onStatusChange: () => void;
  onOpenEnvioDialog?: () => void;
}

const statusTransitions: Record<string, { label: string; nextStatus: string; icon: React.ReactNode; variant?: 'default' | 'outline' | 'destructive' }[]> = {
rascunho: [
    { label: 'Enviar Proposta', nextStatus: 'open_dialog', icon: <Send className="h-4 w-4 mr-2" />, variant: 'default' },
    { label: 'Marcar como Aceita', nextStatus: 'aceita', icon: <Check className="h-4 w-4 mr-2" />, variant: 'outline' },
  ],
  enviada: [
    { label: 'Marcar como Aceita', nextStatus: 'aceita', icon: <Check className="h-4 w-4 mr-2" />, variant: 'default' },
    { label: 'Marcar como Rejeitada', nextStatus: 'rejeitada', icon: <X className="h-4 w-4 mr-2" />, variant: 'destructive' },
  ],
  aceita: [
    { label: 'Iniciar Estruturação', nextStatus: 'em_estruturacao', icon: <Play className="h-4 w-4 mr-2" />, variant: 'default' },
  ],
  rejeitada: [
    { label: 'Reabrir como Rascunho', nextStatus: 'rascunho', icon: <RotateCcw className="h-4 w-4 mr-2" />, variant: 'outline' },
  ],
  em_estruturacao: [],
};

export function StatusActions({ currentStatus, emissaoId, onStatusChange, onOpenEnvioDialog }: StatusActionsProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const actions = statusTransitions[currentStatus] || [];

  const handleStatusChange = async (nextStatus: string) => {
    if (nextStatus === 'open_dialog') {
      onOpenEnvioDialog?.();
      return;
    }

    setIsUpdating(true);
    try {
      const res: any = await finalizarProposta(emissaoId, nextStatus);

      if (res?.success === false) {
        throw new Error(res?.error || 'Falha ao atualizar status');
      }

      toast({
        title: 'Status atualizado!',
        description: `Proposta atualizada para "${nextStatus}".`,
      });
      onStatusChange();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action.nextStatus}
          variant={action.variant || 'default'}
          onClick={() => handleStatusChange(action.nextStatus)}
          disabled={isUpdating}
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
    </div>
  );
}

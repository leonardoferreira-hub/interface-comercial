interface StatusBadgeProps {
  status: string;
}

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  aceita: 'Aceita',
  rejeitada: 'Rejeitada',
  estruturando: 'Estruturando',
  estruturada: 'Estruturada',
  liquidada: 'Liquidada',
  arquivada: 'Arquivada',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = statusLabels[status] || status;
  const statusClass = `status-${status}`;

  return (
    <span className={`status-badge ${statusClass}`}>
      {label}
    </span>
  );
}

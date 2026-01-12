interface StatusBadgeProps {
  status: string;
}

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  aceita: 'Aceita',
  rejeitada: 'Rejeitada',
  em_estruturacao: 'Em Estruturação',
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

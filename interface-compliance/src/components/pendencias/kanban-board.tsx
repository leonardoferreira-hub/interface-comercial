import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { KanbanCard } from './kanban-card';
import { KanbanColumn } from './kanban-column';

interface Pendencia {
  id: string;
  operacao: {
    numero_emissao: string;
    nome_operacao: string;
    volume: number;
  };
  mapa_liquidacao: 'ok' | 'nok' | 'pendente';
  mapa_registros: 'ok' | 'nok' | 'pendente';
  lo_status: 'ok' | 'nok' | 'pendente';
  due_diligence: 'ok' | 'nok' | 'pendente';
  envio_email_prestadores: 'ok' | 'nok' | 'pendente';
  passagem_bastao: 'ok' | 'nok' | 'pendente';
  kick_off: 'ok' | 'nok' | 'pendente';
  resolvida: boolean;
}

interface KanbanBoardProps {
  pendencias: Pendencia[];
  onUpdate: (id: string, campo: string, valor: string) => Promise<void>;
}

const COLUMNS = [
  { id: 'pendente', title: 'Pendente', color: 'yellow' },
  { id: 'em_andamento', title: 'Em Andamento', color: 'blue' },
  { id: 'ok', title: 'Concluído', color: 'green' },
];

export function KanbanBoard({ pendencias, onUpdate }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const pendenciaId = active.id as string;
    const campo = active.data.current?.campo;
    const novoStatus = over.id as string;

    if (campo && novoStatus) {
      await onUpdate(pendenciaId, campo, novoStatus);
    }

    setActiveId(null);
  };

  const getPendenciasPorStatus = (campo: string, status: string) => {
    return pendencias.filter((p) => p[campo as keyof Pendencia] === status);
  };

  // Campos de pendências
  const campos = [
    { id: 'mapa_liquidacao', label: 'Mapa de Liquidação' },
    { id: 'mapa_registros', label: 'Mapa de Registros' },
    { id: 'lo_status', label: 'LO Status' },
    { id: 'due_diligence', label: 'Due Diligence' },
    { id: 'envio_email_prestadores', label: 'E-mail Prestadores' },
    { id: 'passagem_bastao', label: 'Passagem de Bastão' },
    { id: 'kick_off', label: 'Kick-off' },
  ];

  return (
    <div className="space-y-8">
      {campos.map((campo) => (
        <Card key={campo.id}>
          <CardHeader>
            <CardTitle className="text-lg">{campo.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {COLUMNS.map((column) => {
                  const items = getPendenciasPorStatus(campo.id, column.id);
                  return (
                    <KanbanColumn
                      key={column.id}
                      id={column.id}
                      title={column.title}
                      color={column.color}
                      count={items.length}
                    >
                      <SortableContext
                        items={items.map((p) => `${p.id}-${campo.id}`)}
                        strategy={verticalListSortingStrategy}
                      >
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-2"
                        >
                          {items.map((pendencia) => (
                            <KanbanCard
                              key={`${pendencia.id}-${campo.id}`}
                              id={`${pendencia.id}-${campo.id}`}
                              pendencia={pendencia}
                              campo={campo.id}
                            />
                          ))}
                        </motion.div>
                      </SortableContext>
                    </KanbanColumn>
                  );
                })}
              </div>
              <DragOverlay>
                {activeId ? (
                  <div className="bg-card p-4 rounded-lg shadow-lg border opacity-80">
                    Movendo...
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

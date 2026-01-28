import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  count: number;
  children: React.ReactNode;
}

const colorClasses = {
  yellow: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
  blue: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
  green: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
};

export function KanbanColumn({ id, title, color, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-lg border-2 p-4 transition-all min-h-[200px]',
        colorClasses[color as keyof typeof colorClasses],
        isOver && 'ring-2 ring-primary'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">{title}</h3>
        <motion.span
          key={count}
          initial={{ scale: 1.5 }}
          animate={{ scale: 1 }}
          className="text-xs font-medium bg-background px-2 py-1 rounded-full"
        >
          {count}
        </motion.span>
      </div>
      {children}
    </div>
  );
}

import { AnimatePresence, motion } from 'framer-motion';
import { TaskItem } from './task-item';
import type { Task, TaskWithRelations } from '@/lib/types';

interface TaskListProps {
  tasks: TaskWithRelations[];
  emptyState: React.ReactNode;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onEditTask: (task: TaskWithRelations) => void;
  onDeleteTask: (taskId: string) => void;
  onPreviewTask: (task: TaskWithRelations) => void;
}

export function TaskList({
  tasks,
  emptyState,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onPreviewTask,
}: TaskListProps) {
  if (tasks.length === 0) {
    return <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">{emptyState}</div>;
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            layout
            transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 1 }}
          >
            <TaskItem
              task={task}
              labels={task.labels}
              onClick={() => onPreviewTask(task)}
              onToggleComplete={(completed) => onToggleComplete(task.id, completed)}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

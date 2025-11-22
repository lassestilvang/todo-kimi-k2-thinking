'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MoreVertical,
  Tag,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Task, Label, Priority } from '@/lib/types';

interface TaskItemProps {
  task: Task;
  labels?: Label[];
  onClick?: () => void;
  onToggleComplete: (completed: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const priorityColors: Record<Priority, string> = {
  high: 'text-red-500',
  medium: 'text-orange-500',
  low: 'text-blue-500',
  none: 'text-muted-foreground',
};

export function TaskItem({
  task,
  labels = [],
  onClick,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.completed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group relative flex items-start gap-3 rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md',
        task.completed && 'opacity-60',
      )}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={(checked) => onToggleComplete(checked as boolean)}
        className="mt-1"
      />

      <div className="flex-1 space-y-2" onClick={onClick}>
        <div className="flex items-start gap-2">
          <h3
            className={cn(
              'flex-1 cursor-pointer text-base font-medium leading-tight',
              task.completed && 'line-through text-muted-foreground',
            )}
          >
            {task.name}
          </h3>
          {isOverdue && (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {task.date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(task.date), 'MMM d')}</span>
            </div>
          )}
          
          {task.deadline && (
            <div className={cn(
              "flex items-center gap-1",
              isOverdue && "text-destructive font-medium"
            )}>
              <Clock className="h-3 w-3" />
              <span>Due {format(new Date(task.deadline), 'MMM d')}</span>
            </div>
          )}

          {task.estimate && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{task.estimate}</span>
            </div>
          )}

          {task.priority !== 'none' && (
            <Badge variant="outline" className={cn('capitalize', priorityColors[task.priority])}>
              {task.priority}
            </Badge>
          )}

          {labels.map((label) => (
            <Badge key={label.id} variant="outline" style={{ borderColor: label.color }}>
              <Tag className="mr-1 h-3 w-3" style={{ color: label.color }} />
              {label.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className={cn(
        'transition-opacity',
        isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                Edit task
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onToggleComplete(!task.completed)}>
              {task.completed ? 'Mark incomplete' : 'Mark complete'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                Delete task
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

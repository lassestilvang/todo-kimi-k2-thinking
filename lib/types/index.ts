export type Priority = 'high' | 'medium' | 'low' | 'none';

export type RecurrenceType = 
  | 'every_day' 
  | 'every_week' 
  | 'every_weekday' 
  | 'every_month' 
  | 'every_year' 
  | 'custom';

export interface List {
  id: string;
  name: string;
  color: string;
  emoji: string;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  listId: string;
  name: string;
  description: string | null;
  date: string | null;
  deadline: string | null;
  estimate: string | null; // HH:mm format
  actualTime: string | null; // HH:mm format
  priority: Priority;
  completed: boolean;
  completedAt: string | null;
  recurrence: RecurrenceType | null;
  recurrencePattern: string | null; // JSON string for custom recurrence
  parentTaskId: string | null; // For subtasks
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskLabel {
  taskId: string;
  labelId: string;
}

export interface Reminder {
  id: string;
  taskId: string;
  reminderTime: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface TaskLog {
  id: string;
  taskId: string;
  action: string;
  changes: string; // JSON string
  createdAt: string;
}

export interface TaskWithRelations extends Task {
  list?: List;
  labels?: Label[];
  reminders?: Reminder[];
  attachments?: Attachment[];
  subtasks?: Task[];
  logs?: TaskLog[];
}

export type ViewType = 'today' | 'next_7_days' | 'upcoming' | 'all' | 'list';

export interface FilterOptions {
  showCompleted: boolean;
  listId?: string;
  labelId?: string;
  priority?: Priority;
  searchQuery?: string;
}

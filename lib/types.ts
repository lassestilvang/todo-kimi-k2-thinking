export type Priority = 'high' | 'medium' | 'low' | 'none'
export type ViewType = 'today' | 'upcoming' | 'all' | 'next7days'
export type RecurringType = 'none' | 'daily' | 'weekly' | 'weekdays' | 'monthly' | 'yearly' | 'custom'

export interface List {
  id: string
  name: string
  icon: string
  color: string
  is_inbox: boolean
  created_at: number
  updated_at: number
}

export interface Label {
  id: string
  name: string
  icon: string
  color: string
  created_at: number
  updated_at: number
}

export interface Subtask {
  id: string
  task_id: string
  name: string
  completed: boolean
  completed_at: number | null
  created_at: number
  updated_at: number
}

export interface TaskLabel {
  task_id: string
  label_id: string
  created_at: number
}

export interface Task {
  id: string
  name: string
  description: string | null
  list_id: string
  date: number | null
  deadline: number | null
  reminders: string | null
  estimate: number | null
  actual_time: number | null
  priority: Priority
  recurring: RecurringType
  attachments: string | null
  completed: boolean
  completed_at: number | null
  created_at: number
  updated_at: number
  list_name?: string
  list_icon?: string
  list_color?: string
  labels?: Array<{
    id: string
    name: string
    icon: string
    color: string
  }>
  subtasks?: Subtask[]
}

export interface ActivityLog {
  id: string
  task_id: string
  action: string
  old_value: string | null
  new_value: string | null
  user_id: string
  created_at: number
}

export interface SearchResult extends Task {
  relevance: number
}

export interface CreateTaskData {
  name: string
  description?: string
  list_id: string
  date?: string
  deadline?: string
  reminders?: string
  estimate?: string
  priority: Priority
  recurring?: RecurringType
  labels?: string[]
}

export interface UpdateTaskData {
  name?: string
  description?: string
  list_id?: string
  date?: string | null
  deadline?: string | null
  reminders?: string | null
  estimate?: string | null
  priority?: Priority
  recurring?: RecurringType
  attachments?: string | null
  completed?: boolean
}

export interface CreateListData {
  name: string
  icon?: string
  color?: string
}

export interface CreateLabelData {
  name: string
  icon?: string
  color?: string
}
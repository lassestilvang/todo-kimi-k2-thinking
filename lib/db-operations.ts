import { getDatabase } from './database'
import {
  Task,
  List,
  Label,
  Subtask,
  ActivityLog,
  Priority,
  RecurringType,
  CreateTaskData,
  UpdateTaskData,
  CreateListData,
  CreateLabelData,
} from './types'
import { v4 as uuidv4 } from 'uuid'

const db = getDatabase()

export function getAllLists(): List[] {
  const stmt = db.query('SELECT * FROM lists ORDER BY is_inbox DESC, name ASC')
  return stmt.all() as List[]
}

export function getInboxList(): List | null {
  const stmt = db.query('SELECT * FROM lists WHERE is_inbox = 1')
  const result = stmt.get() as List | undefined
  return result || null
}

export function createList(data: CreateListData): List {
  const now = Date.now()
  const list: List = {
    id: uuidv4(),
    name: data.name,
    icon: data.icon || '📝',
    color: data.color || 'gray',
    is_inbox: 0,
    created_at: now,
    updated_at: now,
  }

  db.run(`
    INSERT INTO lists (id, name, icon, color, is_inbox, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [list.id, list.name, list.icon, list.color, list.is_inbox, list.created_at, list.updated_at])
  
  return list
}

export function deleteList(listId: string): void {
  db.run('DELETE FROM lists WHERE id = ? AND is_inbox = 0', [listId])
}

export function getAllLabels(): Label[] {
  const stmt = db.query('SELECT * FROM labels ORDER BY name ASC')
  return stmt.all() as Label[]
}

export function createLabel(data: CreateLabelData): Label {
  const now = Date.now()
  const label: Label = {
    id: uuidv4(),
    name: data.name,
    icon: data.icon || '🏷️',
    color: data.color || 'gray',
    created_at: now,
    updated_at: now,
  }

  db.run(`
    INSERT INTO labels (id, name, icon, color, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [label.id, label.name, label.icon, label.color, label.created_at, label.updated_at])
  
  return label
}

export function deleteLabel(labelId: string): void {
  db.run('DELETE FROM labels WHERE id = ?', [labelId])
}

export function getTasksByView(view: string, showCompleted: boolean = false): Task[] {
  let whereClause = 'WHERE 1=1'
  let params: any[] = []

  if (!showCompleted) {
    whereClause += ' AND tasks.completed = 0'
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTimestamp = today.getTime()
  const sevenDaysFromNow = todayTimestamp + 7 * 24 * 60 * 60 * 1000

  switch (view) {
    case 'today':
      whereClause += ' AND tasks.date = ?'
      params.push(todayTimestamp)
      break
    case 'next7days':
      whereClause += ' AND tasks.date >= ? AND tasks.date <= ?'
      params.push(todayTimestamp, sevenDaysFromNow)
      break
    case 'upcoming':
      whereClause += ' AND tasks.date >= ?'
      params.push(todayTimestamp)
      break
    case 'all':
      // No additional filtering needed
      break
    default:
      // Check if it's a list ID
      whereClause += ' AND tasks.list_id = ?'
      params.push(view)
  }

  const query = `
    SELECT 
      tasks.*,
      lists.name as list_name,
      lists.icon as list_icon,
      lists.color as list_color
    FROM tasks
    LEFT JOIN lists ON tasks.list_id = lists.id
    ${whereClause}
    ORDER BY 
      CASE 
        WHEN tasks.priority = 'high' THEN 1
        WHEN tasks.priority = 'medium' THEN 2
        WHEN tasks.priority = 'low' THEN 3
        ELSE 4
      END,
      COALESCE(tasks.date, 9999999999999) ASC,
      tasks.created_at DESC
  `

  const stmt = db.query(query)
  const tasks = stmt.all(...params) as Task[]

  // Load additional data for each task
  return tasks.map(task => {
    // Load labels
    const labelsStmt = db.query(`
      SELECT labels.* FROM labels
      INNER JOIN task_labels ON labels.id = task_labels.label_id
      WHERE task_labels.task_id = ?
      ORDER BY labels.name ASC
    `)
    
    // Load subtasks
    const subtasksStmt = db.query(`
      SELECT * FROM subtasks
      WHERE task_id = ?
      ORDER BY created_at ASC
    `)

    return {
      ...task,
      labels: labelsStmt.all(task.id),
      subtasks: subtasksStmt.all(task.id)
    }
  })
}

export function getOverdueTasksCount(): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTimestamp = today.getTime()

  const stmt = db.query(`
    SELECT COUNT(*) as count
    FROM tasks
    WHERE date < ? AND completed = 0
  `)
  
  const result = stmt.get(todayTimestamp) as { count: number }
  return result.count
}

export function createTask(data: CreateTaskData): Task {
  const now = Date.now()
  const inbox = getInboxList()
  
  if (!inbox) {
    throw new Error('Inbox list not found')
  }

  const task: Task = {
    id: uuidv4(),
    name: data.name,
    description: data.description || null,
    list_id: data.list_id || inbox.id,
    date: data.date ? new Date(data.date).getTime() : null,
    deadline: data.deadline ? new Date(data.deadline).getTime() : null,
    reminders: data.reminders || null,
    estimate: data.estimate ? parseTimeToMinutes(data.estimate) : null,
    actual_time: null,
    priority: data.priority || 'none',
    recurring: data.recurring || 'none',
    attachments: null,
    completed: false,
    completed_at: null,
    created_at: now,
    updated_at: now,
  }

  db.run(`
    INSERT INTO tasks (
      id, name, description, list_id, date, deadline, reminders, 
      estimate, actual_time, priority, recurring, attachments, 
      completed, completed_at, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    task.id, task.name, task.description, task.list_id,
    task.date, task.deadline, task.reminders,
    task.estimate, task.actual_time, task.priority, 
    task.recurring, task.attachments,
    task.completed ? 1 : 0, task.completed_at, task.created_at, task.updated_at
  ])

  // Add labels if provided
  if (data.labels && data.labels.length > 0) {
    data.labels.forEach(labelId => {
      db.run(`
        INSERT INTO task_labels (task_id, label_id, created_at)
        VALUES (?, ?, ?)
      `, [task.id, labelId, now])
    })
  }

  logActivity(task.id, 'created', null, JSON.stringify(task))
  return task
}

export function updateTask(taskId: string, data: UpdateTaskData): Task {
  const now = Date.now()
  const currentTask = getTaskById(taskId)
  
  if (!currentTask) {
    throw new Error('Task not found')
  }

  const updatedTask: Task = {
    ...currentTask,
    ...(data.name && { name: data.name }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.list_id && { list_id: data.list_id }),
    ...(data.date !== undefined && { date: data.date ? new Date(data.date).getTime() : null }),
    ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline).getTime() : null }),
    ...(data.reminders !== undefined && { reminders: data.reminders }),
    ...(data.estimate !== undefined && { estimate: data.estimate ? parseTimeToMinutes(data.estimate) : null }),
    ...(data.priority && { priority: data.priority }),
    ...(data.recurring && { recurring: data.recurring }),
    ...(data.attachments !== undefined && { attachments: data.attachments }),
    updated_at: now,
  }

  // Handle completion
  if (data.completed !== undefined && data.completed !== currentTask.completed) {
    updatedTask.completed = data.completed
    updatedTask.completed_at = data.completed ? now : null
  }

  db.run(`
    UPDATE tasks
    SET 
      name = ?, description = ?, list_id = ?, date = ?, deadline = ?, 
      reminders = ?, estimate = ?, priority = ?, recurring = ?, attachments = ?, 
      completed = ?, completed_at = ?, updated_at = ?
    WHERE id = ?
  `, [
    updatedTask.name, updatedTask.description, updatedTask.list_id,
    updatedTask.date, updatedTask.deadline, updatedTask.reminders,
    updatedTask.estimate, updatedTask.priority, updatedTask.recurring, 
    updatedTask.attachments,
    updatedTask.completed ? 1 : 0, updatedTask.completed_at, updatedTask.updated_at,
    taskId
  ])

  logActivity(taskId, 'updated', JSON.stringify(currentTask), JSON.stringify(updatedTask))
  return updatedTask
}

export function getTaskById(taskId: string): Task | null {
  const stmt = db.query(`
    SELECT 
      tasks.*,
      lists.name as list_name,
      lists.icon as list_icon,
      lists.color as list_color
    FROM tasks
    LEFT JOIN lists ON tasks.list_id = lists.id
    WHERE tasks.id = ?
  `)
  
  const task = stmt.get(taskId) as Task | undefined
  
  if (!task) return null

  // Load labels and subtasks for the task
  const labelsStmt = db.query(`
    SELECT labels.* FROM labels
    INNER JOIN task_labels ON labels.id = task_labels.label_id
    WHERE task_labels.task_id = ?
    ORDER BY labels.name ASC
  `)
  
  const subtasksStmt = db.query(`
    SELECT * FROM subtasks
    WHERE task_id = ?
    ORDER BY created_at ASC
  `)

  return {
    ...task,
    labels: labelsStmt.all(task.id),
    subtasks: subtasksStmt.all(task.id)
  }
}

export function deleteTask(taskId: string): void {
  const task = getTaskById(taskId)
  
  if (!task) {
    throw new Error('Task not found')
  }

  logActivity(taskId, 'deleted', JSON.stringify(task), null)
  
  db.run('DELETE FROM tasks WHERE id = ?', [taskId])
}

export function createSubtask(taskId: string, name: string): Subtask {
  const now = Date.now()
  const subtask: Subtask = {
    id: uuidv4(),
    task_id: taskId,
    name,
    completed: false,
    completed_at: null,
    created_at: now,
    updated_at: now,
  }

  db.run(`
    INSERT INTO subtasks (id, task_id, name, completed, completed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    subtask.id, subtask.task_id, subtask.name, 
    subtask.completed ? 1 : 0, subtask.completed_at, subtask.created_at, subtask.updated_at
  ])

  logActivity(taskId, 'subtask_added', null, JSON.stringify(subtask))
  return subtask
}

export function updateSubtask(subtaskId: string, completed: boolean): void {
  const now = Date.now()
  const completedAt = completed ? now : null

  db.run(`
    UPDATE subtasks
    SET completed = ?, completed_at = ?, updated_at = ?
    WHERE id = ?
  `, [completed ? 1 : 0, completedAt, now, subtaskId])

  const subtaskStmt = db.query('SELECT task_id FROM subtasks WHERE id = ?')
  const subtask = subtaskStmt.get(subtaskId) as { task_id: string } | undefined
  
  if (subtask) {
    logActivity(subtask.task_id, 'subtask_updated', null, JSON.stringify({ subtaskId, completed }))
  }
}

export function searchTasks(query: string): Task[] {
  if (!query.trim()) return []

  const searchTerm = `%${query.toLowerCase()}%`
  
  const stmt = db.query(`
    SELECT DISTINCT
      tasks.*,
      lists.name as list_name,
      lists.icon as list_icon,
      lists.color as list_color
    FROM tasks
    LEFT JOIN lists ON tasks.list_id = lists.id
    LEFT JOIN task_labels ON tasks.id = task_labels.task_id
    LEFT JOIN labels ON task_labels.label_id = labels.id
    WHERE (
      LOWER(tasks.name) LIKE ? OR
      LOWER(COALESCE(tasks.description, '')) LIKE ? OR
      LOWER(lists.name) LIKE ? OR
      LOWER(labels.name) LIKE ?
    )
    ORDER BY tasks.created_at DESC
    LIMIT 50
  `)

  const tasks = stmt.all(searchTerm, searchTerm, searchTerm, searchTerm) as Task[]
  
  // Load labels and subtasks for each task
  return tasks.map(task => {
    const labelsStmt = db.query(`
      SELECT labels.* FROM labels
      INNER JOIN task_labels ON labels.id = task_labels.label_id
      WHERE task_labels.task_id = ?
      ORDER BY labels.name ASC
    `)
    
    const subtasksStmt = db.query(`
      SELECT * FROM subtasks
      WHERE task_id = ?
      ORDER BY created_at ASC
    `)

    return {
      ...task,
      labels: labelsStmt.all(task.id),
      subtasks: subtasksStmt.all(task.id)
    }
  })
}

export function getRecentActivity(limit: number = 50): ActivityLog[] {
  const stmt = db.query(`
    SELECT * FROM activity_logs
    ORDER BY created_at DESC
    LIMIT ?
  `)
  
  return stmt.all(limit) as ActivityLog[]
}

function logActivity(taskId: string, action: string, oldValue: string | null, newValue: string | null): void {
  db.run(`
    INSERT INTO activity_logs (id, task_id, action, old_value, new_value, user_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [uuidv4(), taskId, action, oldValue, newValue, 'user', Date.now()])
}

function parseTimeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

export function formatTimeHHMM(minutes: number | null): string {
  if (minutes === null) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

export function formatDateForInput(timestamp: number | null): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toISOString().split('T')[0]
}

export function formatDateTimeForDisplay(timestamp: number | null): string {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString()
}
import db from '../db';
import { nanoid } from 'nanoid';
import type { Task, TaskWithRelations, TaskLog, Priority, RecurrenceType, Label } from '../types';

export function getAllTasks(): Task[] {
  return db.prepare(`
    SELECT 
      id, list_id as listId, name, description, date, deadline,
      estimate, actual_time as actualTime, priority, completed,
      completed_at as completedAt, recurrence, recurrence_pattern as recurrencePattern,
      parent_task_id as parentTaskId, position,
      created_at as createdAt, updated_at as updatedAt
    FROM tasks
    WHERE parent_task_id IS NULL
    ORDER BY position ASC, created_at DESC
  `).all() as Task[];
}

export function getTaskById(id: string): TaskWithRelations | undefined {
  const task = db.prepare(`
    SELECT 
      id, list_id as listId, name, description, date, deadline,
      estimate, actual_time as actualTime, priority, completed,
      completed_at as completedAt, recurrence, recurrence_pattern as recurrencePattern,
      parent_task_id as parentTaskId, position,
      created_at as createdAt, updated_at as updatedAt
    FROM tasks
    WHERE id = ?
  `).get(id) as Task | undefined;

  if (!task) return undefined;

  // Get labels
  const labels = db.prepare(`
    SELECT l.id, l.name, l.color, l.icon,
           l.created_at as createdAt, l.updated_at as updatedAt
    FROM labels l
    INNER JOIN task_labels tl ON l.id = tl.label_id
    WHERE tl.task_id = ?
  `).all(id) as Label[];

  // Get subtasks
  const subtasks = db.prepare(`
    SELECT 
      id, list_id as listId, name, description, date, deadline,
      estimate, actual_time as actualTime, priority, completed,
      completed_at as completedAt, recurrence, recurrence_pattern as recurrencePattern,
      parent_task_id as parentTaskId, position,
      created_at as createdAt, updated_at as updatedAt
    FROM tasks
    WHERE parent_task_id = ?
    ORDER BY position ASC
  `).all(id) as Task[];

  // Get reminders
  const reminders = db.prepare(`
    SELECT id, task_id as taskId, reminder_time as reminderTime, created_at as createdAt
    FROM reminders
    WHERE task_id = ?
  `).all(id);

  // Get attachments
  const attachments = db.prepare(`
    SELECT 
      id, task_id as taskId, file_name as fileName, file_url as fileUrl,
      file_size as fileSize, mime_type as mimeType, created_at as createdAt
    FROM attachments
    WHERE task_id = ?
  `).all(id);

  // Get logs
  const logs = db.prepare(`
    SELECT id, task_id as taskId, action, changes, created_at as createdAt
    FROM task_logs
    WHERE task_id = ?
    ORDER BY created_at DESC
  `).all(id) as TaskLog[];

  return {
    ...task,
    labels,
    subtasks,
    reminders,
    attachments,
    logs,
  };
}

export function getTasksByListId(listId: string): Task[] {
  return db.prepare(`
    SELECT 
      id, list_id as listId, name, description, date, deadline,
      estimate, actual_time as actualTime, priority, completed,
      completed_at as completedAt, recurrence, recurrence_pattern as recurrencePattern,
      parent_task_id as parentTaskId, position,
      created_at as createdAt, updated_at as updatedAt
    FROM tasks
    WHERE list_id = ? AND parent_task_id IS NULL
    ORDER BY position ASC, created_at DESC
  `).all(listId) as Task[];
}

export function getTasksByLabelId(labelId: string): Task[] {
  return db.prepare(`
    SELECT 
      t.id, t.list_id as listId, t.name, t.description, t.date, t.deadline,
      t.estimate, t.actual_time as actualTime, t.priority, t.completed,
      t.completed_at as completedAt, t.recurrence, t.recurrence_pattern as recurrencePattern,
      t.parent_task_id as parentTaskId, t.position,
      t.created_at as createdAt, t.updated_at as updatedAt
    FROM tasks t
    INNER JOIN task_labels tl ON t.id = tl.task_id
    WHERE tl.label_id = ? AND t.parent_task_id IS NULL
    ORDER BY t.date ASC, t.position ASC
  `).all(labelId) as Task[];
}

export function createTask(data: {
  listId: string;
  name: string;
  description?: string;
  date?: string;
  deadline?: string;
  priority?: Priority;
  parentTaskId?: string;
  estimate?: string;
  recurrence?: RecurrenceType;
  recurrencePattern?: string;
}): Task {
  const id = nanoid();
  const now = new Date().toISOString();

  // Get the max position for this list
  const maxPositionRow = db.prepare(`
    SELECT MAX(position) as maxPosition FROM tasks WHERE list_id = ?
  `).get(data.listId) as { maxPosition: number | null };
  const position = (maxPositionRow?.maxPosition ?? -1) + 1;

  db.prepare(`
    INSERT INTO tasks (
      id, list_id, name, description, date, deadline, 
      priority, parent_task_id, position, estimate, recurrence, recurrence_pattern,
      created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.listId,
    data.name,
    data.description ?? null,
    data.date ?? null,
    data.deadline ?? null,
    data.priority ?? 'none',
    data.parentTaskId ?? null,
    position,
    data.estimate ?? null,
    data.recurrence ?? null,
    data.recurrencePattern ?? null,
    now,
    now,
  );

  // Log the creation
  logTaskChange(id, 'created', { name: data.name });

  const task = db.prepare(`
    SELECT 
      id, list_id as listId, name, description, date, deadline,
      estimate, actual_time as actualTime, priority, completed,
      completed_at as completedAt, recurrence, recurrence_pattern as recurrencePattern,
      parent_task_id as parentTaskId, position,
      created_at as createdAt, updated_at as updatedAt
    FROM tasks
    WHERE id = ?
  `).get(id) as Task;

  return task;
}

export function updateTask(
  id: string,
  data: Partial<{
    name: string;
    description: string | null;
    date: string | null;
    deadline: string | null;
    priority: Priority;
    completed: boolean;
    listId: string;
    estimate: string | null;
    actualTime: string | null;
    recurrence: RecurrenceType | null;
    recurrencePattern: string | null;
    position: number;
  }>,
): Task {
  const oldTask = getTaskById(id);
  if (!oldTask) throw new Error('Task not found');

  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: unknown[] = [];
  const changes: Record<string, { old: unknown; new: unknown }> = {};

  if (data.name !== undefined && data.name !== oldTask.name) {
    updates.push('name = ?');
    values.push(data.name);
    changes.name = { old: oldTask.name, new: data.name };
  }
  if (data.description !== undefined && data.description !== oldTask.description) {
    updates.push('description = ?');
    values.push(data.description);
    changes.description = { old: oldTask.description, new: data.description };
  }
  if (data.date !== undefined && data.date !== oldTask.date) {
    updates.push('date = ?');
    values.push(data.date);
    changes.date = { old: oldTask.date, new: data.date };
  }
  if (data.deadline !== undefined && data.deadline !== oldTask.deadline) {
    updates.push('deadline = ?');
    values.push(data.deadline);
    changes.deadline = { old: oldTask.deadline, new: data.deadline };
  }
  if (data.priority !== undefined && data.priority !== oldTask.priority) {
    updates.push('priority = ?');
    values.push(data.priority);
    changes.priority = { old: oldTask.priority, new: data.priority };
  }
  if (data.listId !== undefined && data.listId !== oldTask.listId) {
    updates.push('list_id = ?');
    values.push(data.listId);
    changes.listId = { old: oldTask.listId, new: data.listId };
  }
  if (data.estimate !== undefined && data.estimate !== oldTask.estimate) {
    updates.push('estimate = ?');
    values.push(data.estimate);
    changes.estimate = { old: oldTask.estimate, new: data.estimate };
  }
  if (data.actualTime !== undefined && data.actualTime !== oldTask.actualTime) {
    updates.push('actual_time = ?');
    values.push(data.actualTime);
    changes.actualTime = { old: oldTask.actualTime, new: data.actualTime };
  }
  if (data.recurrence !== undefined && data.recurrence !== oldTask.recurrence) {
    updates.push('recurrence = ?');
    values.push(data.recurrence);
    changes.recurrence = { old: oldTask.recurrence, new: data.recurrence };
  }
  if (data.recurrencePattern !== undefined && data.recurrencePattern !== oldTask.recurrencePattern) {
    updates.push('recurrence_pattern = ?');
    values.push(data.recurrencePattern);
    changes.recurrencePattern = { old: oldTask.recurrencePattern, new: data.recurrencePattern };
  }
  if (data.position !== undefined && data.position !== oldTask.position) {
    updates.push('position = ?');
    values.push(data.position);
  }
  if (data.completed !== undefined && data.completed !== oldTask.completed) {
    updates.push('completed = ?');
    values.push(data.completed ? 1 : 0);
    if (data.completed) {
      updates.push('completed_at = ?');
      values.push(now);
    } else {
      updates.push('completed_at = NULL');
    }
    changes.completed = { old: oldTask.completed, new: data.completed };
  }

  if (updates.length === 0) {
    return oldTask;
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);

  db.prepare(`
    UPDATE tasks
    SET ${updates.join(', ')}
    WHERE id = ?
  `).run(...values);

  // Log the changes
  if (Object.keys(changes).length > 0) {
    logTaskChange(id, 'updated', changes);
  }

  const task = db.prepare(`
    SELECT 
      id, list_id as listId, name, description, date, deadline,
      estimate, actual_time as actualTime, priority, completed,
      completed_at as completedAt, recurrence, recurrence_pattern as recurrencePattern,
      parent_task_id as parentTaskId, position,
      created_at as createdAt, updated_at as updatedAt
    FROM tasks
    WHERE id = ?
  `).get(id) as Task;

  return task;
}

export function deleteTask(id: string): void {
  const task = getTaskById(id);
  if (task) {
    logTaskChange(id, 'deleted', { name: task.name });
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  }
}

export function addLabelToTask(taskId: string, labelId: string): void {
  try {
    db.prepare(`
      INSERT INTO task_labels (task_id, label_id)
      VALUES (?, ?)
    `).run(taskId, labelId);
    logTaskChange(taskId, 'label_added', { labelId });
  } catch (error) {
    // Ignore duplicate key errors
  }
}

export function removeLabelFromTask(taskId: string, labelId: string): void {
  db.prepare(`
    DELETE FROM task_labels
    WHERE task_id = ? AND label_id = ?
  `).run(taskId, labelId);
  logTaskChange(taskId, 'label_removed', { labelId });
}

export function addReminder(taskId: string, reminderTime: string): string {
  const id = nanoid();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO reminders (id, task_id, reminder_time, created_at)
    VALUES (?, ?, ?, ?)
  `).run(id, taskId, reminderTime, now);
  logTaskChange(taskId, 'reminder_added', { reminderTime });
  return id;
}

export function removeReminder(reminderId: string): void {
  const reminder = db.prepare('SELECT task_id FROM reminders WHERE id = ?').get(reminderId) as { task_id: string } | undefined;
  db.prepare('DELETE FROM reminders WHERE id = ?').run(reminderId);
  if (reminder) {
    logTaskChange(reminder.task_id, 'reminder_removed', { reminderId });
  }
}

function logTaskChange(taskId: string, action: string, changes: Record<string, unknown>): void {
  const id = nanoid();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO task_logs (id, task_id, action, changes, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, taskId, action, JSON.stringify(changes), now);
}

export function getTasksForToday(): Task[] {
  const today = new Date().toISOString().split('T')[0];
  return db.prepare(`
    SELECT 
      id, list_id as listId, name, description, date, deadline,
      estimate, actual_time as actualTime, priority, completed,
      completed_at as completedAt, recurrence, recurrence_pattern as recurrencePattern,
      parent_task_id as parentTaskId, position,
      created_at as createdAt, updated_at as updatedAt
    FROM tasks
    WHERE date = ? AND parent_task_id IS NULL
    ORDER BY position ASC, created_at DESC
  `).all(today) as Task[];
}

export function getTasksForNext7Days(): Task[] {
  const today = new Date();
  const next7Days = new Date(today);
  next7Days.setDate(today.getDate() + 7);
  
  const todayStr = today.toISOString().split('T')[0];
  const next7DaysStr = next7Days.toISOString().split('T')[0];
  
  return db.prepare(`
    SELECT 
      id, list_id as listId, name, description, date, deadline,
      estimate, actual_time as actualTime, priority, completed,
      completed_at as completedAt, recurrence, recurrence_pattern as recurrencePattern,
      parent_task_id as parentTaskId, position,
      created_at as createdAt, updated_at as updatedAt
    FROM tasks
    WHERE date >= ? AND date <= ? AND parent_task_id IS NULL
    ORDER BY date ASC, position ASC
  `).all(todayStr, next7DaysStr) as Task[];
}

export function getUpcomingTasks(): Task[] {
  const today = new Date().toISOString().split('T')[0];
  return db.prepare(`
    SELECT 
      id, list_id as listId, name, description, date, deadline,
      estimate, actual_time as actualTime, priority, completed,
      completed_at as completedAt, recurrence, recurrence_pattern as recurrencePattern,
      parent_task_id as parentTaskId, position,
      created_at as createdAt, updated_at as updatedAt
    FROM tasks
    WHERE date >= ? AND parent_task_id IS NULL
    ORDER BY date ASC, position ASC
  `).all(today) as Task[];
}

export function getOverdueTasks(): Task[] {
  const today = new Date().toISOString().split('T')[0];
  return db.prepare(`
    SELECT 
      id, list_id as listId, name, description, date, deadline,
      estimate, actual_time as actualTime, priority, completed,
      completed_at as completedAt, recurrence, recurrence_pattern as recurrencePattern,
      parent_task_id as parentTaskId, position,
      created_at as createdAt, updated_at as updatedAt
    FROM tasks
    WHERE (date < ? OR deadline < ?) AND completed = 0 AND parent_task_id IS NULL
    ORDER BY date ASC
  `).all(today, today) as Task[];
}

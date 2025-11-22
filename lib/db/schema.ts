import { getDb } from './client';

export function initializeDatabase() {
  const db = getDb();
  // Create Lists table
  db.exec(`
    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      emoji TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Create Labels table
  db.exec(`
    CREATE TABLE IF NOT EXISTS labels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Create Tasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      date TEXT,
      deadline TEXT,
      estimate TEXT,
      actual_time TEXT,
      priority TEXT NOT NULL DEFAULT 'none',
      completed INTEGER DEFAULT 0,
      completed_at TEXT,
      recurrence TEXT,
      recurrence_pattern TEXT,
      parent_task_id TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

  // Create TaskLabels junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_labels (
      task_id TEXT NOT NULL,
      label_id TEXT NOT NULL,
      PRIMARY KEY (task_id, label_id),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
    )
  `);

  // Create Reminders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      reminder_time TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

  // Create Attachments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

  // Create TaskLogs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_logs (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      action TEXT NOT NULL,
      changes TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_task_labels_label_id ON task_labels(label_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_reminders_task_id ON reminders(task_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON attachments(task_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id)`);

  // Insert default Inbox list if it doesn't exist
  const inbox = db.prepare('SELECT id FROM lists WHERE is_default = 1').get();
  if (!inbox) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('inbox', 'Inbox', '#6366f1', '📥', 1, now, now);
  }
}

export function resetDatabase() {
  const db = getDb();
  db.exec('DROP TABLE IF EXISTS task_logs');
  db.exec('DROP TABLE IF EXISTS attachments');
  db.exec('DROP TABLE IF EXISTS reminders');
  db.exec('DROP TABLE IF EXISTS task_labels');
  db.exec('DROP TABLE IF EXISTS tasks');
  db.exec('DROP TABLE IF EXISTS labels');
  db.exec('DROP TABLE IF EXISTS lists');
  initializeDatabase();
}

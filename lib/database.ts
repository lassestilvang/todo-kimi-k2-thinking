import { Database } from 'better-sqlite3';

let db: Database | null = null;

export function getDatabase(): Database {
  if (!db) {
    const Database = require('better-sqlite3');
    db = new Database('database.db');
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Initialize schema
    initializeSchema(db);
  }
  
  return db;
}

function initializeSchema(db: Database) {
  // Create lists table
  db.exec(`
    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '📝',
      color TEXT NOT NULL DEFAULT 'gray',
      is_inbox INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      
      UNIQUE(name)
    )
  `);

  // Create labels table
  db.exec(`
    CREATE TABLE IF NOT EXISTS labels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '🏷️',
      color TEXT NOT NULL DEFAULT 'gray',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      
      UNIQUE(name)
    )
  `);

  // Create tasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      list_id TEXT NOT NULL,
      date INTEGER,
      deadline INTEGER,
      reminders TEXT,
      estimate INTEGER,
      actual_time INTEGER,
      priority TEXT NOT NULL DEFAULT 'none',
      recurring TEXT,
      attachments TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      
      FOREIGN KEY(list_id) REFERENCES lists(id) ON DELETE CASCADE
    )
  `);

  // Create subtasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      name TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      
      FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

  // Create task_labels junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_labels (
      task_id TEXT NOT NULL,
      label_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      
      PRIMARY KEY(task_id, label_id),
      FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY(label_id) REFERENCES labels(id) ON DELETE CASCADE
    )
  `);

  // Create activity log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      action TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      user_id TEXT NOT NULL DEFAULT 'system',
      created_at INTEGER NOT NULL,
      
      FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_activity_logs_task_id ON activity_logs(task_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at)`);

  // Create default inbox list if it doesn't exist
  const inboxExists = db.prepare('SELECT id FROM lists WHERE is_inbox = 1').get();
  if (!inboxExists) {
    const now = Date.now();
    db.prepare(`
      INSERT INTO lists (id, name, icon, color, is_inbox, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'inbox',
      'Inbox',
      '📥',
      'blue',
      1,
      now,
      now
    );
  }
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
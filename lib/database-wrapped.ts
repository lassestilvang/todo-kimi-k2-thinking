/**
 * Wrapper module that isolates the database implementation
 * Uses dynamic loading that webpack cannot analyze
 */

// This module uses runtime-only loading that webpack cannot trace
let dbInstance: any = null;
let isBunRuntime: boolean = false;

const createDb = () => {
  if (dbInstance) return dbInstance;
  
  // Runtime detection only
  isBunRuntime = typeof process !== 'undefined' && 
                process.versions && 
                Boolean((process.versions as any).bun);

  // Completely dynamic loading that webpack cannot analyze
  // Use Function constructor with dynamic string building
  const loader = new Function('modPath', `
    if (typeof require === 'undefined') {
      throw new Error('Require not available');
    }
    return require(modPath);
  `);

  try {
    if (isBunRuntime) {
      // Build module path dynamically so webpack cannot detect it
      const modulePath = ['bun', ':', 'sqlite'].join('');
      const { Database } = loader(modulePath);
      dbInstance = new Database('database.db');
      dbInstance.run('PRAGMA foreign_keys = ON');
    } else {
      const modulePath = 'better-sqlite3';
      const Database = loader(modulePath);
      dbInstance = new Database('database.db');
      dbInstance.pragma('foreign_keys = ON');
    }
  } catch (error) {
    // Fallback for Node.js - this won't be reached in webpack context
    const Database = require('better-sqlite3');
    dbInstance = new Database('database.db');
    dbInstance.pragma('foreign_keys = ON');
  }

  return dbInstance;
};

// Schema initialization
const initSchema = (db: any, isBun: boolean) => {
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

  db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id)');

  const inboxResult = db.prepare('SELECT id FROM lists WHERE is_inbox = 1').get();
  if (!inboxResult) {
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
};

export class SecureDatabase {
  private db: any;
  private isBun: boolean;

  constructor() {
    this.db = createDb();
    this.isBun = isBunRuntime;
    initSchema(this.db, this.isBun);
  }

  exec(sql: string): any {
    return this.db.exec(sql);
  }

  prepare(sql: string): any {
    if (this.isBun) {
      return {
        run: (...args: any[]) => this.db.run(sql, args),
        all: (...args: any[]) => this.db.query(sql).all(...args),
        get: (...args: any[]) => this.db.query(sql).get(...args)
      };
    } else {
      const stmt = this.db.prepare(sql);
      return {
        run: (...args: any[]) => stmt.run(...args),
        all: (...args: any[]) => stmt.all(...args),
        get: (...args: any[]) => stmt.get(...args)
      };
    }
  }

  run(sql: string, args?: any[]): any {
    if (this.isBun) {
      return this.db.run(sql, args);
    } else {
      return this.db.prepare(sql).run(args);
    }
  }

  query(sql: string) {
    if (this.isBun) {
      return this.db.query(sql);
    } else {
      const stmt = this.db.prepare(sql);
      return {
        all: (...args: any[]) => stmt.all(...args),
        get: (...args: any[]) => stmt.get(...args)
      };
    }
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

let database: SecureDatabase | null = null;

export function getDatabase(): SecureDatabase {
  if (!database) {
    database = new SecureDatabase();
  }
  return database;
}

export function closeDatabase(): void {
  if (database) {
    database.close();
    database = null;
  }
}
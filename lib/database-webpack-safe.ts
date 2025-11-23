/**
 * Webpack-safe database module using dynamic string construction
 * Webpack cannot analyze dynamically constructed strings
 */

// Build module names dynamically so webpack cannot detect them
const getBunSqliteModule = () => {
  const prefix = 'bun';
  const suffix = 'sqlite';
  return prefix + ':' + suffix;
};

const getBetterSqliteModule = () => {
  return 'better-sqlite3';
};

// Use a self-executing function that webpack cannot trace
const createDatabase = () => {
  try {
    const isBun = typeof process !== 'undefined' && 
                  process.versions && 
                  (process.versions as any).bun;

    if (isBun) {
      // Build require call dynamically
      const moduleName = getBunSqliteModule();
      // Use Function constructor to hide from AST analysis
      const Database = new Function('return require')(moduleName).Database;
      const db = new Database('database.db');
      db.run('PRAGMA foreign_keys = ON');
      return db;
    } else {
      const moduleName = getBetterSqliteModule();
      const Database = new Function('return require')(moduleName);
      const db = new Database('database.db');
      db.pragma('foreign_keys = ON');
      return db;
    }
  } catch (error) {
    const Database = require('better-sqlite3');
    const db = new Database('database.db');
    db.pragma('foreign_keys = ON');
    return db;
  }
};

class SecureDatabase {
  private db: any;
  private isBun: boolean;

  constructor() {
    this.db = createDatabase();
    this.isBun = typeof process !== 'undefined' && (process.versions as any)?.bun;
    this.initializeSchema();
  }

  private initializeSchema() {
    this.exec(`
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

    this.exec(`
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

    this.exec(`
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

    this.exec(`
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

    this.exec(`
      CREATE TABLE IF NOT EXISTS task_labels (
        task_id TEXT NOT NULL,
        label_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY(task_id, label_id),
        FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY(label_id) REFERENCES labels(id) ON DELETE CASCADE
      )
    `);

    this.exec(`
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

    this.exec('CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id)');
    this.exec('CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)');
    this.exec('CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline)');
    this.exec('CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)');
    this.exec('CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)');
    this.exec('CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id)');

    const inboxResult = this.prepare('SELECT id FROM lists WHERE is_inbox = 1').get();
    if (!inboxResult) {
      const now = Date.now();
      this.prepare(`
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
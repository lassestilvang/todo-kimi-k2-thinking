// Unified database implementation that works with both bun:sqlite and better-sqlite3
// This avoids webpack bundling issues by using a single implementation

class UnifiedDatabase {
  private db: any
  private isBun: boolean

  constructor() {
    this.isBun = this.detectBunRuntime()
    this.initializeDatabase()
  }

  private detectBunRuntime(): boolean {
    try {
      return typeof process !== 'undefined' && (process.versions as any)?.bun !== undefined
    } catch {
      return false
    }
  }

  private initializeDatabase() {
    if (this.isBun) {
      // Use Bun's native SQLite
      const { Database } = require('bun:sqlite')
      this.db = new Database('database.db')
      this.db.run('PRAGMA foreign_keys = ON')
    } else {
      // Use better-sqlite3 for Node.js
      const Database = require('better-sqlite3')
      this.db = new Database('database.db')
      this.db.pragma('foreign_keys = ON')
    }
    
    this.initializeSchema()
  }

  private initializeSchema() {
    // Create lists table
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
    `)

    // Create labels table
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
    `)

    // Create tasks table
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
    `)

    // Create subtasks table
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
    `)

    // Create task_labels junction table
    this.exec(`
      CREATE TABLE IF NOT EXISTS task_labels (
        task_id TEXT NOT NULL,
        label_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY(task_id, label_id),
        FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY(label_id) REFERENCES labels(id) ON DELETE CASCADE
      )
    `)

    // Create activity log table
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
    `)

    // Create indexes for better performance
    this.exec('CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id)')
    this.exec('CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)')
    this.exec('CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline)')
    this.exec('CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)')
    this.exec('CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)')
    this.exec('CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id)')
    this.exec('CREATE INDEX IF NOT EXISTS idx_activity_logs_task_id ON activity_logs(task_id)')
    this.exec('CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at)')

    // Create default inbox list if it doesn't exist
    const inboxResult = this.prepare('SELECT id FROM lists WHERE is_inbox = 1').get()
    if (!inboxResult) {
      const now = Date.now()
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
      )
    }
  }

  // Method wrappers that adapt to both APIs
  exec(sql: string): any {
    if (this.isBun) {
      return this.db.exec(sql)
    } else {
      return this.db.exec(sql)
    }
  }

  prepare(sql: string): any {
    const stmt = this.db.prepare(sql)
    
    // Wrap the statement to provide a consistent API
    if (this.isBun) {
      // Bun uses different method names
      return {
        run: (...args: any[]) => this.db.run(sql, args),
        all: (...args: any[]) => this.db.query(sql).all(...args),
        get: (...args: any[]) => this.db.query(sql).get(...args)
      }
    } else {
      // better-sqlite3 API
      return {
        run: (...args: any[]) => stmt.run(...args),
        all: (...args: any[]) => stmt.all(...args),
        get: (...args: any[]) => stmt.get(...args)
      }
    }
  }

  run(sql: string, args?: any[]): any {
    if (this.isBun) {
      return this.db.run(sql, args)
    } else {
      return this.db.prepare(sql).run(args)
    }
  }

  query(sql: string) {
    if (this.isBun) {
      return this.db.query(sql)
    } else {
      const stmt = this.db.prepare(sql)
      return {
        all: (...args: any[]) => stmt.all(...args),
        get: (...args: any[]) => stmt.get(...args)
      }
    }
  }

  close() {
    if (this.db) {
      this.db.close()
    }
  }
}

// Singleton instance
let database: UnifiedDatabase | null = null

export function getDatabase(): UnifiedDatabase {
  if (!database) {
    database = new UnifiedDatabase()
  }
  return database
}

export function closeDatabase(): void {
  if (database) {
    database.close()
    database = null
  }
}
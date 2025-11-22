import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = path.join(process.cwd(), 'planner.db');

// Ensure the database file exists so that better-sqlite3 can open it reliably
if (!fs.existsSync(dbPath)) {
  fs.closeSync(fs.openSync(dbPath, 'w'));
}

function createConnection() {
  const connection = new Database(dbPath);
  connection.pragma('journal_mode = WAL');
  connection.pragma('foreign_keys = ON');
  return connection;
}

declare global {
  // eslint-disable-next-line no-var
  var __PLANNER_DB__: Database.Database | undefined;
}

let connection = global.__PLANNER_DB__;

if (!connection) {
  connection = createConnection();
  if (process.env.NODE_ENV !== 'production') {
    global.__PLANNER_DB__ = connection;
  }
}

export function getDb() {
  return connection!;
}

export default connection!;

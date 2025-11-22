import db from './client';
import { initializeDatabase } from './schema';

initializeDatabase();

export * from './schema';
export default db;

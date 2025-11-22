import { getDatabase, closeDatabase } from '../lib/database'

console.log('Initializing database...')

const db = getDatabase()

// Database is already initialized by getDatabase
console.log('Database initialized successfully')

closeDatabase()
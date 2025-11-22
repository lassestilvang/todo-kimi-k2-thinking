import db from '../db';
import { nanoid } from 'nanoid';
import type { List } from '../types';

export function getAllLists(): List[] {
  const rows = db.prepare(`
    SELECT 
      id, name, color, emoji, is_default as isDefault,
      created_at as createdAt, updated_at as updatedAt
    FROM lists
    ORDER BY is_default DESC, created_at ASC
  `).all() as List[];
  
  return rows;
}

export function getListById(id: string): List | undefined {
  const row = db.prepare(`
    SELECT 
      id, name, color, emoji, is_default as isDefault,
      created_at as createdAt, updated_at as updatedAt
    FROM lists
    WHERE id = ?
  `).get(id) as List | undefined;
  
  return row;
}

export function createList(data: {
  name: string;
  color: string;
  emoji: string;
}): List {
  const id = nanoid();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO lists (id, name, color, emoji, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.name, data.color, data.emoji, now, now);
  
  return getListById(id)!;
}

export function updateList(id: string, data: {
  name?: string;
  color?: string;
  emoji?: string;
}): List {
  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.color !== undefined) {
    updates.push('color = ?');
    values.push(data.color);
  }
  if (data.emoji !== undefined) {
    updates.push('emoji = ?');
    values.push(data.emoji);
  }
  
  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);
  
  db.prepare(`
    UPDATE lists
    SET ${updates.join(', ')}
    WHERE id = ?
  `).run(...values);
  
  return getListById(id)!;
}

export function deleteList(id: string): void {
  // Don't allow deleting the default inbox
  const list = getListById(id);
  if (list?.isDefault) {
    throw new Error('Cannot delete the default inbox');
  }
  
  db.prepare('DELETE FROM lists WHERE id = ?').run(id);
}

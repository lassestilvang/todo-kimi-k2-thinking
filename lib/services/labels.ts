import db from '../db';
import type { Label } from '../types';
import { nanoid } from 'nanoid';

export function getAllLabels(): Label[] {
  return db.prepare(`
    SELECT id, name, color, icon, created_at as createdAt, updated_at as updatedAt
    FROM labels
    ORDER BY name ASC
  `).all() as Label[];
}

export function getLabelById(id: string): Label | undefined {
  return db.prepare(`
    SELECT id, name, color, icon, created_at as createdAt, updated_at as updatedAt
    FROM labels
    WHERE id = ?
  `).get(id) as Label | undefined;
}

export function createLabel(data: { name: string; color: string; icon: string }): Label {
  const id = nanoid();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO labels (id, name, color, icon, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.name, data.color, data.icon, now, now);

  return getLabelById(id)!;
}

export function updateLabel(
  id: string,
  data: Partial<{ name: string; color: string; icon: string }>,
): Label {
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
  if (data.icon !== undefined) {
    updates.push('icon = ?');
    values.push(data.icon);
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);

  db.prepare(`
    UPDATE labels
    SET ${updates.join(', ')}
    WHERE id = ?
  `).run(...values);

  return getLabelById(id)!;
}

export function deleteLabel(id: string): void {
  db.prepare('DELETE FROM labels WHERE id = ?').run(id);
}

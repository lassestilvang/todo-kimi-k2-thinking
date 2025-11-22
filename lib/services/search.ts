import Fuse from 'fuse.js';
import type { Task } from '../types';
import { getAllTasks } from './tasks';

const fuseOptions: Fuse.IFuseOptions<Task> = {
  includeScore: true,
  threshold: 0.35,
  keys: ['name', 'description', 'priority', 'listId'],
};

export function searchTasks(query: string): Task[] {
  if (!query.trim()) return [];
  const tasks = getAllTasks();
  const fuse = new Fuse(tasks, fuseOptions);
  return fuse.search(query).map((result) => result.item);
}

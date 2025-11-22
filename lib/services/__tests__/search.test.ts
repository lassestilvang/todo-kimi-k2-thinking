import { describe, test, expect, beforeEach } from 'bun:test';
import { resetDatabase } from '../../db';
import * as listsService from '../lists';
import * as tasksService from '../tasks';
import { searchTasks } from '../search';

describe('Search Service', () => {
  beforeEach(() => {
    resetDatabase();
    const list = listsService.createList({ name: 'Test', color: '#000', emoji: '🔍' });
    
    tasksService.createTask({ listId: list.id, name: 'Buy groceries', description: 'Milk, eggs, bread' });
    tasksService.createTask({ listId: list.id, name: 'Meeting with team', description: 'Discuss Q4 goals' });
    tasksService.createTask({ listId: list.id, name: 'Dentist appointment', description: 'Annual checkup' });
  });

  test('should find tasks by name', () => {
    const results = searchTasks('groceries');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('groceries');
  });

  test('should find tasks by description', () => {
    const results = searchTasks('Q4');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].description).toContain('Q4');
  });

  test('should return empty array for no matches', () => {
    const results = searchTasks('nonexistent');
    expect(results.length).toBe(0);
  });

  test('should handle fuzzy search', () => {
    const results = searchTasks('grocries');
    expect(results.length).toBeGreaterThan(0);
  });
});

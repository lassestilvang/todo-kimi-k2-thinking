import { describe, test, expect, beforeEach } from 'bun:test';
import { resetDatabase } from '../../db';
import * as listsService from '../lists';

describe('Lists Service', () => {
  beforeEach(() => {
    resetDatabase();
  });

  test('should get all lists including default inbox', () => {
    const lists = listsService.getAllLists();
    expect(lists.length).toBeGreaterThan(0);
    const inbox = lists.find(l => l.isDefault);
    expect(inbox).toBeDefined();
    expect(inbox?.name).toBe('Inbox');
  });

  test('should create a new list', () => {
    const newList = listsService.createList({
      name: 'Work',
      color: '#ff0000',
      emoji: '💼',
    });

    expect(newList.id).toBeDefined();
    expect(newList.name).toBe('Work');
    expect(newList.color).toBe('#ff0000');
    expect(newList.emoji).toBe('💼');
  });

  test('should get list by id', () => {
    const created = listsService.createList({
      name: 'Personal',
      color: '#00ff00',
      emoji: '🏠',
    });

    const retrieved = listsService.getListById(created.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Personal');
  });

  test('should update list', () => {
    const created = listsService.createList({
      name: 'Original',
      color: '#0000ff',
      emoji: '📋',
    });

    const updated = listsService.updateList(created.id, {
      name: 'Updated',
      color: '#ff00ff',
    });

    expect(updated.name).toBe('Updated');
    expect(updated.color).toBe('#ff00ff');
    expect(updated.emoji).toBe('📋');
  });

  test('should delete list', () => {
    const created = listsService.createList({
      name: 'Temporary',
      color: '#000000',
      emoji: '🗑️',
    });

    listsService.deleteList(created.id);
    const retrieved = listsService.getListById(created.id);
    expect(retrieved).toBeUndefined();
  });

  test('should not delete default inbox', () => {
    const inbox = listsService.getAllLists().find(l => l.isDefault);
    expect(inbox).toBeDefined();

    expect(() => listsService.deleteList(inbox!.id)).toThrow();
  });
});

import { describe, test, expect, beforeEach } from 'bun:test';
import { resetDatabase } from '../../db';
import * as listsService from '../lists';
import * as labelsService from '../labels';
import * as tasksService from '../tasks';

const createList = () =>
  listsService.createList({ name: 'Test List', color: '#123456', emoji: '🧪' });

describe('Tasks Service', () => {
  beforeEach(() => {
    resetDatabase();
  });

  test('should create and retrieve tasks', () => {
    const list = createList();
    const task = tasksService.createTask({
      listId: list.id,
      name: 'Test Task',
      priority: 'high',
    });

    expect(task.id).toBeDefined();

    const retrieved = tasksService.getTaskById(task.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Test Task');
    expect(retrieved?.priority).toBe('high');
  });

  test('should update task completion', () => {
    const list = createList();
    const task = tasksService.createTask({
      listId: list.id,
      name: 'Complete me',
    });

    tasksService.updateTask(task.id, { completed: true });
    const updated = tasksService.getTaskById(task.id);
    expect(updated?.completed).toBe(true);
  });

  test('should add and remove labels from tasks', () => {
    const list = createList();
    const task = tasksService.createTask({ listId: list.id, name: 'Label task' });
    const label = labelsService.createLabel({ name: 'Important', color: '#ff0000', icon: '⭐' });

    tasksService.addLabelToTask(task.id, label.id);
    let retrieved = tasksService.getTaskById(task.id);
    expect(retrieved?.labels?.length).toBe(1);

    tasksService.removeLabelFromTask(task.id, label.id);
    retrieved = tasksService.getTaskById(task.id);
    expect(retrieved?.labels?.length).toBe(0);
  });

  test('should log reminders', () => {
    const list = createList();
    const task = tasksService.createTask({ listId: list.id, name: 'Reminder task' });

    const reminderId = tasksService.addReminder(task.id, new Date().toISOString());
    expect(reminderId).toBeDefined();

    const retrieved = tasksService.getTaskById(task.id);
    expect(retrieved?.reminders?.length).toBe(1);

    tasksService.removeReminder(retrieved!.reminders![0].id);
    const updated = tasksService.getTaskById(task.id);
    expect(updated?.reminders?.length).toBe(0);
  });
});

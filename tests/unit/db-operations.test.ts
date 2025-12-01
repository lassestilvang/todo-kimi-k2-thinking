import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { getDatabase, closeDatabase } from '@/lib/database'
import {
  getAllLists,
  createList,
  getInboxList,
  getAllLabels,
  createLabel,
  createTask,
  updateTask,
  deleteTask,
  getTasksByView,
  getTaskById,
  createSubtask,
  updateSubtask,
  searchTasks,
  formatTimeHHMM,
  formatDateForInput
} from '@/lib/db-operations'
import type { CreateTaskData } from '@/lib/types'

describe('Database Operations Unit Tests', () => {
  beforeEach(() => {
    const db = getDatabase()
    db.exec('DELETE FROM task_labels')
    db.exec('DELETE FROM subtasks')
    db.exec('DELETE FROM activity_logs')
    db.exec('DELETE FROM tasks WHERE list_id != "inbox"')
    db.exec('DELETE FROM labels')
    db.exec('DELETE FROM lists WHERE is_inbox = 0')
  })

  afterEach(() => {
    closeDatabase()
  })

  describe('Lists', () => {
    it('should create and retrieve inbox list', () => {
      const inbox = getInboxList()
      expect(inbox).toBeDefined()
      expect(inbox?.name).toBe('Inbox')
      expect(inbox?.is_inbox).toBe(1)
    })

    it('should create custom list', () => {
      const list = createList({ name: 'Work', icon: '💼', color: 'blue' })
      
      expect(list.name).toBe('Work')
      expect(list.icon).toBe('💼')
      expect(list.color).toBe('blue')
      expect(list.is_inbox).toBe(0)
    })

    it('should retrieve all lists', () => {
      createList({ name: 'Personal', icon: '🏠' })
      const lists = getAllLists()
      
      expect(lists.length).toBeGreaterThanOrEqual(2) // inbox + custom
      const customLists = lists.filter(l => !l.is_inbox)
      expect(customLists.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Labels', () => {
    it('should create and retrieve labels', () => {
      const label = createLabel({ name: 'Urgent', icon: '⚡', color: 'red' })
      
      expect(label.name).toBe('Urgent')
      expect(label.icon).toBe('⚡')
      expect(label.color).toBe('red')
    })

    it('should retrieve all labels', () => {
      createLabel({ name: 'Important', icon: '⭐' })
      createLabel({ name: 'Low Priority', icon: '🔽' })
      
      const labels = getAllLabels()
      expect(labels.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Tasks - Full Feature Set', () => {
    let testList: any
    let testLabel: any

    beforeEach(() => {
      testList = createList({ name: 'Test List', icon: '✅' })
      testLabel = createLabel({ name: 'Test Label', icon: '🏷️' })
    })

    it('should create task with all properties', () => {
      const taskData: CreateTaskData = {
        name: 'Complete Project',
        description: 'Finish the Q4 project deliverables',
        list_id: testList.id,
        date: new Date().toISOString().split('T')[0],
        deadline: '2024-12-31',
        estimate: '02:30',
        priority: 'high',
        recurring: 'weekly',
        labels: [testLabel.id]
      }

      const task = createTask(taskData)

      expect(task.name).toBe('Complete Project')
      expect(task.description).toBe('Finish the Q4 project deliverables')
      expect(task.list_id).toBe(testList.id)
      expect(task.date).toBeDefined()
      expect(task.deadline).toBeDefined()
      expect(task.estimate).toBe(150) // 2.5 hours in minutes
      expect(task.priority).toBe('high')
      expect(task.recurring).toBe('weekly')
      expect(task.completed).toBe(false)
    })

    it('should update task properties', () => {
      const task = createTask({
        name: 'Original Task',
        list_id: testList.id,
        priority: 'low'
      })

      const updated = updateTask(task.id, {
        name: 'Updated Task',
        description: 'Updated description',
        priority: 'high',
        completed: true
      })

      expect(updated.name).toBe('Updated Task')
      expect(updated.description).toBe('Updated description')
      expect(updated.priority).toBe('high')
      expect(updated.completed).toBe(true)
      expect(updated.completed_at).toBeGreaterThan(0)
    })

    it('should retrieve task by ID with labels and subtasks', () => {
      const task = createTask({
        name: 'Task with Details',
        list_id: testList.id,
        labels: [testLabel.id]
      })

      const retrieved = getTaskById(task.id)
      expect(retrieved).toBeDefined()
      expect(retrieved?.name).toBe('Task with Details')
      expect(retrieved?.labels).toBeDefined()
      expect(retrieved?.labels?.length).toBeGreaterThanOrEqual(1)
    })

    it('should delete task', () => {
      const task = createTask({
        name: 'Task to Delete',
        list_id: testList.id
      })

      deleteTask(task.id)

      const retrieved = getTaskById(task.id)
      expect(retrieved).toBeNull()
    })

    it('should search tasks by name', () => {
      createTask({
        name: 'Buy groceries',
        description: 'Get milk and eggs',
        list_id: testList.id
      })
      createTask({
        name: 'Doctor appointment',
        description: 'Annual checkup',
        list_id: testList.id
      })

      const results = searchTasks('groceries')
      
      expect(results.length).toBe(1)
      expect(results[0].name).toBe('Buy groceries')
    })
  })

  describe('Subtasks', () => {
    let testList: any
    let testTask: any

    beforeEach(() => {
      testList = createList({ name: 'Subtask Test', icon: '📝' })
      testTask = createTask({
        name: 'Parent Task',
        list_id: testList.id
      })
    })

    it('should create subtask', () => {
      const subtask = createSubtask(testTask.id, 'Child subtask')
      
      expect(subtask.name).toBe('Child subtask')
      expect(subtask.task_id).toBe(testTask.id)
      expect(subtask.completed).toBe(false)
    })

    it('should mark subtask as completed', () => {
      const subtask = createSubtask(testTask.id, 'Complete me')
      
      updateSubtask(subtask.id, true)
      
      // Clear DB instance to get fresh data
      closeDatabase()
      getDatabase()
      
      const task = getTaskById(testTask.id)
      expect(task?.subtasks).toBeDefined()
      expect(task?.subtasks?.length).toBeGreaterThanOrEqual(1)
      
      const updatedSubtask = task?.subtasks?.find(s => s.id === subtask.id)
      expect(updatedSubtask?.completed).toBe(true)
      expect(updatedSubtask?.completed_at).toBeGreaterThan(0)
    })
  })

  describe('Views', () => {
    let testList: any

    beforeEach(() => {
      testList = createList({ name: 'View Test', icon: '👀' })
    })

    it('should filter tasks by view: Today', () => {
      const today = new Date().toISOString().split('T')[0]
      
      createTask({
        name: 'Today Task',
        list_id: testList.id,
        date: today
      })
      createTask({
        name: 'Future Task',
        list_id: testList.id,
        date: '2024-12-31'
      })

      const tasks = getTasksByView('today')
      expect(tasks.length).toBe(1)
      expect(tasks[0].name).toBe('Today Task')
    })

    it('should filter tasks by view: Next 7 Days', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      createTask({
        name: 'Tomorrow Task',
        list_id: testList.id,
        date: tomorrow
      })
      createTask({
        name: 'Old Task',
        list_id: testList.id,
        date: '2024-01-01'
      })

      const tasks = getTasksByView('next7days')
      expect(tasks.length).toBeGreaterThan(0)
      expect(tasks.some(t => t.name === 'Tomorrow Task')).toBe(true)
      expect(tasks.some(t => t.name === 'Old Task')).toBe(false)
    })

    it('should filter tasks by view: All', () => {
      createTask({ name: 'Task 1', list_id: testList.id })
      createTask({ name: 'Task 2', list_id: testList.id })
      createTask({ name: 'Task 3', list_id: testList.id })

      const tasks = getTasksByView('all')
      expect(tasks.length).toBeGreaterThanOrEqual(3)
    })

    it('should filter completed tasks when showCompleted is false', () => {
      createTask({
        name: 'Completed Task',
        list_id: testList.id,
        completed: true
      })
      createTask({
        name: 'Active Task',
        list_id: testList.id,
        completed: false
      })

      const tasks = getTasksByView('all', false)
      expect(tasks.some(t => t.name === 'Active Task')).toBe(true)
      expect(tasks.some(t => t.name === 'Completed Task')).toBe(false)
    })
  })

  describe('Task Properties Validation', () => {
    let testList: any

    beforeEach(() => {
      testList = createList({ name: 'Properties Test', icon: '🎛️' })
    })

    it('should handle all task properties correctly', () => {
      const task = createTask({
        name: 'Full Properties Task',
        description: 'This is a detailed description with all properties',
        list_id: testList.id,
        date: '2024-11-30',
        deadline: '2024-12-25',
        estimate: '03:30',
        priority: 'high',
        recurring: 'daily'
      })

      expect(task.name).toBe('Full Properties Task')
      expect(task.description).toBe('This is a detailed description with all properties')
      expect(task.date).toBeDefined()
      expect(task.deadline).toBeDefined()
      expect(task.estimate).toBe(210) // 3.5 hours in minutes
      expect(task.priority).toBe('high')
      expect(task.recurring).toBe('daily')
      expect(task.reminders).toBeNull()
      expect(task.attachments).toBeNull()
      expect(task.actual_time).toBeNull()
    })
  })

  describe('Utility Functions', () => {
    it('should format time HH:MM correctly', () => {
      expect(formatTimeHHMM(0)).toBe('00:00')
      expect(formatTimeHHMM(60)).toBe('01:00')
      expect(formatTimeHHMM(150)).toBe('02:30')
      expect(formatTimeHHMM(0)).toBe('00:00')
    })

    it('should format date for input correctly', () => {
      const timestamp = new Date('2024-11-22').getTime()
      expect(formatDateForInput(timestamp)).toBe('2024-11-22')
      expect(formatDateForInput(null)).toBe('')
    })
  })
})
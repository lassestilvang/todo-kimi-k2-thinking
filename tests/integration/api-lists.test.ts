import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { getDatabase, closeDatabase } from '@/lib/database'
import { getAllLists, createList, deleteList } from '@/lib/db-operations'

describe('API - Lists Integration Tests', () => {
  beforeEach(() => {
    // Clean database for each test
    const db = getDatabase()
    db.exec('DELETE FROM lists WHERE is_inbox = 0')
    db.exec('DELETE FROM task_labels')
    db.exec('DELETE FROM tasks WHERE list_id != "inbox"')
  })

  afterEach(() => {
    closeDatabase()
  })

  describe('GET /api/lists', () => {
    it('should return all lists including inbox', async () => {
      const response = await fetch('http://localhost:3000/api/lists')
      expect(response.status).toBe(200)
      
      const lists = await response.json()
      expect(Array.isArray(lists)).toBe(true)
      
      // Should have inbox
      const inbox = lists.find((list: any) => list.is_inbox === 1)
      expect(inbox).toBeDefined()
      expect(inbox.name).toBe('Inbox')
    })
  })

  describe('POST /api/lists', () => {
    it('should create a new list', async () => {
      const newList = {
        name: 'Work',
        icon: '💼',
        color: 'blue'
      }

      const response = await fetch('http://localhost:3000/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newList)
      })

      expect(response.status).toBe(201)
      
      const createdList = await response.json()
      expect(createdList.name).toBe('Work')
      expect(createdList.icon).toBe('💼')
      expect(createdList.color).toBe('blue')
      expect(createdList.is_inbox).toBe(0)
    })

    it('should return error for empty name', async () => {
      const response = await fetch('http://localhost:3000/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' })
      })

      expect(response.status).toBe(400)
      const error = await response.json()
      expect(error.error).toContain('name is required')
    })
  })

  describe('DELETE /api/lists', () => {
    it('should delete a custom list', async () => {
      // Create a list first
      const list = createList({ name: 'To Delete', icon: '🗑️' })
      
      const response = await fetch('http://localhost:3000/api/lists', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: list.id })
      })

      expect(response.status).toBe(200)
      
      // Verify list is deleted
      const lists = getAllLists()
      const deleted = lists.find(l => l.id === list.id)
      expect(deleted).toBeUndefined()
    })
  })
})
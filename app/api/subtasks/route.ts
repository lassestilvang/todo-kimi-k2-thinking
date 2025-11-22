import { NextResponse } from 'next/server'
import { createSubtask, updateSubtask } from '@/lib/db-operations'

export async function POST(request: Request) {
  try {
    const { taskId, name } = await request.json()
    
    if (!taskId || !name?.trim()) {
      return NextResponse.json(
        { error: 'Task ID and name are required' },
        { status: 400 }
      )
    }

    const subtask = createSubtask(taskId, name)
    return NextResponse.json(subtask, { status: 201 })
  } catch (error) {
    console.error('Error creating subtask:', error)
    return NextResponse.json(
      { error: 'Failed to create subtask' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { subtaskId, completed } = await request.json()
    
    if (!subtaskId) {
      return NextResponse.json(
        { error: 'Subtask ID is required' },
        { status: 400 }
      )
    }

    updateSubtask(subtaskId, completed)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating subtask:', error)
    return NextResponse.json(
      { error: 'Failed to update subtask' },
      { status: 500 }
    )
  }
}
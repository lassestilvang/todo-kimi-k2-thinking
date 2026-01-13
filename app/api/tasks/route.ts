import { NextResponse } from 'next/server'
import {
  getTasksByView,
  getOverdueTasksCount,
  createTask,
  updateTask,
  deleteTask,
  searchTasks,
} from '@/lib/db-operations'
import type { CreateTaskData, UpdateTaskData } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') || 'all'
    const showCompleted = searchParams.get('showCompleted') === 'true'
    const search = searchParams.get('search')

    if (search) {
      const results = searchTasks(search)
      return NextResponse.json(results)
    }

    const tasks = getTasksByView(view, showCompleted)
    const overdueCount = getOverdueTasksCount()

    return NextResponse.json({
      tasks,
      overdueCount,
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data: CreateTaskData = await request.json()
    
    if (!data.name?.trim()) {
      return NextResponse.json(
        { error: 'Task name is required' },
        { status: 400 }
      )
    }

    const task = createTask(data)
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { taskId, ...data }: { taskId: string } & UpdateTaskData = await request.json()
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    const task = updateTask(taskId, data)
    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { taskId } = await request.json()
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    deleteTask(taskId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
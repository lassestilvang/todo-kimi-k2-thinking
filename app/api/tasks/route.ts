import { NextRequest, NextResponse } from 'next/server';
import {
  getAllTasks,
  getTasksByListId,
  getTasksByLabelId,
  getTasksForNext7Days,
  getTasksForToday,
  getUpcomingTasks,
  getOverdueTasks,
  createTask,
} from '@/lib/services/tasks';
import { searchTasks } from '@/lib/services/search';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');
    const listId = searchParams.get('listId');
    const labelId = searchParams.get('labelId');
    const showCompleted = searchParams.get('showCompleted') === 'true';
    const searchQuery = searchParams.get('query');

    let tasks;

    if (searchQuery) {
      tasks = searchTasks(searchQuery);
    } else if (listId) {
      tasks = getTasksByListId(listId);
    } else if (labelId) {
      tasks = getTasksByLabelId(labelId);
    } else {
      switch (view) {
        case 'today':
          tasks = getTasksForToday();
          break;
        case 'next_7_days':
          tasks = getTasksForNext7Days();
          break;
        case 'upcoming':
          tasks = getUpcomingTasks();
          break;
        case 'overdue':
          tasks = getOverdueTasks();
          break;
        case 'all':
        default:
          tasks = getAllTasks();
      }
    }

    if (!showCompleted) {
      tasks = tasks.filter((task) => !task.completed);
    }

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const task = createTask(data);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

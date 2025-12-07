import { NextResponse } from 'next/server'
import { getRecentActivity } from '@/lib/db-operations'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const activityLogs = getRecentActivity(limit)
    
    // Filter by taskId if provided
    const filteredLogs = taskId 
      ? activityLogs.filter(log => log.task_id === taskId)
      : activityLogs

    return NextResponse.json(filteredLogs)
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }
}
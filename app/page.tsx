'use client'

import { AppSidebar } from '@/components/layout/app-sidebar'
import { TaskList } from '@/components/tasks/task-list'
import { useState } from 'react'
import { Task } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])

  return (
    <div className="flex h-screen">
      <AppSidebar 
        onAddTask={() => {}}
        onSearch={() => {}}
      />
      <main className="flex-1 overflow-y-auto">
        <TaskList
          tasks={tasks}
          onTaskUpdate={() => {}}
          onTaskClick={() => {}}
        />
      </main>
    </div>
  )
}
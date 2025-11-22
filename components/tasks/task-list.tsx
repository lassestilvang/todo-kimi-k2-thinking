'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Calendar, Clock, Tag, Flag } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Task, Subtask } from '@/lib/types'
import { formatTimeHHMM, formatDateForInput } from '@/lib/db-operations'

interface TaskListProps {
  tasks: Task[]
  onTaskUpdate: () => void
  onTaskClick: (task: Task) => void
}

export function TaskList({ tasks, onTaskUpdate, onTaskClick }: TaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const toggleTaskComplete = async (taskId: string, completed: boolean) => {
    try {
      setCompletingTasks(prev => new Set(prev).add(taskId))
      
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed }),
      })

      if (!response.ok) throw new Error('Failed to update task')

      toast({
        title: 'Success',
        description: completed ? 'Task completed!' : 'Task reopened!',
      })
      
      onTaskUpdate()
    } catch (error) {
      console.error('Error updating task:', error)
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      })
    } finally {
      setCompletingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  const toggleSubtaskComplete = async (subtaskId: string, completed: boolean) => {
    try {
      const response = await fetch('/api/subtasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtaskId, completed }),
      })

      if (!response.ok) throw new Error('Failed to update subtask')

      onTaskUpdate()
    } catch (error) {
      console.error('Error updating subtask:', error)
      toast({
        title: 'Error',
        description: 'Failed to update subtask',
        variant: 'destructive',
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 border-red-500'
      case 'medium': return 'text-yellow-500 border-yellow-500'
      case 'low': return 'text-blue-500 border-blue-500'
      default: return 'text-gray-500 border-gray-500'
    }
  }

  const getPriorityLabel = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1)
  }

  const formatDateDisplay = (timestamp: number | null) => {
    if (!timestamp) return null
    const date = new Date(timestamp)
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return format(date, 'MMM d')
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <CheckSquare className="h-12 w-12 mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
        <p className="text-sm">Create your first task to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const isExpanded = expandedTasks.has(task.id)
        const isCompleting = completingTasks.has(task.id)
        const hasSubtasks = task.subtasks && task.subtasks.length > 0
        const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0
        const totalSubtasks = task.subtasks?.length || 0

        return (
          <Card 
            key={task.id} 
            className={`transition-all hover:shadow-md ${
              task.completed ? 'opacity-60' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={(checked) => toggleTaskComplete(task.id, checked as boolean)}
                  disabled={isCompleting}
                  className="mt-1"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => onTaskClick(task)}
                        className="text-left w-full group"
                      >
                        <h3 className={`font-medium mb-1 break-words ${
                          task.completed ? 'line-through text-muted-foreground' : ''
                        }`}>
                          {task.name}
                        </h3>
                      </button>
                      
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {/* List */}
                        {task.list_name && (
                          <Badge variant="secondary" className="font-normal">
                            <span className="mr-1">{task.list_icon}</span>
                            {task.list_name}
                          </Badge>
                        )}
                        
                        {/* Date */}
                        {task.date && (
                          <Badge variant="outline" className="font-normal">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDateDisplay(task.date)}
                          </Badge>
                        )}
                        
                        {/* Estimate */}
                        {task.estimate && (
                          <Badge variant="outline" className="font-normal">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimeHHMM(task.estimate)}
                          </Badge>
                        )}
                        
                        {/* Priority */}
                        {task.priority !== 'none' && (
                          <Badge variant="outline" className={`font-normal ${getPriorityColor(task.priority)}`}>
                            <Flag className="h-3 w-3 mr-1" />
                            {getPriorityLabel(task.priority)}
                          </Badge>
                        )}
                        
                        {/* Labels */}
                        {task.labels?.map((label) => (
                          <Badge
                            key={label.id}
                            variant="outline"
                            className="font-normal"
                            style={{ color: label.color, borderColor: label.color }}
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            <span className="mr-1">{label.icon}</span>
                            {label.name}
                          </Badge>
                        ))}
                        
                        {/* Recurring */}
                        {task.recurring && task.recurring !== 'none' && (
                          <Badge variant="outline" className="font-normal">
                            🔄 {task.recurring}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Subtasks summary */}
                      {hasSubtasks && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {completedSubtasks}/{totalSubtasks} subtasks completed
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {hasSubtasks && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTaskExpansion(task.id)}
                          className="h-8 w-8 p-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Subtasks */}
                  {isExpanded && hasSubtasks && (
                    <div className="mt-4 pl-6 border-l border-border space-y-2">
                      {task.subtasks?.map((subtask) => (
                        <div key={subtask.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={subtask.completed}
                            onCheckedChange={(checked) => 
                              toggleSubtaskComplete(subtask.id, checked as boolean)
                            }
                            className="h-4 w-4"
                          />
                          <span className={`text-sm ${
                            subtask.completed ? 'line-through text-muted-foreground' : ''
                          }`}>
                            {subtask.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
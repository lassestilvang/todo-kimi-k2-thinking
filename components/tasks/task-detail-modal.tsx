'use client'

import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  X, Plus, Calendar, Clock, Tag, Flag, Trash2, 
  Paperclip, Activity, CheckSquare, ChevronDown, ChevronRight
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Task, List, Label } from '@/lib/types'
import { formatTimeHHMM, formatDateForInput } from '@/lib/db-operations'
import { format } from 'date-fns'

interface TaskDetailModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onTaskUpdate: () => void
}

export function TaskDetailModal({ task, isOpen, onClose, onTaskUpdate }: TaskDetailModalProps) {
  const [lists, setLists] = useState<List[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [newSubtaskName, setNewSubtaskName] = useState('')
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState<Partial<Task>>({
    name: '',
    description: '',
    list_id: '',
    date: null,
    deadline: null,
    estimate: null,
    priority: 'none',
    recurring: 'none',
  })

  useEffect(() => {
    if (isOpen) {
      loadData()
      if (task) {
        setFormData({
          name: task.name,
          description: task.description || '',
          list_id: task.list_id,
          date: task.date,
          deadline: task.deadline,
          estimate: task.estimate,
          priority: task.priority,
          recurring: task.recurring,
        })
        loadActivityLogs(task.id)
      }
    }
  }, [isOpen, task])

  const loadData = async () => {
    try {
      const [listsRes, labelsRes] = await Promise.all([
        fetch('/api/lists'),
        fetch('/api/labels')
      ])
      
      if (listsRes.ok) setLists(await listsRes.json())
      if (labelsRes.ok) setLabels(await labelsRes.json())
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const loadActivityLogs = async (taskId: string) => {
    try {
      const response = await fetch(`/api/activity-logs?taskId=${taskId}`)
      if (response.ok) {
        setActivityLogs(await response.json())
      }
    } catch (error) {
      console.error('Error loading activity logs:', error)
    }
  }

  const handleSave = async () => {
    if (!task || !formData.name?.trim()) {
      toast({
        title: 'Error',
        description: 'Task name is required',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          name: formData.name,
          description: formData.description,
          list_id: formData.list_id,
          date: formData.date ? formatDateForInput(formData.date) : null,
          deadline: formData.deadline ? formatDateForInput(formData.deadline) : null,
          estimate: formData.estimate ? formatTimeHHMM(formData.estimate) : null,
          priority: formData.priority,
          recurring: formData.recurring,
        }),
      })

      if (!response.ok) throw new Error('Failed to update task')

      toast({ title: 'Success', description: 'Task updated successfully!' })
      onTaskUpdate()
      onClose()
    } catch (error) {
      console.error('Error updating task:', error)
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!task) return

    try {
      const response = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id }),
      })

      if (!response.ok) throw new Error('Failed to delete task')

      toast({ title: 'Success', description: 'Task deleted successfully!' })
      onTaskUpdate()
      onClose()
    } catch (error) {
      console.error('Error deleting task:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      })
    }
  }

  const handleAddSubtask = async () => {
    if (!task || !newSubtaskName.trim()) return

    try {
      const response = await fetch('/api/subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          name: newSubtaskName,
        }),
      })

      if (!response.ok) throw new Error('Failed to create subtask')

      setNewSubtaskName('')
      onTaskUpdate()
      loadActivityLogs(task.id)
    } catch (error) {
      console.error('Error creating subtask:', error)
      toast({
        title: 'Error',
        description: 'Failed to create subtask',
        variant: 'destructive',
      })
    }
  }

  const handleSubtaskComplete = async (subtaskId: string, completed: boolean) => {
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
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {task ? 'Edit Task' : 'Task Details'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            {/* Details Tab */}
            <TabsContent value="details" className="mt-0">
              <div className="space-y-4">
                {/* Task Name */}
                <div>
                  <Label htmlFor="task-name">Task Name *</Label>
                  <Input
                    id="task-name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter task name..."
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="task-description">Description</Label>
                  <Textarea
                    id="task-description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add task description..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* List */}
                  <div>
                    <Label>List</Label>
                    <Select
                      value={formData.list_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, list_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select list" />
                      </SelectTrigger>
                      <SelectContent>
                        {lists.map((list) => (
                          <SelectItem key={list.id} value={list.id}>
                            <span className="mr-2">{list.icon}</span>
                            {list.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority */}
                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Date */}
                  <div>
                    <Label htmlFor="task-date">Date</Label>
                    <Input
                      id="task-date"
                      type="date"
                      value={formData.date ? formatDateForInput(formData.date) : ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        date: e.target.value ? new Date(e.target.value).getTime() : null
                      }))}
                    />
                  </div>

                  {/* Deadline */}
                  <div>
                    <Label htmlFor="task-deadline">Deadline</Label>
                    <Input
                      id="task-deadline"
                      type="date"
                      value={formData.deadline ? formatDateForInput(formData.deadline) : ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        deadline: e.target.value ? new Date(e.target.value).getTime() : null
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Estimate */}
                  <div>
                    <Label htmlFor="task-estimate">Estimated Time</Label>
                    <Input
                      id="task-estimate"
                      type="time"
                      value={formData.estimate ? formatTimeHHMM(formData.estimate) : ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        estimate: e.target.value ? parseTimeToMinutes(e.target.value) : null
                      }))}
                    />
                  </div>

                  {/* Recurring */}
                  <div>
                    <Label>Recurring</Label>
                    <Select
                      value={formData.recurring}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, recurring: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Not recurring" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not recurring</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="weekdays">Weekdays</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Labels */}
                <div>
                  <Label>Labels</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {task?.labels?.map((label) => (
                      <Badge
                        key={label.id}
                        variant="outline"
                        className="font-normal"
                        style={{ color: label.color, borderColor: label.color }}
                      >
                        <span className="mr-1">{label.icon}</span>
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Subtasks Tab */}
            <TabsContent value="subtasks" className="mt-0">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add subtask..."
                    value={newSubtaskName}
                    onChange={(e) => setNewSubtaskName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                  />
                  <Button onClick={handleAddSubtask}>Add</Button>
                </div>

                <div className="space-y-2">
                  {task?.subtasks?.map((subtask) => (
                    <Card key={subtask.id} className="p-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={subtask.completed}
                          onCheckedChange={(checked) => 
                            handleSubtaskComplete(subtask.id, checked as boolean)
                          }
                        />
                        <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                          {subtask.name}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-0">
              <div className="space-y-4">
                {activityLogs.map((log) => (
                  <Card key={log.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium capitalize">{log.action}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      {log.user_id !== 'system' && (
                        <Badge variant="secondary">{log.user_id}</Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper function
function parseTimeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}
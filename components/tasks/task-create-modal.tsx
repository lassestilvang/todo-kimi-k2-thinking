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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
// Icon imports removed - using only what's needed
import { useToast } from '@/hooks/use-toast'
import { List, Label as LabelType } from '@/lib/types'

interface TaskCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onTaskCreated: () => void
  defaultListId?: string
}

export function TaskCreateModal({ isOpen, onClose, onTaskCreated, defaultListId }: TaskCreateModalProps) {
  const [lists, setLists] = useState<List[]>([])
  const [labels, setLabels] = useState<LabelType[]>([])
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    list_id: defaultListId || '',
    date: '',
    deadline: '',
    estimate: '',
    priority: 'none' as const,
    recurring: 'none' as const,
  })

  useEffect(() => {
    if (isOpen) {
      loadData()
      // Reset form
      setFormData({
        name: '',
        description: '',
        list_id: defaultListId || '',
        date: '',
        deadline: '',
        estimate: '',
        priority: 'none',
        recurring: 'none',
      })
      setSelectedLabels([])
    }
  }, [isOpen, defaultListId])

  const loadData = async () => {
    try {
      const [listsRes, labelsRes] = await Promise.all([
        fetch('/api/lists'),
        fetch('/api/labels')
      ])
      
      if (listsRes.ok) {
        const listsData = await listsRes.json()
        setLists(listsData)
        
        // Set default to inbox if no default provided
        if (!formData.list_id && listsData.length > 0) {
          const inbox = listsData.find((list: List) => list.is_inbox)
          if (inbox) {
            setFormData(prev => ({ ...prev, list_id: inbox.id }))
          }
        }
      }
      
      if (labelsRes.ok) setLabels(await labelsRes.json())
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name?.trim() || !formData.list_id) {
      toast({
        title: 'Error',
        description: 'Task name and list are required',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          list_id: formData.list_id,
          date: formData.date || undefined,
          deadline: formData.deadline || undefined,
          estimate: formData.estimate || undefined,
          priority: formData.priority,
          recurring: formData.recurring,
          labels: selectedLabels,
        }),
      })

      if (!response.ok) throw new Error('Failed to create task')

      toast({ title: 'Success', description: 'Task created successfully!' })
      onTaskCreated()
      onClose()
    } catch (error) {
      console.error('Error creating task:', error)
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleLabel = (labelId: string) => {
    setSelectedLabels(prev => 
      prev.includes(labelId) 
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    )
  }

  const parseTimeToMinutes = (timeString: string): number => {
    if (!timeString) return 0
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Task Name */}
          <div>
            <Label className="mb-2 block">Task Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter task name..."
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <Label className="mb-2 block">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add task description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* List */}
            <div>
              <Label className="mb-2 block">List *</Label>
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
              <Label className="mb-2 block">Priority</Label>
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
              <Label className="mb-2 block">Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            {/* Deadline */}
            <div>
              <Label className="mb-2 block">Deadline</Label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Estimated Time */}
            <div>
              <Label className="mb-2 block">Estimated Time</Label>
              <Input
                type="time"
                value={formData.estimate}
                onChange={(e) => setFormData(prev => ({ ...prev, estimate: e.target.value }))}
              />
            </div>

            {/* Recurring */}
            <div>
              <Label className="mb-2 block">Recurring</Label>
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
            <Label className="mb-2 block">Labels</Label>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => {
                const isSelected = selectedLabels.includes(label.id)
                return (
                  <Badge
                    key={label.id}
                    variant={isSelected ? 'default' : 'outline'}
                    className="cursor-pointer font-normal"
                    style={isSelected ? {} : { color: label.color, borderColor: label.color }}
                    onClick={() => toggleLabel(label.id)}
                  >
                    <span className="mr-1">{label.icon}</span>
                    {label.name}
                  </Badge>
                )
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
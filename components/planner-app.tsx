'use client';

import { useState, useEffect } from 'react';
import * as chrono from 'chrono-node';
import { Plus, Search } from 'lucide-react';
import { Sidebar } from '@/components/sidebar';
import { TaskList } from '@/components/task-list';
import { TaskDialog } from '@/components/task-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useTasksStore } from '@/lib/stores/use-tasks-store';
import type { TaskWithRelations, ViewType } from '@/lib/types';
import { toast } from 'sonner';

const EMOJI_LIST = ['📋', '🎯', '💼', '🏠', '🎨', '💡', '🔥', '⭐', '📚', '🎵'];
const COLOR_LIST = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899'];

const VIEW_INFO: Record<ViewType, { title: string; description: string }> = {
  today: { title: 'Today', description: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
  next_7_days: { title: 'Next 7 Days', description: 'Your tasks for the week ahead' },
  upcoming: { title: 'Upcoming', description: 'All your scheduled tasks' },
  all: { title: 'All Tasks', description: 'Every task across all lists' },
  list: { title: 'List', description: '' },
};

export function PlannerApp() {
  const { lists, labels, filters, setLists, setLabels, setFilters, currentView, setCurrentView, currentListId, setCurrentListId } = useTasksStore();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [previewTask, setPreviewTask] = useState<TaskWithRelations | null>(null);
  const [createListOpen, setCreateListOpen] = useState(false);
  const [createLabelOpen, setCreateLabelOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListEmoji, setNewListEmoji] = useState('📋');
  const [newListColor, setNewListColor] = useState('#6366f1');
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#6366f1');
  const [searchQuery, setSearchQuery] = useState('');
  const [nlInput, setNlInput] = useState('');
  const [currentLabelId, setCurrentLabelId] = useState<string | null>(null);

  const loadData = async (view: ViewType = currentView, listId: string | null = currentListId, labelId: string | null = currentLabelId) => {
    try {
      const [listsRes, labelsRes] = await Promise.all([
        fetch('/api/lists'),
        fetch('/api/labels'),
      ]);

      setLists(await listsRes.json());
      setLabels(await labelsRes.json());

      let tasksUrl = '/api/tasks?';
      if (listId) {
        tasksUrl += `listId=${listId}&`;
      } else if (labelId) {
        tasksUrl += `labelId=${labelId}&`;
      } else {
        tasksUrl += `view=${view}&`;
      }
      tasksUrl += `showCompleted=${filters.showCompleted}`;

      const tasksRes = await fetch(tasksUrl);
      setTasks(await tasksRes.json());

      const overdueRes = await fetch('/api/tasks?view=overdue&showCompleted=false');
      const overdue = await overdueRes.json();
      setOverdueCount(overdue.length);
    } catch (error) {
      toast.error('Failed to load data');
    }
  };


  useEffect(() => {
    loadData();
  }, [filters.showCompleted, currentView, currentListId, currentLabelId]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadData();
      return;
    }

    try {
      const res = await fetch(`/api/tasks?query=${encodeURIComponent(searchQuery)}&showCompleted=${filters.showCompleted}`);
      setTasks(await res.json());
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const parseNaturalLanguage = () => {
    if (!nlInput.trim()) {
      toast.error('Please enter a task');
      return;
    }

    const parsed = chrono.parse(nlInput);
    let taskName = nlInput;
    let taskDate: string | undefined;

    if (parsed.length > 0) {
      const parsedItem = parsed[0];
      taskDate = parsedItem.start.date().toISOString().split('T')[0];
      taskName = nlInput.substring(0, parsedItem.index) + nlInput.substring(parsedItem.index + parsedItem.text.length);
      taskName = taskName.trim();
    }

    handleCreateTask({
      name: taskName,
      listId: 'inbox',
      priority: 'none',
      date: taskDate,
    });

    setNlInput('');
  };

  const handleCreateTask = async (data: any) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success('Task created successfully');
        loadData();
      }
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleUpdateTask = async (data: any) => {
    if (!selectedTask) return;

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success('Task updated successfully');
        loadData();
        setSelectedTask(null);
      }
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });

      if (res.ok) {
        loadData();
      }
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Task deleted');
        loadData();
      }
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast.error('Please enter a list name');
      return;
    }

    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListName, emoji: newListEmoji, color: newListColor }),
      });

      if (res.ok) {
        const newList = await res.json();
        setLists([...lists, newList]);
        toast.success('List created successfully');
        setCreateListOpen(false);
        setNewListName('');
        setNewListEmoji('📋');
        setNewListColor('#6366f1');
      }
    } catch (error) {
      toast.error('Failed to create list');
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) {
      toast.error('Please enter a label name');
      return;
    }

    try {
      const res = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLabelName, icon: '🏷️', color: newLabelColor }),
      });

      if (res.ok) {
        const newLabel = await res.json();
        setLabels([...labels, newLabel]);
        toast.success('Label created successfully');
        setCreateLabelOpen(false);
        setNewLabelName('');
        setNewLabelColor('#6366f1');
      }
    } catch (error) {
      toast.error('Failed to create label');
    }
  };

  const viewInfo = VIEW_INFO[currentView] || VIEW_INFO.today;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        lists={lists}
        labels={labels}
        overdueCount={overdueCount}
        currentView={currentView}
        currentListId={currentListId}
        currentLabelId={currentLabelId}
        onViewChange={(view) => {
          setCurrentView(view);
          setCurrentListId(null);
          setCurrentLabelId(null);
        }}
        onListSelect={(listId) => {
          setCurrentListId(listId);
          setCurrentView('list');
          setCurrentLabelId(null);
        }}
        onLabelSelect={(labelId) => {
          setCurrentLabelId(labelId);
          setCurrentView('list');
          setCurrentListId(null);
        }}
        onCreateList={() => setCreateListOpen(true)}
        onCreateLabel={() => setCreateLabelOpen(true)}
      />
      
      <main className="flex-1 overflow-y-auto md:ml-64">
        <div className="container max-w-5xl py-8 px-4 md:px-8">
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{viewInfo.title}</h1>
                <p className="text-muted-foreground mt-1">{viewInfo.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-completed"
                    checked={filters.showCompleted}
                    onCheckedChange={(checked) => setFilters({ showCompleted: checked as boolean })}
                  />
                  <label htmlFor="show-completed" className="text-sm cursor-pointer">
                    Show completed
                  </label>
                </div>
                <Button onClick={() => { setSelectedTask(null); setTaskDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" onClick={handleSearch}>Search</Button>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Try: 'Lunch with Sarah tomorrow at 1pm'"
                value={nlInput}
                onChange={(e) => setNlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && parseNaturalLanguage()}
                className="flex-1"
              />
              <Button onClick={parseNaturalLanguage}>Add</Button>
            </div>
          </div>

          <TaskList
            tasks={tasks}
            emptyState={searchQuery ? "No tasks found" : "No tasks yet. Create your first one! 🎯"}
            onToggleComplete={handleToggleComplete}
            onEditTask={(task) => { setSelectedTask(task); setTaskDialogOpen(true); }}
            onDeleteTask={handleDeleteTask}
            onPreviewTask={setPreviewTask}
          />
        </div>
      </main>

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={(open) => {
          setTaskDialogOpen(open);
          if (!open) setSelectedTask(null);
        }}
        lists={lists}
        task={selectedTask}
        defaultDate={currentView === 'today' ? new Date().toISOString().split('T')[0] : undefined}
        onSubmit={selectedTask ? handleUpdateTask : handleCreateTask}
      />

      <Dialog open={!!previewTask} onOpenChange={() => setPreviewTask(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTask?.name}</DialogTitle>
          </DialogHeader>
          {previewTask && (
            <div className="space-y-4">
              {previewTask.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{previewTask.description}</p>
                </div>
              )}
              {previewTask.logs && previewTask.logs.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Activity Log</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {previewTask.logs.map((log) => (
                      <div key={log.id} className="text-sm p-2 rounded border">
                        <div className="font-medium capitalize">{log.action.replace(/_/g, ' ')}</div>
                        <div className="text-muted-foreground text-xs">
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createListOpen} onOpenChange={setCreateListOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="list-name">List Name</Label>
              <Input
                id="list-name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Enter list name..."
              />
            </div>
            <div>
              <Label>Emoji</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewListEmoji(emoji)}
                    className={`text-2xl p-2 rounded border-2 ${newListEmoji === emoji ? 'border-primary' : 'border-transparent'}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {COLOR_LIST.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewListColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${newListColor === color ? 'border-foreground' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateListOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateList}>Create List</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createLabelOpen} onOpenChange={setCreateLabelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Label</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="label-name">Label Name</Label>
              <Input
                id="label-name"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Enter label name..."
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {COLOR_LIST.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewLabelColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${newLabelColor === color ? 'border-foreground' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateLabelOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateLabel}>Create Label</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

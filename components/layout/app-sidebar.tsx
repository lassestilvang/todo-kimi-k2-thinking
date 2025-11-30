'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Plus, Inbox, Calendar, CalendarDays, ListTodo, CheckSquare, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { List } from '@/lib/types'

interface AppSidebarProps {
  onAddTask: () => void
  onSearch: (query: string) => void
}

export function AppSidebar({ onAddTask, onSearch }: AppSidebarProps) {
  const [query, setQuery] = useState('')
  const [lists, setLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showLists, setShowLists] = useState(true)
  const [showViews, setShowViews] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()

  // Views configuration
  const views = [
    { id: 'today', name: 'Today', icon: Calendar, badge: 0 },
    { id: 'next7days', name: 'Next 7 Days', icon: CalendarDays, badge: 0 },
    { id: 'upcoming', name: 'Upcoming', icon: Calendar, badge: 0 },
    { id: 'all', name: 'All', icon: ListTodo, badge: 0 },
  ]

  // Special lists
  const specialLists = [
    { id: 'inbox', name: 'Inbox', icon: Inbox, color: 'text-blue-500' },
  ]

  // Load lists from API
  useEffect(() => {
    loadLists()
  }, [])

  const loadLists = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/lists')
      if (!response.ok) throw new Error('Failed to load lists')
      
      const listsData = await response.json()
      setLists(listsData)
    } catch (error) {
      console.error('Error loading lists:', error)
      toast({
        title: 'Error',
        description: 'Failed to load lists',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, onSearch])

  const handleNavigation = (viewId: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('view', viewId)
    window.history.pushState({}, '', url)
    window.dispatchEvent(new Event('popstate'))
  }

  const isActive = (viewId: string) => {
    const params = new URLSearchParams(window.location.search)
    const currentView = params.get('view') || 'today'
    return currentView === viewId
  }

  return (
    <div className="flex h-full flex-col border-r bg-card w-80">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Daily Planner</span>
        </div>
      </div>

      {/* Add Task Button */}
      <div className="p-4">
        <Button 
          className="w-full gap-2" 
          onClick={onAddTask}
          size="default"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        {/* Views Section */}
        <div className="px-2">
          <button
            onClick={() => setShowViews(!showViews)}
            className="flex items-center justify-between w-full px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>VIEWS</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showViews ? '' : '-rotate-90'}`} />
          </button>
          
          {showViews && (
            <div className="space-y-1">
              {views.map((view) => {
                const Icon = view.icon
                const active = isActive(view.id)
                
                return (
                  <button
                    key={view.id}
                    onClick={() => handleNavigation(view.id)}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{view.name}</span>
                    </div>
                    {view.badge > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        active
                          ? 'bg-primary-foreground text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {view.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Lists Section */}
        <div className="px-2">
          <button
            onClick={() => setShowLists(!showLists)}
            className="flex items-center justify-between w-full px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>LISTS</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showLists ? '' : '-rotate-90'}`} />
          </button>
          
          {showLists && (
            <div className="space-y-1">
              {/* Special Lists (Inbox) */}
              {specialLists.map((list) => {
                const Icon = list.icon
                const active = isActive(list.id)
                
                return (
                  <button
                    key={list.id}
                    onClick={() => handleNavigation(list.id)}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${list.color}`} />
                      <span>{list.name}</span>
                    </div>
                  </button>
                )
              })}

              {/* Custom Lists */}
              {lists.filter(list => !list.is_inbox).map((list) => {
                const active = isActive(list.id)
                
                return (
                  <button
                    key={list.id}
                    onClick={() => handleNavigation(list.id)}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{list.icon}</span>
                      <span>{list.name}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
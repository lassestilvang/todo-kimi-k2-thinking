'use client';

import { useState } from 'react';
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Menu,
  Plus,
  Tag,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { List, Label, ViewType } from '@/lib/types';

interface SidebarProps {
  lists: List[];
  labels: Label[];
  overdueCount: number;
  currentView: ViewType;
  currentListId: string | null;
  currentLabelId: string | null;
  onViewChange: (view: ViewType) => void;
  onListSelect: (listId: string) => void;
  onLabelSelect: (labelId: string) => void;
  onCreateList: () => void;
  onCreateLabel: () => void;
}

const views: { id: ViewType; name: string; icon: React.ElementType }[] = [
  { id: 'today', name: 'Today', icon: Calendar },
  { id: 'next_7_days', name: 'Next 7 Days', icon: CalendarDays },
  { id: 'upcoming', name: 'Upcoming', icon: CalendarRange },
  { id: 'all', name: 'All Tasks', icon: CheckCircle2 },
];

export function Sidebar({
  lists,
  labels,
  overdueCount,
  currentView,
  currentListId,
  currentLabelId,
  onViewChange,
  onListSelect,
  onLabelSelect,
  onCreateList,
  onCreateLabel,
}: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleViewClick = (view: ViewType) => {
    onViewChange(view);
    setIsMobileOpen(false);
  };

  const handleListClick = (listId: string) => {
    onListSelect(listId);
    setIsMobileOpen(false);
  };

  const handleLabelClick = (labelId: string) => {
    onLabelSelect(labelId);
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-5">
        <h2 className="text-lg font-semibold tracking-tight">Daily Planner</h2>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6 pb-4">
          <div>
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Views
            </h3>
            <div className="space-y-1">
              {views.map((view) => (
                <Button
                  key={view.id}
                  variant={currentView === view.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => handleViewClick(view.id)}
                >
                  <view.icon className="mr-2 h-4 w-4" />
                  {view.name}
                  {view.id === 'today' && overdueCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-auto"
                    >
                      {overdueCount}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <div className="mb-2 flex items-center justify-between px-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Lists
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onCreateList}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {lists.map((list) => (
                <Button
                  key={list.id}
                  variant={currentListId === list.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => handleListClick(list.id)}
                >
                  <span className="mr-2 text-lg">{list.emoji}</span>
                  <span className="flex-1 text-left">{list.name}</span>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <div className="mb-2 flex items-center justify-between px-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Labels
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onCreateLabel}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {labels.map((label) => (
                <Button
                  key={label.id}
                  variant={currentLabelId === label.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => handleLabelClick(label.id)}
                >
                  <Tag className="mr-2 h-4 w-4" style={{ color: label.color }} />
                  <span className="flex-1 text-left">{label.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-40 md:hidden"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card transition-transform md:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>

      <aside className="hidden h-screen w-64 border-r bg-card md:block">
        {sidebarContent}
      </aside>
    </>
  );
}

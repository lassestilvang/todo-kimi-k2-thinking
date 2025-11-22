import { create } from 'zustand';
import type { Task, List, Label, FilterOptions, ViewType } from '../types';

interface TasksState {
  tasks: Task[];
  lists: List[];
  labels: Label[];
  currentView: ViewType;
  currentListId: string | null;
  currentLabelId: string | null;
  filters: FilterOptions;
  isLoading: boolean;
  error: string | null;

  setTasks: (tasks: Task[]) => void;
  setLists: (lists: List[]) => void;
  setLabels: (labels: Label[]) => void;
  setCurrentView: (view: ViewType) => void;
  setCurrentListId: (listId: string | null) => void;
  setCurrentLabelId: (labelId: string | null) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  addTask: (task: Task) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  removeTask: (id: string) => void;
  
  addList: (list: List) => void;
  updateList: (id: string, list: Partial<List>) => void;
  removeList: (id: string) => void;
  
  addLabel: (label: Label) => void;
  updateLabel: (id: string, label: Partial<Label>) => void;
  removeLabel: (id: string) => void;
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  lists: [],
  labels: [],
  currentView: 'today',
  currentListId: null,
  currentLabelId: null,
  filters: {
    showCompleted: false,
  },
  isLoading: false,
  error: null,

  setTasks: (tasks) => set({ tasks }),
  setLists: (lists) => set({ lists }),
  setLabels: (labels) => set({ labels }),
  setCurrentView: (currentView) => set({ currentView }),
  setCurrentListId: (currentListId) => set({ currentListId }),
  setCurrentLabelId: (currentLabelId) => set({ currentLabelId }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task,
      ),
    })),
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),

  addList: (list) => set((state) => ({ lists: [...state.lists, list] })),
  updateList: (id, updates) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === id ? { ...list, ...updates } : list,
      ),
    })),
  removeList: (id) =>
    set((state) => ({
      lists: state.lists.filter((list) => list.id !== id),
    })),

  addLabel: (label) => set((state) => ({ labels: [...state.labels, label] })),
  updateLabel: (id, updates) =>
    set((state) => ({
      labels: state.labels.map((label) =>
        label.id === id ? { ...label, ...updates } : label,
      ),
    })),
  removeLabel: (id) =>
    set((state) => ({
      labels: state.labels.filter((label) => label.id !== id),
    })),
}));

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Task {
  id: string;
  type: string;
  status: string;
  progress: number;
  result: any;
  error: string | null;
  createdAt: string;
  prompt?: string;
}

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  activeTaskId: string | null;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  setIsLoading: (loading: boolean) => void;
  setActiveTaskId: (taskId: string | null) => void;
  getTask: (taskId: string) => Task | undefined;
  getActiveTask: () => Task | undefined;
  clearCompletedTasks: () => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      isLoading: false,
      activeTaskId: null,
      
      setTasks: (tasks) => set({ tasks }),
      
      addTask: (task) =>
        set((state) => ({
          tasks: [...state.tasks, task],
        })),
      
      updateTask: (taskId, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
          ),
        })),
      
      removeTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
          activeTaskId: state.activeTaskId === taskId ? null : state.activeTaskId,
        })),
      
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      setActiveTaskId: (taskId) => set({ activeTaskId: taskId }),
      
      getTask: (taskId) => get().tasks.find((task) => task.id === taskId),
      
      getActiveTask: () => {
        const { activeTaskId, tasks } = get();
        return activeTaskId ? tasks.find((t) => t.id === activeTaskId) : undefined;
      },
      
      clearCompletedTasks: () =>
        set((state) => ({
          tasks: state.tasks.filter(
            (t) => t.status !== "completed" && t.status !== "failed"
          ),
        })),
    }),
    {
      name: "ai-task-storage",
    }
  )
);

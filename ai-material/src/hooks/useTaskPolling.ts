import { useEffect, useRef } from "react";

interface Task {
  status: string;
  error?: string;
}

export interface TaskPollingOptions<T = unknown> {
  taskId: string;
  onUpdate?: (task: T) => void;
  onCompleted?: (task: T) => void;
  onFailed?: (error: string, task: T) => void;
  fetchTask: (taskId: string) => Promise<{ data: T }>;
  interval?: number;
  enabled?: boolean;
}

export function useTaskPolling<T = unknown>({
  taskId,
  onUpdate,
  onCompleted,
  onFailed,
  fetchTask,
  interval = 1000,
  enabled = true,
}: TaskPollingOptions<T>) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !taskId) return;

    const poll = async () => {
      try {
        const { data: task } = await fetchTask(taskId);
        onUpdate?.(task);

        if ((task as unknown as Task).status === "completed") {
          stopPolling();
          onCompleted?.(task);
        } else if ((task as unknown as Task).status === "failed") {
          stopPolling();
          onFailed?.((task as unknown as Task).error || "任务失败", task);
        }
      } catch (error) {
        console.error("轮询任务失败:", error);
      }
    };

    const startPolling = () => {
      poll();
      intervalRef.current = setInterval(poll, interval);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startPolling();
    return stopPolling;
  }, [taskId, enabled, interval, fetchTask, onUpdate, onCompleted, onFailed]);
}

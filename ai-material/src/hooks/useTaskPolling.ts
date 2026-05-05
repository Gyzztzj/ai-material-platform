import { useEffect, useRef } from "react";

export interface TaskPollingOptions {
  taskId: string;
  onUpdate?: (task: any) => void;
  onCompleted?: (task: any) => void;
  onFailed?: (error: string, task: any) => void;
  fetchTask: (taskId: string) => Promise<any>;
  interval?: number;
  enabled?: boolean;
}

export function useTaskPolling({
  taskId,
  onUpdate,
  onCompleted,
  onFailed,
  fetchTask,
  interval = 1000,
  enabled = true,
}: TaskPollingOptions) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !taskId) return;

    const poll = async () => {
      try {
        const { data: task } = await fetchTask(taskId);
        onUpdate?.(task);

        if (task.status === "completed") {
          stopPolling();
          onCompleted?.(task);
        } else if (task.status === "failed") {
          stopPolling();
          onFailed?.(task.error || "任务失败", task);
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

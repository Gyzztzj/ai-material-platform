import { useState, useEffect, useRef, useCallback } from "react";
import { aiApi } from "../services/api/ai.api";
import { userApi } from "../services/api/user.api";
import { useUserStore } from "../store/user.store";
import { useTaskStore } from "../store/task.store";
import { toast } from "../components/ui/Toast";

interface GenerateResult {
  images: string[];
}

/** 指数退避参数 */
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 16000;

export function useAIGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const setUser = useUserStore((state) => state.setUser);
  const { addTask, updateTask, setActiveTaskId, getActiveTask, removeTask } = useTaskStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentDelayRef = useRef(BASE_DELAY_MS);
  const stoppedRef = useRef(false);
  const pollRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const scheduleNext = useCallback((delayMs: number) => {
    timerRef.current = setTimeout(() => pollRef.current(), delayMs);
  }, []);

  // 清理函数
  const cleanup = useCallback(() => {
    stoppedRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startPolling = useCallback((taskId: string) => {
    cleanup();
    stoppedRef.current = false;
    currentDelayRef.current = BASE_DELAY_MS;

    let retryCount = 0;
    const maxRetries = 5;

    const poll = async () => {
      if (stoppedRef.current) return;

      try {
        const { data: task } = await aiApi.getTask(taskId);
        retryCount = 0;

        setProgress(task.progress);
        updateTask(taskId, {
          progress: task.progress,
          status: task.status,
          result: task.result,
          error: task.error,
        });

        if (task.status === "completed") {
          cleanup();
          setResult(task.result);
          setIsGenerating(false);
          setActiveTaskId(null);
          toast("图片生成成功！已保存到素材库", "success");

          const { data: userData } = await userApi.getProfile();
          setUser(userData);
          return;
        } else if (task.status === "failed") {
          cleanup();
          setIsGenerating(false);
          setActiveTaskId(null);
          toast(task.error || "生成失败", "error");
          return;
        }

        // 指数退避：成功获取后翻倍
        currentDelayRef.current = Math.min(currentDelayRef.current * 2, MAX_DELAY_MS);
        scheduleNext(currentDelayRef.current);
      } catch (error) {
        console.error("轮询任务失败:", error);
        retryCount++;

        if (retryCount >= maxRetries) {
          cleanup();
          setIsGenerating(false);
          toast("网络连接失败，任务仍在后台执行，请稍后查看素材库", "error");
          return;
        }

        // 出错时也增加延迟
        currentDelayRef.current = Math.min(currentDelayRef.current * 1.5, MAX_DELAY_MS);
        scheduleNext(currentDelayRef.current);
      }
    };

    pollRef.current = poll;
    // 首次立即执行
    poll();
  }, [cleanup, updateTask, setActiveTaskId, setUser, scheduleNext]);

  // 检查是否有进行中的任务需要恢复
  useEffect(() => {
    const activeTask = getActiveTask();
    if (activeTask && (activeTask.status === "pending" || activeTask.status === "processing")) {
      // 恢复轮询
      setIsGenerating(true);
      setProgress(activeTask.progress);
      startPolling(activeTask.id);
    }
  }, [getActiveTask, startPolling]);

  // 组件卸载时清理
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const generateImage = async (prompt: string, size: string = "1024x1024", modelId?: string) => {
    // 清理之前的轮询
    cleanup();
    
    setIsGenerating(true);
    setProgress(0);
    setResult(null);

    try {
      const { data } = await aiApi.generateImage(prompt, size, modelId);
      const taskId = data.taskId.toString();

      // 添加任务到 store
      addTask({
        id: taskId,
        type: "generate",
        status: "pending",
        progress: 0,
        result: null,
        error: null,
        createdAt: new Date().toISOString(),
        prompt,
      });
      setActiveTaskId(taskId);

      toast("生成任务已创建，请稍候...", "info");
      startPolling(taskId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "生成失败";
      setIsGenerating(false);
      toast(errorMessage, "error");
    }
  };

  const cancelTask = useCallback(() => {
    cleanup();
    setIsGenerating(false);
    setProgress(0);
    setResult(null);
    const activeTask = getActiveTask();
    if (activeTask) {
      removeTask(activeTask.id);
      setActiveTaskId(null);
    }
  }, [cleanup, getActiveTask, removeTask, setActiveTaskId]);

  return { isGenerating, progress, result, generateImage, cleanup, cancelTask };
}

import { useState, useEffect, useRef, useCallback } from "react";
import { aiApi } from "../services/api/ai.api";
import { userApi } from "../services/api/user.api";
import { useUserStore } from "../store/user.store";
import { useTaskStore } from "../store/task.store";
import { toast } from "../components/ui/Toast";

export function useAIGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ images: string[] } | null>(null);
  const setUser = useUserStore((state) => state.setUser);
  const { addTask, updateTask, setActiveTaskId, getActiveTask, removeTask } = useTaskStore();
  const intervalRef = useRef<number | null>(null);

  // 清理函数
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 检查是否有进行中的任务需要恢复
  useEffect(() => {
    const activeTask = getActiveTask();
    if (activeTask && (activeTask.status === "pending" || activeTask.status === "processing")) {
      // 恢复轮询
      setIsGenerating(true);
      setProgress(activeTask.progress);
      startPolling(activeTask.id);
    }
  }, [getActiveTask]);

  // 组件卸载时清理
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startPolling = useCallback((taskId: string) => {
    cleanup();
    
    let retryCount = 0;
    const maxRetries = 5;

    const poll = async () => {
      try {
        const { data: task } = await aiApi.getTask(taskId);
        retryCount = 0; // 重置重试计数

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
        } else if (task.status === "failed") {
          cleanup();
          setIsGenerating(false);
          setActiveTaskId(null);
          toast(task.error || "生成失败", "error");
        }
      } catch (error) {
        console.error("轮询任务失败:", error);
        retryCount++;
        
        if (retryCount >= maxRetries) {
          cleanup();
          setIsGenerating(false);
          toast("网络连接失败，任务仍在后台执行，请稍后查看素材库", "error");
        }
      }
    };

    // 立即执行一次
    poll();
    
    // 启动轮询
    intervalRef.current = window.setInterval(poll, 1500);
  }, [cleanup, updateTask, setActiveTaskId, setUser]);

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
    } catch (err: any) {
      setIsGenerating(false);
      toast(err.message || "生成失败", "error");
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

import { useState, useRef, useEffect, useCallback } from "react";
import { aiApi } from "../services/api/ai.api";
import { materialApi } from "../services/api/material.api";
import { userApi } from "../services/api/user.api";
import { useUserStore } from "../store/user.store";
import { toast } from "../components/ui/Toast";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import ImageEditor from "../components/editor/ImageEditor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { getFullImageUrl, downloadFile, extractErrorMsg } from "../lib/utils";
import { useTaskPolling } from "../hooks/useTaskPolling";

export default function RemoveBgPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const setUser = useUserStore((state) => state.setUser);

  // Polling state for useTaskPolling hook
  const [pollingTaskId, setPollingTaskId] = useState("");
  const [pollingEnabled, setPollingEnabled] = useState(false);

  useTaskPolling({
    taskId: pollingTaskId,
    enabled: pollingEnabled,
    fetchTask: (id: string) => aiApi.getTask(id),
    interval: 2000,
    maxFailures: 5,
    onUpdate: (task: any) => {
      setProgress(task.progress);
    },
    onCompleted: async (task: any) => {
      setPollingEnabled(false);
      setResultUrl(getFullImageUrl(task.result.processed));
      setIsProcessing(false);
      toast("抠图成功！", "success");
      const { data: userData } = await userApi.getProfile();
      setUser(userData);
    },
    onFailed: (error: string) => {
      setPollingEnabled(false);
      setIsProcessing(false);
      toast(error, "error");
    },
    onError: () => {
      setPollingEnabled(false);
      setIsProcessing(false);
      toast("请求过于频繁，请稍后重试", "error");
    },
  });

  const handleRemoveBg = useCallback(async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(0);
    setResultUrl(null);

    try {
      const { data: uploadResult } = await materialApi.upload(selectedFile);

      toast("图片上传成功，开始抠图...", "info");

      const imageUrl = uploadResult.url;
      const { data: taskResult } = await aiApi.removeBackground(imageUrl);
      setPollingTaskId(taskResult.taskId);
      setPollingEnabled(true);
    } catch (error) {
      const errorMessage = extractErrorMsg(error, "抠图失败，请重试");
      console.error("抠图出错:", error);
      setIsProcessing(false);
      toast(errorMessage, "error");
    }
  }, [selectedFile, setUser]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (!isProcessing && selectedFile) {
          e.preventDefault();
          handleRemoveBg();
        }
      }
    },
    [isProcessing, selectedFile, handleRemoveBg],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setResultUrl(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const downloadResult = async () => {
    if (!resultUrl) return;
    await downloadFile(resultUrl, `bg-removed-${Date.now()}.png`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">AI智能抠图</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg h-80 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="预览"
                loading="lazy"
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            ) : (
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">点击上传图片</p>
                <p className="text-sm">支持JPG、PNG、WEBP格式，最大5MB</p>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />

          <div className="flex gap-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
              className="flex-1"
            >
              选择图片
            </Button>
            <Button
              onClick={handleRemoveBg}
              disabled={!selectedFile || isProcessing}
              loading={isProcessing}
              className="flex-1"
            >
              一键抠图
            </Button>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-gray-500 text-center">
                处理进度: {progress}%
              </p>
            </div>
          )}
        </div>

        <div>
          <h3 className="font-bold mb-4">抠图结果</h3>
          {resultUrl ? (
            <div className="space-y-4">
              <div className="border rounded-lg p-2 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMVDxQo1G0WXwAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAUSURBVDjLY2AYBaNgFIyCUTAKRsEAAGQAAd0e6RsAAAAASUVORK5CYII=')]">
                <img
                  src={resultUrl}
                  alt="抠图结果"
                  loading="lazy"
                  className="w-full rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setEditImageUrl(resultUrl);
                    setShowEditor(true);
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  编辑图片
                </Button>
                <Button onClick={downloadResult} className="flex-1">
                  下载
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg h-80 flex items-center justify-center text-gray-400">
              {isProcessing ? (
                <LoadingSpinner size="lg" />
              ) : (
                "抠图结果将显示在这里"
              )}
            </div>
          )}
        </div>
      </div>

      {showEditor && editImageUrl && (
        <Dialog open={showEditor} onOpenChange={setShowEditor}>
          <DialogContent className="w-[90vw] min-w-[800px]">
            <DialogHeader>
              <DialogTitle>图片编辑</DialogTitle>
            </DialogHeader>
            <ImageEditor
              imageUrl={editImageUrl}
              onSave={(editedUrl) => {
                setResultUrl(editedUrl); // 直接更新显示的图片
                setShowEditor(false);
                toast("图片编辑完成！已保存到素材库", "success");
              }}
              onCancel={() => setShowEditor(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

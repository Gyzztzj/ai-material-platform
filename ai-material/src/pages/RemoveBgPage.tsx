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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (!isProcessing && selectedFile) {
          e.preventDefault();
          handleRemoveBg();
        }
      }
    },
    [isProcessing, selectedFile],
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

  const handleRemoveBg = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(0);
    setResultUrl(null);

    try {
      const { data: uploadResult } = await materialApi.upload(selectedFile);

      toast("图片上传成功，开始抠图...", "info");

      const imageUrl = uploadResult.url;
      const { data: taskResult } = await aiApi.removeBackground(imageUrl);
      const taskId = taskResult.taskId;

      let failCount = 0;
      const MAX_FAILS = 5;

      const interval = setInterval(async () => {
        try {
          const { data: task } = await aiApi.getTask(taskId);
          failCount = 0;

          setProgress(task.progress);

          if (task.status === "completed") {
            clearInterval(interval);
            setResultUrl(
              `${import.meta.env.VITE_API_URL}${task.result.processed}`,
            );
            setIsProcessing(false);
            toast("抠图成功！", "success");
            const { data: userData } = await userApi.getProfile();
            setUser(userData);
          } else if (task.status === "failed") {
            clearInterval(interval);
            setIsProcessing(false);
            toast(task.error || "抠图失败", "error");
          }
        } catch (err) {
          console.error("轮询任务失败:", err);
          failCount++;

          if (failCount >= MAX_FAILS) {
            clearInterval(interval);
            setIsProcessing(false);
            toast("请求过于频繁，请稍后重试", "error");
          }
        }
      }, 2000);
    } catch (error: any) {
      console.error("抠图出错:", error);
      setIsProcessing(false);
      toast(
        error?.response?.data?.message || error?.message || "抠图失败，请重试",
        "error",
      );
    }
  };

  const downloadResult = async () => {
    if (!resultUrl) return;
    try {
      const response = await fetch(resultUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `bg-removed-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("下载失败:", error);
    }
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

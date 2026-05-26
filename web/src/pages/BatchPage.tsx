import { useState, useRef } from "react";
import { aiApi } from "../services/api/ai.api";
import { materialApi } from "../services/api/material.api";
import { toast } from "../components/ui/Toast";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { extractErrorMsg } from "../lib/utils";
import { useBatchTaskPolling } from "../hooks/useTaskPolling";

export default function BatchPage() {
  const [activeTab, setActiveTab] = useState("remove-bg");
  const [files, setFiles] = useState<File[]>([]);
  const [prompts, setPrompts] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Batch polling state for useBatchTaskPolling hook
  const [batchTaskIds, setBatchTaskIds] = useState<string[]>([]);
  const [batchPollingEnabled, setBatchPollingEnabled] = useState(false);
  const batchTypeRef = useRef<"remove-bg" | "generate">("remove-bg");

  useBatchTaskPolling({
    taskIds: batchTaskIds,
    enabled: batchPollingEnabled,
    fetchTask: (id: string) => aiApi.getTask(id),
    interval: 2000,
    maxFailures: 5,
    onUpdate: setCompletedCount,
    onAllDone: (completed: number) => {
      setBatchPollingEnabled(false);
      setIsProcessing(false);
      const msg =
        batchTypeRef.current === "remove-bg"
          ? `批量处理完成！成功${completed}张`
          : `批量生成完成！成功${completed}张`;
      toast(msg, "success");
    },
    onError: (error: string) => {
      setBatchPollingEnabled(false);
      setIsProcessing(false);
      toast(error, "error");
    },
  });

  const handleBatchRemoveBg = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setCompletedCount(0);
    setTotalCount(files.length);

    try {
      const uploadPromises = files.map(async (file) => {
        const { data } = await materialApi.upload(file);
        return { imageUrl: data.url };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      toast(`成功上传${files.length}张图片，开始批量抠图...`, "info");

      const { data } = await aiApi.batchRemoveBg(uploadedFiles);
      batchTypeRef.current = "remove-bg";
      setBatchTaskIds(data.taskIds);
      setBatchPollingEnabled(true);
    } catch (error) {
      const errorMessage = extractErrorMsg(error, "批量抠图失败，请重试");
      console.error("批量抠图出错:", error);
      setIsProcessing(false);
      toast(errorMessage, "error");
    }
  };

  const handleBatchGenerate = async () => {
    const promptList = prompts.split("\n").filter((p) => p.trim());
    if (promptList.length === 0) return;

    setIsProcessing(true);
    setCompletedCount(0);
    setTotalCount(promptList.length);

    try {
      const tasks = promptList.map((prompt) => ({
        prompt: prompt.trim(),
        size,
      }));
      toast(`创建${tasks.length}个生成任务...`, "info");

      const { data } = await aiApi.batchGenerate(tasks);
      batchTypeRef.current = "generate";
      setBatchTaskIds(data.taskIds);
      setBatchPollingEnabled(true);
    } catch (error) {
      const errorMessage = extractErrorMsg(error, "批量生成失败，请重试");
      console.error("批量生成出错:", error);
      setIsProcessing(false);
      toast(errorMessage, "error");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles].slice(0, 20));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">批量处理</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="remove-bg" className="flex-1">
            批量抠图
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex-1">
            批量生成
          </TabsTrigger>
        </TabsList>

        <TabsContent value="remove-bg" className="space-y-6 mt-6">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <p className="text-lg mb-2">点击上传多张图片</p>
            <p className="text-sm text-muted-foreground">
              支持JPG、PNG、WEBP格式，最多20张
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
          />

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">已选择 {files.length} 张图片</h3>
                <Button variant="ghost" size="sm" onClick={() => setFiles([])}>
                  清空
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {files.map((file, index) => (
                  <Card key={index} className="relative">
                    <CardContent className="p-1">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        loading="lazy"
                        className="w-full h-24 object-cover rounded"
                      />
                      <button
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                        onClick={() => removeFile(index)}
                      >
                        ×
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={(completedCount / totalCount) * 100} />
              <p className="text-sm text-muted-foreground text-center">
                处理进度: {completedCount}/{totalCount}
              </p>
            </div>
          )}

          <Button
            onClick={handleBatchRemoveBg}
            disabled={files.length === 0 || isProcessing}
            loading={isProcessing}
            className="w-full"
          >
            开始批量抠图
          </Button>
        </TabsContent>

        <TabsContent value="generate" className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                提示词列表（每行一个）
              </label>
              <Textarea
                placeholder="一只可爱的猫咪
一片美丽的星空
一座现代风格的建筑"
                value={prompts}
                onChange={(e) => setPrompts(e.target.value)}
                rows={10}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">图片尺寸</label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024x1024">1024x1024（正方形）</SelectItem>
                  <SelectItem value="1024x1792">1024x1792（竖版）</SelectItem>
                  <SelectItem value="1792x1024">1792x1024（横版）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <Progress value={(completedCount / totalCount) * 100} />
                <p className="text-sm text-muted-foreground text-center">
                生成进度: {completedCount}/{totalCount}
              </p>
              </div>
            )}

            <Button
              onClick={handleBatchGenerate}
              disabled={!prompts.trim() || isProcessing}
              loading={isProcessing}
              className="w-full"
            >
              开始批量生成
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <div className="border-t pt-4">
        <p className="text-sm text-muted-foreground">
          💡 提示：批量处理完成后，所有结果会自动保存到你的素材库中
        </p>
      </div>
    </div>
  );
}

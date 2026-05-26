import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "../ui/Toast";

import { aiApi } from "@/services/api/ai.api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import type { AIModel } from "../../lib/shared-types";
import { getFullImageUrl } from "../../lib/utils";
import { useTaskPolling } from "../../hooks/useTaskPolling";

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
}

export default function ImageEditor({
  imageUrl: initialImageUrl,
  onSave,
  onCancel,
}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(initialImageUrl);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [editTask, setEditTask] = useState("background_replace");
  const [editPrompt, setEditPrompt] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(
    undefined,
  );
  const [models, setModels] = useState<AIModel[]>([]);

  // Polling state for useTaskPolling hook
  const [pollingTaskId, setPollingTaskId] = useState("");
  const [pollingEnabled, setPollingEnabled] = useState(false);

  useTaskPolling({
    taskId: pollingTaskId,
    enabled: pollingEnabled,
    fetchTask: (id: string) => aiApi.getTask(id),
    interval: 2000,
    maxFailures: 5,
    onUpdate: undefined,
    onCompleted: (task: { result: { processed: string | string[] } }) => {
      setPollingEnabled(false);
      let newImageUrl = "";
      if (Array.isArray(task.result.processed)) {
        newImageUrl = getFullImageUrl(task.result.processed[0]);
      } else {
        newImageUrl = getFullImageUrl(task.result.processed);
      }

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setImage(img);
        drawImage(img);
        setCurrentImageUrl(newImageUrl);
        setIsAiProcessing(false);
        toast("AI编辑成功！请预览后点击保存", "success");
      };
      img.src = newImageUrl;
    },
    onFailed: (error: string) => {
      setPollingEnabled(false);
      setIsAiProcessing(false);
      toast(error, "error");
    },
    onError: () => {
      setPollingEnabled(false);
      setIsAiProcessing(false);
      toast("请求过于频繁，请稍后重试", "error");
    },
  });

  // 保存编辑后的图片
  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 如果没有进行任何变换调整，直接使用当前的图片 URL
    if (
      rotation === 0 &&
      scale === 1 &&
      brightness === 100 &&
      contrast === 100 &&
      saturation === 100
    ) {
      onSave(currentImageUrl);
    } else {
      // 否则从 canvas 导出调整后的图片
      const dataUrl = canvas.toDataURL("image/webp", 0.9);
      onSave(dataUrl);
    }
  }, [onSave, currentImageUrl, rotation, scale, brightness, contrast, saturation]);

  // 绘制图片到Canvas
  const drawImage = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 计算旋转后的画布尺寸
    const radians = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));
    const newWidth = img.width * cos + img.height * sin;
    const newHeight = img.width * sin + img.height * cos;

    canvas.width = newWidth * scale;
    canvas.height = newHeight * scale;

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 设置滤镜
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    // 平移和旋转
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(radians);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
  }, [rotation, scale, brightness, contrast, saturation]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl+S 保存编辑
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  }, [handleSave]);

  // 获取图片编辑模型
  useEffect(() => {
    const loadModels = async () => {
      try {
        const { data } = await aiApi.getModels("image-edit");
        setModels(data.imageEdit || []);
      } catch (err) {
        console.error("加载模型列表失败:", err);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // 加载图片
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      drawImage(img);
    };
    img.src = currentImageUrl;
  }, [currentImageUrl, drawImage]);

  // 当参数变化时重绘
  useEffect(() => {
    if (image) {
      drawImage(image);
    }
  }, [rotation, scale, brightness, contrast, saturation, image, drawImage]);

  // 重置所有参数
  const handleReset = () => {
    setRotation(0);
    setScale(1);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  const handleAiEdit = async () => {
    if (!currentImageUrl) return;

    if (!selectedModelId && models.length > 0) {
      setSelectedModelId(models[0].modelId);
    }

    setIsAiProcessing(true);
    try {
      const { data: response } = await aiApi.editImage(
        currentImageUrl.replace(import.meta.env.VITE_API_URL || "", ""),
        editPrompt,
        {
          task: editTask,
          modelId: selectedModelId || models[0]?.modelId,
          scale: editTask === "outpainting" ? scale : undefined,
        },
      );

      const taskId = response.taskId;
      if (!taskId) {
        throw new Error("任务ID未找到");
      }

      toast("AI编辑任务已创建，请稍候...", "info");

      setPollingTaskId(taskId);
      setPollingEnabled(true);
    } catch (error) {
      console.error("创建编辑任务失败:", error);
      setIsAiProcessing(false);
    }
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 max-h-[80vh]">
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="border rounded-lg p-4 bg-gray-50 h-full flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[50vh] object-contain"
          />
        </div>
      </div>

      <div className="lg:w-80 flex-shrink-0 overflow-y-auto space-y-6">
        <Tabs defaultValue="transform">
          <TabsList className="w-full">
            <TabsTrigger value="transform" className="flex-1">
              变换
            </TabsTrigger>
            <TabsTrigger value="adjust" className="flex-1">
              调整
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex-1">
              AI编辑
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transform" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">旋转: {rotation}°</label>
              <Slider
                value={[rotation]}
                min={-180}
                max={180}
                step={1}
                onValueChange={(value) => setRotation(value[0])}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                缩放: {Math.round(scale * 100)}%
              </label>
              <Slider
                value={[scale]}
                min={0.1}
                max={2}
                step={0.01}
                onValueChange={(value) => setScale(value[0])}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRotation(rotation - 90)}
                className="flex-1"
              >
                左旋90°
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRotation(rotation + 90)}
                className="flex-1"
              >
                右旋90°
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="adjust" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">亮度: {brightness}%</label>
              <Slider
                value={[brightness]}
                min={0}
                max={200}
                step={1}
                onValueChange={(value) => setBrightness(value[0])}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">对比度: {contrast}%</label>
              <Slider
                value={[contrast]}
                min={0}
                max={200}
                step={1}
                onValueChange={(value) => setContrast(value[0])}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                饱和度: {saturation}%
              </label>
              <Slider
                value={[saturation]}
                min={0}
                max={200}
                step={1}
                onValueChange={(value) => setSaturation(value[0])}
              />
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 mt-4">
            {models.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">选择模型</label>
                <Select
                  value={selectedModelId || models[0]?.modelId}
                  onValueChange={setSelectedModelId}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.modelId} value={model.modelId}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">编辑类型</label>
              <Select value={editTask} onValueChange={setEditTask}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="background_replace">背景替换</SelectItem>
                  <SelectItem value="outpainting">智能扩图</SelectItem>
                  <SelectItem value="style_transfer">风格迁移</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editTask === "background_replace" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">新背景描述</label>
                <Input
                  placeholder="例如：蓝色天空下的海滩"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                />
              </div>
            )}

            {editTask === "outpainting" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">扩图倍数</label>
                <Select
                  value={scale.toString()}
                  onValueChange={(v) => setScale(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.5">1.5倍</SelectItem>
                    <SelectItem value="2">2倍</SelectItem>
                    <SelectItem value="3">3倍</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {editTask === "style_transfer" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">目标风格</label>
                <Input
                  placeholder="例如：梵高油画风格"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                />
              </div>
            )}

            <Button
              onClick={handleAiEdit}
              disabled={isAiProcessing}
              className="w-full"
            >
              {isAiProcessing ? "处理中..." : "开始AI编辑"}
            </Button>
          </TabsContent>
        </Tabs>

        <div className="space-y-2 pt-4 border-t">
          <Button onClick={handleReset} variant="secondary" className="w-full">
            重置
          </Button>
          <Button onClick={handleSave} className="w-full">
            保存编辑
          </Button>
          <Button onClick={onCancel} variant="ghost" className="w-full">
            取消
          </Button>
        </div>
      </div>
    </div>
  );
}

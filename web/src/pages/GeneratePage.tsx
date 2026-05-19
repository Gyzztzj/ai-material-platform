import { useState, useEffect, useCallback, useMemo } from "react";
import { useAIGeneration } from "../hooks/useAIGeneration";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Card, CardContent } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Skeleton } from "../components/ui/Skeleton";
import ImageEditor from "../components/editor/ImageEditor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "../components/ui/Toast";
import { aiApi } from "../services/api/ai.api";
import {
  PROMPT_TEMPLATES,
  HOT_PROMPTS,
  STYLE_OPTIONS,
} from "../constants/prompt-templates";
import { Download, Edit3, Wand2, Sparkles } from "lucide-react";

export interface SizeOption {
  value: string;
  label: string;
  aspectRatio: string;
}

export interface AIModel {
  modelId: string;
  name: string;
  provider: string;
  model: string;
  cost: number;
  quality: number;
  enabled: boolean;
  supportedSizes?: SizeOption[];
}

const FALLBACK_SIZES: SizeOption[] = [
  { value: "1024*1024", label: "1024×1024（正方形）", aspectRatio: "1:1" },
];

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [selectedModelId, setSelectedModelId] =
    useState<string>("tongyi-wanx-26");
  const [size, setSize] = useState<string>("1024*1024");
  const [models, setModels] = useState<AIModel[]>([]);
  const { isGenerating, progress, result, generateImage } = useAIGeneration();
  const [showEditor, setShowEditor] = useState(false);
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [editingImageIndex, setEditingImageIndex] = useState<number>(0);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState("通用");
  const [isOptimizing, setIsOptimizing] = useState(false);

  // 获取当前选中的模型
  const selectedModel = useMemo(() => {
    return models.find((m) => m.modelId === selectedModelId);
  }, [models, selectedModelId]);

  // 获取当前模型支持的尺寸
  const supportedSizes = useMemo(() => {
    return selectedModel?.supportedSizes || FALLBACK_SIZES;
  }, [selectedModel]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const { data } = await aiApi.getModels("generate");
        setModels(data.generate || []);
      } catch (err) {
        console.error("加载模型列表失败:", err);
      }
    };
    loadModels();
  }, []);

  // 当初始加载或模型切换时，设置默认尺寸
  useEffect(() => {
    if (supportedSizes.length > 0) {
      // 如果当前选择的尺寸在新模型中不支持，则切换到默认
      const currentSizeSupported = supportedSizes.some((s) => s.value === size);
      if (!currentSizeSupported) {
        setSize(supportedSizes[0].value);
      }
    }
  }, [supportedSizes, size]);

  // 监听 result 变化，更新 resultImages
  useEffect(() => {
    if (result?.images) {
      setResultImages(result.images);
    }
  }, [result]);

  const handleModelChange = (newModelId: string) => {
    setSelectedModelId(newModelId);
    // 尺寸会在上面的useEffect中自动处理
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (!isGenerating && prompt.trim()) {
          e.preventDefault();
          generateImage(prompt, size, selectedModelId);
        }
      }
    },
    [isGenerating, prompt, size, selectedModelId, generateImage],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleOptimizePrompt = async () => {
    if (!prompt.trim()) return;

    setIsOptimizing(true);
    try {
      const { data } = await aiApi.optimizePrompt(prompt, selectedStyle);
      setPrompt(data.optimizedPrompt);
      toast("提示词优化成功！", "success");
    } catch (error) {
      console.error("提示词优化失败:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const getFullImageUrl = (imageUrl: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    return `${baseUrl}${imageUrl}`;
  };

  // 从编辑后的 URL 中提取路径部分
  const extractImagePath = (editedUrl: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    if (editedUrl.startsWith(baseUrl)) {
      return editedUrl.replace(baseUrl, "");
    }
    // 如果是 data URL，暂时不处理，这种情况应该不会发生
    return editedUrl;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    generateImage(prompt, size, selectedModelId);
  };

  const downloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}${imageUrl}`,
      );
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `ai-generated-${Date.now()}.webp`;
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
      <h1 className="text-2xl font-bold">AI图片生成</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label>提示词</label>
              <Textarea
                placeholder="描述你想要生成的图片..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={8}
                required
              />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Sparkles className="w-4 h-4" />
                  <span>热门提示词</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {HOT_PROMPTS.map((hotPrompt) => (
                    <button
                      key={hotPrompt.name}
                      type="button"
                      onClick={() => setPrompt(hotPrompt.prompt)}
                      className="inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-all hover:bg-blue-50 hover:border-blue-200"
                    >
                      {hotPrompt.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>风格模板</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PROMPT_TEMPLATES.map((template) => (
                    <button
                      key={template.name}
                      type="button"
                      onClick={() => setPrompt(template.prefix + prompt)}
                      className="inline-flex items-center rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label>AI 模型</label>
              <Select value={selectedModelId} onValueChange={handleModelChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.modelId} value={model.modelId}>
                      {model.name} (质量: {model.quality}/100)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label>图片尺寸</label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedSizes.map((sizeOption) => (
                    <SelectItem key={sizeOption.value} value={sizeOption.value}>
                      {sizeOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label>风格</label>
              <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_OPTIONS.map((style) => (
                    <SelectItem key={style} value={style}>
                      {style}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleOptimizePrompt}
                variant="secondary"
                disabled={!prompt.trim() || isOptimizing}
                loading={isOptimizing}
                className="flex-1"
              >
                <Wand2 className="size-4" />
                AI优化提示词
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isGenerating || !prompt.trim()}
                loading={isGenerating}
              >
                生成图片
              </Button>
            </div>

            {isGenerating && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-gray-500 text-center">
                  生成进度: {progress}%
                </p>
              </div>
            )}
          </form>
        </div>

        <div>
          <h3 className="font-bold mb-4">生成结果</h3>
          {isGenerating ? (
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardContent className="p-0">
                  <Skeleton className="w-full aspect-square rounded-xl" />
                </CardContent>
              </Card>
            </div>
          ) : resultImages.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {resultImages.map((image, index) => (
                <Card key={index} className="overflow-hidden group">
                  <CardContent className="p-0 relative">
                    <img
                      src={getFullImageUrl(image)}
                      alt={`生成的图片 ${index + 1}`}
                      loading="lazy"
                      className="w-full rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
                      onError={(e) => {
                        console.error("图片加载失败:", getFullImageUrl(image));
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext fill="%239ca3af" font-family="Arial" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E图片加载失败%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button
                        size="icon-sm"
                        variant="secondary"
                        onClick={() => {
                          setEditImageUrl(
                            `${import.meta.env.VITE_API_URL}${image}`,
                          );
                          setEditingImageIndex(index);
                          setShowEditor(true);
                        }}
                      >
                        <Edit3 className="size-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="secondary"
                        onClick={() => downloadImage(image)}
                      >
                        <Download className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-xl h-96 flex items-center justify-center text-gray-400">
              生成的图片将显示在这里
            </div>
          )}
        </div>
      </div>
      {showEditor && editImageUrl && (
        <Dialog open={showEditor} onOpenChange={setShowEditor}>
          <DialogContent className="max-w-6xl">
            <DialogHeader>
              <DialogTitle>图片编辑</DialogTitle>
            </DialogHeader>
            <ImageEditor
              imageUrl={editImageUrl}
              onSave={(editedUrl) => {
                // 更新显示的图片
                const newImagePath = extractImagePath(editedUrl);
                const newResultImages = [...resultImages];
                newResultImages[editingImageIndex] = newImagePath;
                setResultImages(newResultImages);
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

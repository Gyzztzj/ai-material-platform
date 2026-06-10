import { useState, useRef, useEffect } from 'react'
import { aiApi } from '../services/api/ai.api'
import {
  materialApi,
  type PreprocessConfig,
} from '../services/api/material.api'
import type { Material } from '../services/api/material.api'
import { toast } from '../components/ui/Toast'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Textarea } from '../components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Slider } from '../components/ui/slider'
import { Input } from '../components/ui/input'
import { extractErrorMsg, getFullImageUrl } from '../lib/utils'
import { useBatchTaskPolling } from '../hooks/useTaskPolling'
import { CheckSquare, Square, ImageIcon, Search } from 'lucide-react'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

const PRESET_SIZES = [
  { width: 1920, height: 1080, label: '1920x1080 (全高清)' },
  { width: 1280, height: 720, label: '1280x720 (高清)' },
  { width: 1024, height: 1024, label: '1024x1024 (正方形)' },
  { width: 1024, height: 1792, label: '1024x1792 (竖版)' },
  { width: 1792, height: 1024, label: '1792x1024 (横版)' },
  { width: 800, height: 600, label: '800x600' },
  { width: 400, height: 400, label: '400x400 (缩略图)' },
]

// ====== 素材选择面板（独立组件，避免每次渲染重建导致输入框失焦等问题） ======
interface MaterialPickerProps {
  materials: Material[]
  materialsLoading: boolean
  selectedIds: Set<number>
  materialSearch: string
  loadedImages: Set<number>
  onSearchChange: (value: string) => void
  onToggleSelect: (id: number) => void
  onToggleSelectAll: () => void
  onClearSelection: () => void
  onImageLoad: (id: number) => void
}

function MaterialPicker({
  materials,
  materialsLoading,
  selectedIds,
  materialSearch,
  loadedImages,
  onSearchChange,
  onToggleSelect,
  onToggleSelectAll,
  onClearSelection,
  onImageLoad,
}: MaterialPickerProps) {
  const filteredMaterials = materials.filter((m) =>
    m.name.toLowerCase().includes(materialSearch.toLowerCase()),
  )

  const allFilteredSelected =
    filteredMaterials.length > 0 &&
    filteredMaterials.every((m) => selectedIds.has(m.id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">选择要处理的素材</h3>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <span className="text-sm text-muted-foreground">
              已选择 {selectedIds.size} 个
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={onToggleSelectAll}>
            {allFilteredSelected ? (
              <CheckSquare className="size-4" />
            ) : (
              <Square className="size-4" />
            )}
            <span className="ml-1 text-sm">
              {allFilteredSelected ? '取消全选' : '全选'}
            </span>
          </Button>
          {selectedIds.size > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              取消选择
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
        <Input
          placeholder="搜索素材..."
          value={materialSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {materialsLoading ? (
        <div className="text-center py-8">
          <LoadingSpinner size="md" />
        </div>
      ) : materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
          <ImageIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            素材库为空，请先上传素材
          </p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">未找到匹配的素材</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredMaterials.map((material) => (
            <Card
              key={material.id}
              className={`overflow-hidden cursor-pointer transition-all ${
                selectedIds.has(material.id)
                  ? 'ring-2 ring-blue-500 ring-offset-1'
                  : 'hover:shadow-md'
              }`}
              onClick={() => onToggleSelect(material.id)}
            >
              <div className="relative aspect-square bg-muted">
                <div
                  className={`absolute inset-0 transition-opacity duration-300 ${
                    loadedImages.has(material.id) ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 animate-pulse" />
                </div>
                <img
                  src={getFullImageUrl(material.url)}
                  alt={material.name}
                  loading="lazy"
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    loadedImages.has(material.id) ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => onImageLoad(material.id)}
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Ctext fill='%239ca3af' font-family='Arial' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E加载失败%3C/text%3E%3C/svg%3E"
                    onImageLoad(material.id)
                  }}
                />
                {selectedIds.has(material.id) && (
                  <div className="absolute top-1 left-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckSquare className="size-3 text-white" />
                  </div>
                )}
              </div>
              <CardContent className="p-2">
                <p className="text-xs truncate">{material.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BatchPage() {
  const [activeTab, setActiveTab] = useState('remove-bg')

  // ====== 批量抠图状态 ======
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ====== 批量生成状态 ======
  const [prompts, setPrompts] = useState('')
  const [size, setSize] = useState('1024x1024')

  // ====== 素材库选择（格式转换/压缩/多尺寸共用）======
  const [materials, setMaterials] = useState<Material[]>([])
  const [materialsLoading, setMaterialsLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [materialSearch, setMaterialSearch] = useState('')
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())

  // ====== 批量格式转换状态 ======
  const [convertFormat, setConvertFormat] = useState<'jpeg' | 'png' | 'webp'>(
    'webp',
  )
  const [convertQuality, setConvertQuality] = useState(85)
  const [converting, setConverting] = useState(false)

  // ====== 批量压缩状态 ======
  const [compressQuality, setCompressQuality] = useState(70)
  const [compressing, setCompressing] = useState(false)

  // ====== 批量多尺寸导出状态 ======
  const [exportSizes, setExportSizes] = useState<
    Array<{ width: number; height: number }>
  >([
    { width: 1920, height: 1080 },
    { width: 1024, height: 1024 },
    { width: 400, height: 400 },
  ])
  const [customWidth, setCustomWidth] = useState('')
  const [customHeight, setCustomHeight] = useState('')
  const [exporting, setExporting] = useState(false)

  // ====== 批量抠图/生成 Polling ======
  const [batchTaskIds, setBatchTaskIds] = useState<string[]>([])
  const [batchPollingEnabled, setBatchPollingEnabled] = useState(false)
  const batchTypeRef = useRef<'remove-bg' | 'generate'>('remove-bg')

  useBatchTaskPolling({
    taskIds: batchTaskIds,
    enabled: batchPollingEnabled,
    fetchTask: (id: string) => aiApi.getTask(id),
    interval: 2000,
    maxFailures: 5,
    onUpdate: setCompletedCount,
    onAllDone: (completed: number) => {
      setBatchPollingEnabled(false)
      setIsProcessing(false)
      const msg =
        batchTypeRef.current === 'remove-bg'
          ? `批量处理完成！成功${completed}张`
          : `批量生成完成！成功${completed}张`
      toast(msg, 'success')
    },
    onError: (error: string) => {
      setBatchPollingEnabled(false)
      setIsProcessing(false)
      toast(error, 'error')
    },
  })

  // ====== 加载素材库 ======
  const loadMaterials = async () => {
    setMaterialsLoading(true)
    try {
      const { data } = await materialApi.getAll()
      setMaterials(data.data || [])
    } catch {
      toast('加载素材库失败', 'error')
    } finally {
      setMaterialsLoading(false)
    }
  }

  useEffect(() => {
    loadMaterials()
  }, [])

  // ====== 素材选择 ======
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const filtered = materials.filter((m) =>
        m.name.toLowerCase().includes(materialSearch.toLowerCase()),
      )
      const allFilteredSelected =
        filtered.length > 0 && filtered.every((m) => prev.has(m.id))
      if (allFilteredSelected) {
        return new Set()
      }
      return new Set(filtered.map((m) => m.id))
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleImageLoad = (id: number) => {
    setLoadedImages((prev) => new Set(prev).add(id))
  }

  // ====== 批量抠图 ======
  const handleBatchRemoveBg = async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    setCompletedCount(0)
    setTotalCount(files.length)

    try {
      const uploadPromises = files.map(async (file) => {
        const { data } = await materialApi.upload(file)
        return { imageUrl: data.url }
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      toast(`成功上传${files.length}张图片，开始批量抠图...`, 'info')

      const { data } = await aiApi.batchRemoveBg(uploadedFiles)
      batchTypeRef.current = 'remove-bg'
      setBatchTaskIds(data.taskIds)
      setBatchPollingEnabled(true)
    } catch (error) {
      const errorMessage = extractErrorMsg(error, '批量抠图失败，请重试')
      console.error('批量抠图出错:', error)
      setIsProcessing(false)
      toast(errorMessage, 'error')
    }
  }

  // ====== 批量生成 ======
  const handleBatchGenerate = async () => {
    const promptList = prompts.split('\n').filter((p) => p.trim())
    if (promptList.length === 0) return

    setIsProcessing(true)
    setCompletedCount(0)
    setTotalCount(promptList.length)

    try {
      const tasks = promptList.map((prompt) => ({
        prompt: prompt.trim(),
        size,
      }))
      toast(`创建${tasks.length}个生成任务...`, 'info')

      const { data } = await aiApi.batchGenerate(tasks)
      batchTypeRef.current = 'generate'
      setBatchTaskIds(data.taskIds)
      setBatchPollingEnabled(true)
    } catch (error) {
      const errorMessage = extractErrorMsg(error, '批量生成失败，请重试')
      console.error('批量生成出错:', error)
      setIsProcessing(false)
      toast(errorMessage, 'error')
    }
  }

  // ====== 批量格式转换 ======
  const handleBatchConvert = async () => {
    if (selectedIds.size === 0) return
    setConverting(true)
    try {
      const config: PreprocessConfig = {
        format: convertFormat,
        quality: convertQuality,
      }
      const { data } = await materialApi.batchPreprocess(
        Array.from(selectedIds),
        config,
      )
      toast(
        `格式转换完成：成功 ${data.success.length} 个，失败 ${data.failed.length} 个`,
        'success',
      )
      setSelectedIds(new Set())
      loadMaterials()
    } catch (error) {
      toast(extractErrorMsg(error, '格式转换失败'), 'error')
    } finally {
      setConverting(false)
    }
  }

  // ====== 批量压缩 ======
  const handleBatchCompress = async () => {
    if (selectedIds.size === 0) return
    setCompressing(true)
    try {
      const config: PreprocessConfig = {
        format: 'webp',
        quality: compressQuality,
      }
      const { data } = await materialApi.batchPreprocess(
        Array.from(selectedIds),
        config,
      )
      toast(
        `压缩完成：成功 ${data.success.length} 个，失败 ${data.failed.length} 个`,
        'success',
      )
      setSelectedIds(new Set())
      loadMaterials()
    } catch (error) {
      toast(extractErrorMsg(error, '压缩失败'), 'error')
    } finally {
      setCompressing(false)
    }
  }

  // ====== 批量多尺寸导出 ======
  const addCustomSize = () => {
    const w = parseInt(customWidth)
    const h = parseInt(customHeight)
    if (!w || !h || w < 1 || h < 1) {
      toast('请输入有效的宽高', 'error')
      return
    }
    const exists = exportSizes.some((s) => s.width === w && s.height === h)
    if (exists) {
      toast('该尺寸已存在', 'error')
      return
    }
    setExportSizes((prev) => [...prev, { width: w, height: h }])
    setCustomWidth('')
    setCustomHeight('')
  }

  const removeExportSize = (index: number) => {
    setExportSizes((prev) => prev.filter((_, i) => i !== index))
  }

  const togglePresetSize = (w: number, h: number) => {
    setExportSizes((prev) => {
      const idx = prev.findIndex((s) => s.width === w && s.height === h)
      if (idx !== -1) {
        return prev.filter((_, i) => i !== idx)
      }
      return [...prev, { width: w, height: h }]
    })
  }

  const handleBatchExport = async () => {
    if (selectedIds.size === 0 || exportSizes.length === 0) return
    setExporting(true)
    try {
      const { data } = await materialApi.batchMultiSizeExport(
        Array.from(selectedIds),
        exportSizes,
        'webp',
        85,
      )
      toast(
        `多尺寸导出完成：成功 ${data.success.length} 个素材，失败 ${data.failed.length} 个`,
        'success',
      )
      setSelectedIds(new Set())
      loadMaterials()
    } catch (error) {
      toast(extractErrorMsg(error, '多尺寸导出失败'), 'error')
    } finally {
      setExporting(false)
    }
  }

  // ====== 文件选择 ======
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles((prev) => [...prev, ...selectedFiles].slice(0, 20))
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const materialPickerProps = {
    materials,
    materialsLoading,
    selectedIds,
    materialSearch,
    loadedImages,
    onSearchChange: setMaterialSearch,
    onToggleSelect: toggleSelect,
    onToggleSelectAll: toggleSelectAll,
    onClearSelection: clearSelection,
    onImageLoad: handleImageLoad,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">批量处理</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex-wrap">
          <TabsTrigger value="remove-bg" className="flex-1 min-w-[90px]">
            批量抠图
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex-1 min-w-[90px]">
            批量生成
          </TabsTrigger>
          <TabsTrigger value="convert" className="flex-1 min-w-[90px]">
            格式转换
          </TabsTrigger>
          <TabsTrigger value="compress" className="flex-1 min-w-[90px]">
            批量压缩
          </TabsTrigger>
          <TabsTrigger value="multi-size" className="flex-1 min-w-[90px]">
            多尺寸导出
          </TabsTrigger>
        </TabsList>

        {/* ====== 批量抠图 ====== */}
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

        {/* ====== 批量生成 ====== */}
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

        {/* ====== 批量格式转换 ====== */}
        <TabsContent value="convert" className="space-y-6 mt-6">
          <MaterialPicker {...materialPickerProps} />

          {selectedIds.size > 0 && (
            <div className="space-y-4 border rounded-lg p-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">目标格式</label>
                <Select
                  value={convertFormat}
                  onValueChange={(val: 'jpeg' | 'png' | 'webp') =>
                    setConvertFormat(val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webp">WebP（推荐，体积小）</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="png">PNG（无损）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  输出质量: {convertQuality}%
                </label>
                <Slider
                  value={[convertQuality]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={(val) => setConvertQuality(val[0])}
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleBatchConvert}
            disabled={selectedIds.size === 0 || converting}
            loading={converting}
            className="w-full"
          >
            批量格式转换 ({selectedIds.size > 0 ? selectedIds.size : 0} 个)
          </Button>
        </TabsContent>

        {/* ====== 批量压缩 ====== */}
        <TabsContent value="compress" className="space-y-6 mt-6">
          <MaterialPicker {...materialPickerProps} />

          {selectedIds.size > 0 && (
            <div className="space-y-4 border rounded-lg p-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  压缩质量: {compressQuality}%
                </label>
                <Slider
                  value={[compressQuality]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={(val) => setCompressQuality(val[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>高压缩（文件小）</span>
                  <span>高质量（文件大）</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                输出格式为 WebP，兼顾压缩率和画质
              </p>
            </div>
          )}

          <Button
            onClick={handleBatchCompress}
            disabled={selectedIds.size === 0 || compressing}
            loading={compressing}
            className="w-full"
          >
            批量压缩 ({selectedIds.size > 0 ? selectedIds.size : 0} 个)
          </Button>
        </TabsContent>

        {/* ====== 批量多尺寸导出 ====== */}
        <TabsContent value="multi-size" className="space-y-6 mt-6">
          <MaterialPicker {...materialPickerProps} />

          {selectedIds.size > 0 && (
            <div className="space-y-4 border rounded-lg p-4">
              <div className="space-y-3">
                <label className="text-sm font-medium">选择导出尺寸</label>

                <div className="flex flex-wrap gap-2">
                  {PRESET_SIZES.map((preset) => {
                    const isSelected = exportSizes.some(
                      (s) =>
                        s.width === preset.width && s.height === preset.height,
                    )
                    return (
                      <button
                        key={preset.label}
                        onClick={() =>
                          togglePresetSize(preset.width, preset.height)
                        }
                        className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                          isSelected
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-background text-foreground border-border hover:border-blue-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-muted-foreground">
                      自定义宽度
                    </label>
                    <Input
                      type="number"
                      placeholder="宽度"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-muted-foreground">
                      自定义高度
                    </label>
                    <Input
                      type="number"
                      placeholder="高度"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={addCustomSize}
                    disabled={!customWidth || !customHeight}
                  >
                    添加
                  </Button>
                </div>

                {exportSizes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      已选导出尺寸 ({exportSizes.length})：
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {exportSizes.map((sz, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted rounded-full"
                        >
                          {sz.width}x{sz.height}
                          <button
                            onClick={() => removeExportSize(i)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                每个素材将生成 {exportSizes.length} 种尺寸的副本，输出格式为
                WebP
              </p>
            </div>
          )}

          <Button
            onClick={handleBatchExport}
            disabled={
              selectedIds.size === 0 || exportSizes.length === 0 || exporting
            }
            loading={exporting}
            className="w-full"
          >
            批量多尺寸导出 (
            {selectedIds.size > 0
              ? `${selectedIds.size}个素材 × ${exportSizes.length}种尺寸`
              : 0}
            )
          </Button>
        </TabsContent>
      </Tabs>

      <div className="border-t pt-4">
        <p className="text-sm text-muted-foreground">
          💡 提示：批量处理完成后，所有结果会自动保存到你的素材库中
        </p>
      </div>
    </div>
  )
}

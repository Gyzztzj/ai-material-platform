import { useState, useEffect, useCallback } from 'react'
import { aiApi } from '../services/api/ai.api'
import { toast } from '../components/ui/Toast'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Progress } from '../components/ui/progress'
import { Skeleton } from '../components/ui/Skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { useBatchTaskPolling } from '../hooks/useTaskPolling'
import { PROMPT_TEMPLATES } from '../constants/prompt-templates'
import type { AIModel, SizeOption } from '../lib/shared-types'
import { getFullImageUrl } from '../lib/utils'
import { Zap, Save, RotateCcw } from 'lucide-react'

const SLOT_COLORS = ['#3B82F6', '#EF4444', '#10B981']

interface Preset {
  id: number
  name: string
  prompt: string
  modelId?: string
  size?: string
  style?: string
}

interface CompareSlot {
  id: string
  label: string
  modelId: string
  size: string
  style: string
  taskId: string | null
}

interface SlotResult {
  images: string[]
}

const FALLBACK_SIZES: SizeOption[] = [
  { value: '1024*1024', label: '1024x1024（正方形）', aspectRatio: '1:1' },
]

function createInitialSlots(): CompareSlot[] {
  return [
    {
      id: 'A',
      label: '方案 A',
      modelId: 'tongyi-wanx-26',
      size: '1024*1024',
      style: '通用',
      taskId: null,
    },
    {
      id: 'B',
      label: '方案 B',
      modelId: 'tongyi-wanx-26',
      size: '1024*1024',
      style: '写实摄影',
      taskId: null,
    },
    {
      id: 'C',
      label: '方案 C',
      modelId: 'tongyi-wanx-26',
      size: '1024*1024',
      style: '动漫插画',
      taskId: null,
    },
  ]
}

export default function ComparePage() {
  const [prompt, setPrompt] = useState('')
  const [slots, setSlots] = useState<CompareSlot[]>(createInitialSlots)
  const [models, setModels] = useState<AIModel[]>([])
  const [presets, setPresets] = useState<Preset[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [slotResults, setSlotResults] = useState<Record<string, SlotResult>>({})
  const [slotErrors, setSlotErrors] = useState<Record<string, string>>({})
  const [batchTaskIds, setBatchTaskIds] = useState<string[]>([])
  const [pollingEnabled, setPollingEnabled] = useState(false)
  const [taskCount, setTaskCount] = useState(0)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [saving, setSaving] = useState(false)

  // 请求间隔延迟，避免阿里云 API 限流
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))

  // 加载模型和预设
  useEffect(() => {
    const loadData = async () => {
      try {
        const [modelsRes, presetsRes] = await Promise.all([
          aiApi.getModels('generate'),
          aiApi.getPresets(),
        ])
        setModels(modelsRes.data.generate || [])
        setPresets(presetsRes.data.data || [])
      } catch {
        // 静默失败，使用默认值
      }
    }
    loadData()
  }, [])

  // 获取指定模型的支持尺寸
  const getSupportedSizes = useCallback(
    (modelId: string): SizeOption[] => {
      const model = models.find((m) => m.modelId === modelId)
      return model?.supportedSizes || FALLBACK_SIZES
    },
    [models],
  )

  // 更新槽位配置
  const updateSlot = (slotId: string, updates: Partial<CompareSlot>) => {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id !== slotId) return s
        const updated = { ...s, ...updates }
        // 切换模型时重置尺寸为第一个支持的尺寸
        if (updates.modelId && updates.modelId !== s.modelId) {
          const sizes = getSupportedSizes(updates.modelId)
          if (sizes.length > 0 && !sizes.find((sz) => sz.value === s.size)) {
            updated.size = sizes[0].value
          }
        }
        return updated
      }),
    )
  }

  // 应用预设到指定槽位
  const applyPreset = (slotId: string, preset: Preset) => {
    updateSlot(slotId, {
      modelId:
        preset.modelId ||
        slots.find((s) => s.id === slotId)?.modelId ||
        'tongyi-wanx-26',
      size:
        preset.size || slots.find((s) => s.id === slotId)?.size || '1024*1024',
      style: preset.style || '通用',
    })
    setPrompt(preset.prompt)
    toast(`已加载预设: ${preset.name}`, 'success')
  }

  // 保存当前配置为预设
  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast('请输入预设名称', 'error')
      return
    }
    setSaving(true)
    try {
      const primarySlot = slots[0]
      await aiApi.createPreset({
        name: presetName.trim(),
        prompt,
        modelId: primarySlot.modelId,
        size: primarySlot.size,
        style: primarySlot.style,
      })
      toast('预设保存成功！', 'success')
      setSaveDialogOpen(false)
      setPresetName('')
      // 重新加载预设列表
      const { data } = await aiApi.getPresets()
      setPresets(data.data || [])
    } catch {
      toast('保存预设失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  // 重置槽位
  const resetSlots = () => {
    setSlots(createInitialSlots())
    setSlotResults({})
    setSlotErrors({})
    setCompletedCount(0)
    setPrompt('')
    toast('已重置所有配置', 'info')
  }

  // 批量任务轮询
  useBatchTaskPolling({
    taskIds: batchTaskIds,
    enabled: pollingEnabled,
    fetchTask: (id: string) => aiApi.getTask(id),
    onUpdate: setCompletedCount,
    onAllDone: (completed: number) => {
      setPollingEnabled(false)
      setIsGenerating(false)
      // 获取已完成任务的结果
      const loadResults = async () => {
        const results: Record<string, SlotResult> = {}
        for (const slot of slots) {
          if (slot.taskId) {
            try {
              const { data } = await aiApi.getTask(slot.taskId)
              if (data.status === 'completed' && data.result) {
                results[slot.id] = data.result
              }
            } catch {
              // skip
            }
          }
        }
        setSlotResults(results)
        toast(`对比生成完成！成功 ${completed} 个`, 'success')
      }
      loadResults()
    },
    onError: (error: string) => {
      setPollingEnabled(false)
      setIsGenerating(false)
      toast(error, 'error')
    },
  })

  // 生成所有对比
  const handleGenerateAll = async () => {
    if (!prompt.trim()) {
      toast('请输入提示词', 'error')
      return
    }

    setIsGenerating(true)
    setCompletedCount(0)
    setSlotResults({})
    setSlotErrors({})

    const newSlots = [...slots]
    const taskIds: string[] = []
    const errors: Record<string, string> = {}

    for (let i = 0; i < newSlots.length; i++) {
      const slot = newSlots[i]
      try {
        const { data } = await aiApi.generateImage(
          prompt,
          slot.size,
          slot.modelId,
        )
        newSlots[i] = { ...slot, taskId: data.taskId.toString() }
        taskIds.push(data.taskId.toString())
      } catch {
        const errorMsg = `${slot.label} 创建任务失败（API 限流，请稍后重试）`
        errors[slot.id] = errorMsg
        toast(errorMsg, 'error')
      }

      // 避免阿里云 API 限流，间隔 2 秒再发下一个请求
      if (i < newSlots.length - 1) {
        await delay(2000)
      }
    }

    setSlots(newSlots)
    setSlotErrors(errors)
    setTaskCount(taskIds.length)

    if (taskIds.length > 0) {
      setBatchTaskIds(taskIds)
      setPollingEnabled(true)
      toast(`已创建 ${taskIds.length} 个对比任务`, 'info')
    } else {
      setIsGenerating(false)
    }
  }

  const totalSlots = slots.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">效果测试</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={resetSlots}
            disabled={isGenerating}
          >
            <RotateCcw className="size-4" />
            重置
          </Button>
          <Button
            size="sm"
            onClick={() => setSaveDialogOpen(true)}
            disabled={isGenerating}
          >
            <Save className="size-4" />
            保存预设
          </Button>
        </div>
      </div>

      {/* 提示词输入 */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              提示词（所有方案共用）
            </label>
            <Textarea
              placeholder="描述你想要生成的图片..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
          </div>

          {/* 快速提示词 */}
          <div className="flex flex-wrap gap-2">
            {PROMPT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                type="button"
                onClick={() => setPrompt((prev) => tpl.prefix + prev)}
                className="inline-flex items-center rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 参数配置区域 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {slots.map((slot, index) => (
          <Card key={slot.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div
                  className="size-3 rounded-full"
                  style={{ backgroundColor: SLOT_COLORS[index] }}
                />
                <CardTitle className="text-base">{slot.label}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 预设选择 */}
              {presets.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">预设</label>
                  <Select
                    onValueChange={(val) => {
                      const preset = presets.find((p) => p.id === Number(val))
                      if (preset) applyPreset(slot.id, preset)
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="选择预设..." />
                    </SelectTrigger>
                    <SelectContent>
                      {presets.map((preset) => (
                        <SelectItem key={preset.id} value={String(preset.id)}>
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 模型选择 */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">模型</label>
                <Select
                  value={slot.modelId}
                  onValueChange={(val) => updateSlot(slot.id, { modelId: val })}
                  disabled={isGenerating}
                >
                  <SelectTrigger className="h-8 text-xs">
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

              {/* 尺寸选择 */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">尺寸</label>
                <Select
                  value={slot.size}
                  onValueChange={(val) => updateSlot(slot.id, { size: val })}
                  disabled={isGenerating}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getSupportedSizes(slot.modelId).map((sz) => (
                      <SelectItem key={sz.value} value={sz.value}>
                        {sz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 风格选择 */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">风格</label>
                <Select
                  value={slot.style}
                  onValueChange={(val) => updateSlot(slot.id, { style: val })}
                  disabled={isGenerating}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      '通用',
                      '写实摄影',
                      '动漫插画',
                      '油画',
                      '3D渲染',
                      '水彩',
                      '赛博朋克',
                      '国潮',
                      '极简',
                    ].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 生成按钮 + 进度 */}
      <div className="space-y-3">
        <Button
          onClick={handleGenerateAll}
          disabled={!prompt.trim() || isGenerating}
          loading={isGenerating}
          className="w-full"
          size="lg"
        >
          <Zap className="size-4" />
          生成全部对比（{totalSlots} 个方案）
        </Button>

        {isGenerating && (
          <div className="space-y-2">
            <Progress
              value={taskCount > 0 ? (completedCount / taskCount) * 100 : 0}
            />
            <p className="text-sm text-muted-foreground text-center">
              生成进度: {completedCount}/{taskCount}
              {totalSlots - taskCount > 0 && (
                <span className="text-destructive ml-2">
                  （{totalSlots - taskCount} 个槽位因限流失败）
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* 对比结果展示 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {slots.map((slot, index) => (
          <Card key={slot.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div
                  className="size-3 rounded-full"
                  style={{ backgroundColor: SLOT_COLORS[index] }}
                />
                <CardTitle className="text-sm">{slot.label}</CardTitle>
              </div>
              <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                <span>
                  模型:{' '}
                  {models.find((m) => m.modelId === slot.modelId)?.name ||
                    slot.modelId}
                </span>
                <span>·</span>
                <span>{slot.size}</span>
                <span>·</span>
                <span>{slot.style}</span>
              </div>
            </CardHeader>
            <CardContent>
              {slot.taskId && isGenerating && !slotResults[slot.id] ? (
                <Skeleton className="w-full aspect-square rounded-lg" />
              ) : slotResults[slot.id]?.images?.length > 0 ? (
                <div className="space-y-2">
                  <img
                    src={getFullImageUrl(slotResults[slot.id].images[0])}
                    alt={`${slot.label} 生成结果`}
                    loading="lazy"
                    className="w-full rounded-lg"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src =
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext fill="%239ca3af" font-family="Arial" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E图片加载失败%3C/text%3E%3C/svg%3E'
                    }}
                  />
                </div>
              ) : slotErrors[slot.id] ? (
                <div className="border-2 border-dashed border-destructive/40 rounded-lg h-48 flex flex-col items-center justify-center gap-2 p-4">
                  <p className="text-sm text-destructive text-center">
                    {slotErrors[slot.id]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    建议等待 30 秒后重试
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg h-48 flex items-center justify-center text-muted-foreground text-sm">
                  等待生成...
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 保存预设对话框 */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>保存为预设</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">预设名称</label>
              <Input
                placeholder="例如：高质量风景方案"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                将保存当前提示词和方案 A 的配置（模型、尺寸、风格）
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setSaveDialogOpen(false)}
              disabled={saving}
            >
              取消
            </Button>
            <Button
              onClick={handleSavePreset}
              disabled={saving}
              loading={saving}
            >
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

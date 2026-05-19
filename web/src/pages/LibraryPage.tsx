import { useEffect, useState } from 'react'
import {
  materialApi,
  type PreprocessConfig,
} from '../services/api/material.api'
import { toast } from '../components/ui/Toast'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Slider } from '../components/ui/slider'
import { Checkbox } from '../components/ui/checkbox'
import {
  Search,
  Grid,
  List,
  Download,
  Edit,
  Edit3,
  Trash2,
  ImageIcon,
  Settings2,
  CheckSquare,
  Square,
} from 'lucide-react'
import ImageEditor from '../components/editor/ImageEditor'

interface Material {
  id: number
  name: string
  url: string
  size: number
  type: string
  category: string | null
  createdAt: string
}

export default function LibraryPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null,
  )
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<Set<number>>(
    new Set(),
  )
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPreprocessDialog, setShowPreprocessDialog] = useState(false)
  const [newName, setNewName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [preprocessing, setPreprocessing] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [preprocessConfig, setPreprocessConfig] = useState<PreprocessConfig>({
    format: 'webp',
    quality: 85,
    noiseReduction: false,
    brightness: 100,
    contrast: 100,
  })

  const loadMaterials = async () => {
    try {
      const { data } = await materialApi.getAll()
      console.log('API完整返回:', data)
      console.log('data.data:', data.data)
      const materialsData = data.data || []
      console.log('解析后的素材列表:', materialsData)
      setMaterials(materialsData)
    } catch (error) {
      console.error('加载素材失败:', error)
    } finally {
      setLoading(false)
    }
  }

  console.log('当前 materials 状态:', materials)
  console.log('当前 filterType:', filterType)
  console.log('当前 searchTerm:', searchTerm)

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || material.type === filterType
    console.log(
      '素材过滤 - name:',
      material.name,
      'type:',
      material.type,
      'matchesSearch:',
      matchesSearch,
      'matchesType:',
      matchesType,
    )
    return matchesSearch && matchesType
  })

  console.log('过滤后的素材:', filteredMaterials)

  useEffect(() => {
    loadMaterials()
  }, [])

  const handleRename = async () => {
    if (!selectedMaterial || !newName.trim()) return

    setRenaming(true)
    try {
      await materialApi.update(selectedMaterial.id, { name: newName })
      toast('重命名成功', 'success')
      setShowRenameDialog(false)
      loadMaterials()
    } catch (error) {
      console.error('重命名失败:', error)
    } finally {
      setRenaming(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个素材吗？')) return

    setDeletingId(id)
    try {
      await materialApi.delete(id)
      toast('删除成功', 'success')
      loadMaterials()
    } catch (error) {
      console.error('删除失败:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const downloadMaterial = async (url: string, name: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}${url}`)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = blobUrl
      link.download = name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('下载失败:', error)
    }
  }

  const handleImageLoad = (id: number) => {
    setLoadedImages((prev) => new Set(prev).add(id))
  }

  const toggleSelectMaterial = (id: number) => {
    setSelectedMaterialIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedMaterialIds.size === filteredMaterials.length) {
      setSelectedMaterialIds(new Set())
    } else {
      setSelectedMaterialIds(new Set(filteredMaterials.map((m) => m.id)))
    }
  }

  const openPreprocessDialog = (material?: Material) => {
    if (material) {
      setSelectedMaterialIds(new Set([material.id]))
    }
    setShowPreprocessDialog(true)
  }

  const handlePreprocess = async () => {
    if (selectedMaterialIds.size === 0) return

    setPreprocessing(true)
    try {
      if (selectedMaterialIds.size === 1) {
        const id = Array.from(selectedMaterialIds)[0]
        await materialApi.preprocess(id, preprocessConfig)
        toast('素材预处理成功', 'success')
      } else {
        const { data } = await materialApi.batchPreprocess(
          Array.from(selectedMaterialIds),
          preprocessConfig,
        )
        toast(
          `批量预处理完成，成功 ${data.success.length} 个，失败 ${data.failed.length} 个`,
          'success',
        )
      }
      setShowPreprocessDialog(false)
      setSelectedMaterialIds(new Set())
      loadMaterials()
    } catch (error) {
      console.error('预处理失败:', error)
      toast('预处理失败，请重试', 'error')
    } finally {
      setPreprocessing(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">我的素材库</h1>
          <div className="flex items-center gap-2">
            {selectedMaterialIds.size > 0 && (
              <>
                <span className="text-sm text-muted-foreground">
                  已选择 {selectedMaterialIds.size} 个
                </span>
                <Button size="sm" onClick={() => openPreprocessDialog()}>
                  <Settings2 className="size-4 mr-1" />
                  批量预处理
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMaterialIds(new Set())}
                >
                  取消选择
                </Button>
              </>
            )}
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="size-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('list')}
            >
              <List className="size-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {materials.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              className="flex items-center gap-2"
            >
              {selectedMaterialIds.size === filteredMaterials.length ? (
                <CheckSquare className="size-4" />
              ) : (
                <Square className="size-4" />
              )}
              {selectedMaterialIds.size === filteredMaterials.length
                ? '取消全选'
                : '全选'}
            </Button>
          )}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
            <Input
              placeholder="搜索素材..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="全部类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="generate">AI生成</SelectItem>
              <SelectItem value="remove-bg">抠图</SelectItem>
              <SelectItem value="image-edit">编辑</SelectItem>
              <SelectItem value="upload">上传</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
            <ImageIcon className="size-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">素材库为空</h3>
            <p className="text-muted-foreground max-w-sm">
              点击"上传素材"添加本地图片，或去AI生成页面创建素材
            </p>
          </div>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
            <Search className="size-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">未找到匹配的素材</h3>
            <p className="text-muted-foreground">尝试调整搜索条件或筛选类型</p>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMaterials.map((material) => (
            <Card
              key={material.id}
              className={`overflow-hidden group shadow-sm hover:shadow-md transition-shadow rounded-xl ${
                selectedMaterialIds.has(material.id)
                  ? 'ring-2 ring-blue-500'
                  : ''
              }`}
            >
              <div className="relative aspect-square">
                <button
                  onClick={() => toggleSelectMaterial(material.id)}
                  className="absolute top-2 left-2 z-10 w-6 h-6 bg-background/90 rounded flex items-center justify-center hover:bg-background"
                >
                  {selectedMaterialIds.has(material.id) ? (
                    <CheckSquare className="size-4 text-primary" />
                  ) : (
                    <Square className="size-4 text-muted-foreground" />
                  )}
                </button>
                <div
                  className={`absolute inset-0 bg-muted transition-opacity duration-300 ${
                    loadedImages.has(material.id) ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 animate-pulse" />
                </div>
                <img
                  src={`${import.meta.env.VITE_API_URL}${material.url}`}
                  alt={material.name}
                  loading="lazy"
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    loadedImages.has(material.id) ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => handleImageLoad(material.id)}
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext fill="%239ca3af" font-family="Arial" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E加载失败%3C/text%3E%3C/svg%3E'
                    handleImageLoad(material.id)
                  }}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <button
                    onClick={() =>
                      downloadMaterial(material.url, material.name)
                    }
                    className="flex items-center justify-center w-10 h-10 bg-background/90 hover:bg-background text-foreground rounded-lg transition-colors"
                  >
                    <Download className="size-5" />
                  </button>
                  <button
                    onClick={() => openPreprocessDialog(material)}
                    className="flex items-center justify-center w-10 h-10 bg-background/90 hover:bg-background text-foreground rounded-lg transition-colors"
                  >
                    <Settings2 className="size-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMaterial(material)
                      setNewName(material.name)
                      setShowRenameDialog(true)
                    }}
                    className="flex items-center justify-center w-10 h-10 bg-background/90 hover:bg-background text-foreground rounded-lg transition-colors"
                  >
                    <Edit className="size-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMaterial(material)
                      setShowEditDialog(true)
                    }}
                    className="flex items-center justify-center w-10 h-10 bg-background/90 hover:bg-background text-foreground rounded-lg transition-colors"
                  >
                    <Edit3 className="size-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(material.id)}
                    disabled={deletingId === material.id}
                    className="flex items-center justify-center w-10 h-10 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingId === material.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Trash2 className="size-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm truncate font-medium">{material.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(material.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMaterials.map((material) => (
            <Card
              key={material.id}
              className="overflow-hidden group shadow-sm hover:shadow-md transition-shadow rounded-xl"
            >
              <div className="flex items-center p-3 gap-4">
                <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                  <div
                    className={`absolute inset-0 bg-muted transition-opacity duration-300 ${
                      loadedImages.has(material.id)
                        ? 'opacity-0'
                        : 'opacity-100'
                    }`}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 animate-pulse" />
                  </div>
                  <img
                    src={`${import.meta.env.VITE_API_URL}${material.url}`}
                    alt={material.name}
                    loading="lazy"
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      loadedImages.has(material.id)
                        ? 'opacity-100'
                        : 'opacity-0'
                    }`}
                    onLoad={() => handleImageLoad(material.id)}
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src =
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext fill="%239ca3af" font-family="Arial" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E加载失败%3C/text%3E%3C/svg%3E'
                      handleImageLoad(material.id)
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {material.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(material.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() =>
                      downloadMaterial(material.url, material.name)
                    }
                    className="flex items-center justify-center w-8 h-8 hover:bg-muted text-foreground rounded-md transition-colors"
                  >
                    <Download className="size-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMaterial(material)
                      setNewName(material.name)
                      setShowRenameDialog(true)
                    }}
                    className="flex items-center justify-center w-8 h-8 hover:bg-muted text-foreground rounded-md transition-colors"
                  >
                    <Edit className="size-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMaterial(material)
                      setShowEditDialog(true)
                    }}
                    className="flex items-center justify-center w-8 h-8 hover:bg-muted text-foreground rounded-md transition-colors"
                  >
                    <Edit3 className="size-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(material.id)}
                    disabled={deletingId === material.id}
                    className="flex items-center justify-center w-8 h-8 hover:bg-destructive/10 text-destructive rounded-md transition-colors disabled:opacity-50"
                  >
                    {deletingId === material.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>重命名素材</DialogTitle>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="输入新名称"
          />
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowRenameDialog(false)}
              disabled={renaming}
            >
              取消
            </Button>
            <Button
              onClick={handleRename}
              loading={renaming}
              disabled={!newName.trim()}
            >
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showEditDialog && selectedMaterial && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="w-[90vw] min-w-[800px]">
            <DialogHeader>
              <DialogTitle>图片编辑</DialogTitle>
            </DialogHeader>
            <ImageEditor
              imageUrl={`${import.meta.env.VITE_API_URL}${selectedMaterial.url}`}
              onSave={() => {
                // 刷新素材列表，显示新编辑的图片
                loadMaterials()
                setShowEditDialog(false)
                toast('图片编辑完成！已保存到素材库', 'success')
              }}
              onCancel={() => setShowEditDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      <Dialog
        open={showPreprocessDialog}
        onOpenChange={setShowPreprocessDialog}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>素材预处理</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">输出格式</label>
              <Select
                value={preprocessConfig.format || 'webp'}
                onValueChange={(val: 'jpeg' | 'png' | 'webp') =>
                  setPreprocessConfig({ ...preprocessConfig, format: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webp">WebP</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                质量: {preprocessConfig.quality || 85}%
              </label>
              <Slider
                value={[preprocessConfig.quality || 85]}
                min={10}
                max={100}
                step={5}
                onValueChange={(val) =>
                  setPreprocessConfig({ ...preprocessConfig, quality: val[0] })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">最大宽度</label>
                <Input
                  type="number"
                  placeholder="可选"
                  value={preprocessConfig.maxWidth || ''}
                  onChange={(e) =>
                    setPreprocessConfig({
                      ...preprocessConfig,
                      maxWidth: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">最大高度</label>
                <Input
                  type="number"
                  placeholder="可选"
                  value={preprocessConfig.maxHeight || ''}
                  onChange={(e) =>
                    setPreprocessConfig({
                      ...preprocessConfig,
                      maxHeight: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                亮度: {preprocessConfig.brightness || 100}%
              </label>
              <Slider
                value={[preprocessConfig.brightness || 100]}
                min={50}
                max={150}
                step={5}
                onValueChange={(val) =>
                  setPreprocessConfig({
                    ...preprocessConfig,
                    brightness: val[0],
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                对比度: {preprocessConfig.contrast || 100}%
              </label>
              <Slider
                value={[preprocessConfig.contrast || 100]}
                min={50}
                max={150}
                step={5}
                onValueChange={(val) =>
                  setPreprocessConfig({ ...preprocessConfig, contrast: val[0] })
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="noiseReduction"
                checked={preprocessConfig.noiseReduction || false}
                onCheckedChange={(val) =>
                  setPreprocessConfig({
                    ...preprocessConfig,
                    noiseReduction: val as boolean,
                  })
                }
              />
              <label htmlFor="noiseReduction" className="text-sm">
                降噪处理
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowPreprocessDialog(false)}
              disabled={preprocessing}
            >
              取消
            </Button>
            <Button
              onClick={handlePreprocess}
              loading={preprocessing}
              disabled={selectedMaterialIds.size === 0}
            >
              开始处理 ({selectedMaterialIds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

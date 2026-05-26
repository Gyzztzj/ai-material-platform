import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'
import { Checkbox } from '../components/ui/checkbox'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { TemplateForm } from '../components/template/TemplateForm'
import { toast } from '../components/ui/Toast'
import {
  templateApi,
  type Template,
  type CreateTemplateDto,
} from '../services/api/template.api'
import { useDebounce } from '../hooks/useDebounce'
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Sparkles,
  Search,
  Layers,
  X,
} from 'lucide-react'

const CATEGORIES = ['电商', '广告', '设计', '头像', '风景', '其他'] as const

const ALL_CATEGORIES_VALUE = 'all'

export default function TemplatePage() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] =
    useState<string>(ALL_CATEGORIES_VALUE)
  const [searchQuery, setSearchQuery] = useState('')
  const [finalSearchQuery, setFinalSearchQuery] = useState('')
  const debouncedSearch = useDebounce(finalSearchQuery, 500)
  const [showPublicOnly, setShowPublicOnly] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState<CreateTemplateDto>({
    name: '',
    prompt: '',
    category: '其他',
    isPublic: false,
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
  const [copyLoading, setCopyLoading] = useState<number | null>(null)

  const loadTemplates = async () => {
    const params = {
      category:
        selectedCategory === ALL_CATEGORIES_VALUE
          ? undefined
          : selectedCategory,
      isPublic: showPublicOnly,
      search: debouncedSearch || undefined,
    }
    setLoading(true)
    try {
      const { data } = await templateApi.getAll(params)
      setTemplates(data.data || [])
    } catch {
      toast('加载模板失败', 'error')
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [selectedCategory, showPublicOnly, debouncedSearch])

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.prompt.trim()) {
      toast('请填写模板名称和提示词', 'error')
      return
    }
    setCreateLoading(true)
    try {
      await templateApi.create(formData)
      toast('模板创建成功！', 'success')
      setCreateDialogOpen(false)
      setFormData({
        name: '',
        prompt: '',
        category: '其他',
        isPublic: false,
      })
      loadTemplates()
    } catch {
      toast('创建模板失败', 'error')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      prompt: template.prompt,
      category: template.category,
      isPublic: template.isPublic,
      params: template.params,
    })
    setEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingTemplate) return
    setUpdateLoading(true)
    try {
      await templateApi.update(editingTemplate.id, formData)
      toast('模板更新成功！', 'success')
      setEditDialogOpen(false)
      setEditingTemplate(null)
      loadTemplates()
    } catch {
      toast('更新模板失败', 'error')
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这个模板吗？')) return
    setDeleteLoading(id)
    try {
      await templateApi.delete(id)
      toast('模板删除成功！', 'success')
      loadTemplates()
    } catch {
      toast('删除模板失败', 'error')
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleCopy = async (id: number) => {
    setCopyLoading(id)
    try {
      await templateApi.copy(id)
      toast('模板复制成功！', 'success')
      loadTemplates()
    } catch {
      toast('复制模板失败', 'error')
    } finally {
      setCopyLoading(null)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    if (!isComposing) {
      setFinalSearchQuery(value)
    }
  }

  const handleCompositionStart = () => {
    setIsComposing(true)
  }

  const handleCompositionEnd = (
    e: React.CompositionEvent<HTMLInputElement>,
  ) => {
    setIsComposing(false)
    const value = e.currentTarget.value
    setFinalSearchQuery(value)
  }

  const applyTemplate = (template: Template) => {
    sessionStorage.setItem('useTemplate', JSON.stringify(template))
    navigate('/generate')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">模板库</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          创建模板
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索模板..."
              value={searchQuery}
              onChange={handleSearchChange}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setFinalSearchQuery('')
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="全部分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES_VALUE}>全部分类</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Checkbox
            id="publicOnly"
            checked={showPublicOnly}
            onCheckedChange={(c) => setShowPublicOnly(c === true)}
          />
          <label
            htmlFor="publicOnly"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            只看公开模板
          </label>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="h-40 rounded-t-xl" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-primary-50 dark:bg-primary-900/30 px-2 py-1 text-xs font-medium text-primary">
                        {template.category}
                      </span>
                      {template.isPublic && (
                        <span className="inline-flex items-center rounded-full bg-secondary-50 dark:bg-secondary-900/30 px-2 py-1 text-xs font-medium text-secondary">
                          公开
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => applyTemplate(template)}
                      title="使用模板"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleCopy(template.id)}
                      title="复制模板"
                      disabled={copyLoading === template.id}
                    >
                      {copyLoading === template.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4">
                  {template.prompt.length > 100
                    ? template.prompt.substring(0, 100) + '...'
                    : template.prompt}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => applyTemplate(template)}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    使用
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => handleEdit(template)}
                    title="编辑"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => handleDelete(template.id)}
                    title="删除"
                    disabled={deleteLoading === template.id}
                  >
                    {deleteLoading === template.id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Layers}
          title="暂无模板"
          description="创建一个新模板开始使用吧"
          action={
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              创建模板
            </Button>
          }
        />
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新模板</DialogTitle>
          </DialogHeader>
          <TemplateForm
            formData={formData}
            onChange={setFormData}
            onSubmit={handleCreate}
            onCancel={() => setCreateDialogOpen(false)}
            submitLoading={createLoading}
            submitLabel="创建"
          />
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setCreateDialogOpen(false)}
              disabled={createLoading}
            >
              取消
            </Button>
            <Button onClick={handleCreate} disabled={createLoading}>
              {createLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  创建中...
                </>
              ) : (
                '创建'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑模板</DialogTitle>
          </DialogHeader>
          <TemplateForm
            formData={formData}
            onChange={setFormData}
            onSubmit={handleUpdate}
            onCancel={() => setEditDialogOpen(false)}
            submitLoading={updateLoading}
            submitLabel="保存"
          />
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setEditDialogOpen(false)}
              disabled={updateLoading}
            >
              取消
            </Button>
            <Button onClick={handleUpdate} disabled={updateLoading}>
              {updateLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

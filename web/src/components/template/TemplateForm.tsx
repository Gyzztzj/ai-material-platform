import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import type { CreateTemplateDto } from '../../services/api/template.api'

const CATEGORIES = ['电商', '广告', '设计', '头像', '风景', '其他'] as const

interface TemplateFormProps {
  formData: CreateTemplateDto
  onChange: (data: CreateTemplateDto) => void
  onSubmit?: () => void
  onCancel?: () => void
  submitLoading?: boolean
  submitLabel?: string
}

export function TemplateForm({ formData, onChange }: TemplateFormProps) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">模板名称</label>
        <Input
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          placeholder="给模板起个名字"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">提示词</label>
        <Textarea
          value={formData.prompt}
          onChange={(e) => onChange({ ...formData, prompt: e.target.value })}
          placeholder="输入模板提示词..."
          rows={6}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">分类</label>
        <Select
          value={formData.category}
          onValueChange={(v) => onChange({ ...formData, category: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="template-public"
          checked={formData.isPublic}
          onCheckedChange={(c) =>
            onChange({ ...formData, isPublic: c === true })
          }
        />
        <label
          htmlFor="template-public"
          className="text-sm text-muted-foreground"
        >
          公开分享此模板
        </label>
      </div>
    </div>
  )
}

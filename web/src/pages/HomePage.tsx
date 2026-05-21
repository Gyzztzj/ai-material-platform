import {
  Image,
  Scissors,
  Layers,
  Palette,
  FileCode2,
  Server,
  Brain,
  Cpu,
  Sparkles,
  CheckCircle2,
  Globe,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-24 py-8">
      <section className="text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-gradient">
          AI 素材处理平台
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          全栈开发的多模态 AI 应用，集成 AI 生成、智能抠图、批量处理和在线编辑
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button
            onClick={() => navigate('/generate')}
            size="lg"
            className="px-8 py-6 text-lg shadow-xl shadow-blue-500/25"
          >
            立即体验
          </Button>
          <Button
            onClick={() =>
              window.open('https://github.com/Gyzztzj/ai-material-platform')
            }
            variant="secondary"
            size="lg"
            className="px-8 py-6 text-lg"
          >
            查看源码
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-center mb-12">核心功能</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Image,
              title: 'AI 生成',
              description: '基于先进的 AI 模型，根据文字描述快速生成高质量图片',
            },
            {
              icon: Scissors,
              title: '智能抠图',
              description:
                '一键去除图片背景，生成透明背景图片，效果媲美专业工具',
            },
            {
              icon: Layers,
              title: '批量处理',
              description: '支持批量图片处理，大幅提高工作效率，节省宝贵时间',
            },
            {
              icon: Palette,
              title: '在线编辑',
              description: '内置强大的图片编辑器，支持裁剪、调整、滤镜等操作',
            },
          ].map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="bg-card border border-border rounded-xl p-6 text-center card-hover"
              >
                <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-card-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-center mb-12">技术栈</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: FileCode2,
              title: '前端',
              items: [
                'React 19',
                'TypeScript',
                'Vite',
                'Tailwind CSS',
                'shadcn/ui',
              ],
            },
            {
              icon: Server,
              title: '后端',
              items: ['NestJS', 'TypeScript', 'PostgreSQL', 'Redis'],
            },
            {
              icon: Brain,
              title: 'AI',
              items: ['通义千问', 'Qwen-VL', 'Rembg', 'OpenAI API'],
            },
            {
              icon: Cpu,
              title: '工程化',
              items: ['Docker', 'pnpm', 'ESLint', 'Jest'],
            },
          ].map((stack, index) => {
            const Icon = stack.icon
            return (
              <div
                key={index}
                className="bg-card border border-border rounded-xl p-6 card-hover"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-secondary-50 dark:bg-secondary-900/30 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-secondary" />
                  </div>
                  <h3 className="font-bold text-lg text-card-foreground">
                    {stack.title}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {stack.items.map((item, i) => (
                    <li
                      key={i}
                      className="text-muted-foreground text-sm flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-center mb-12">项目亮点</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Sparkles,
              title: '多模型调度',
              description:
                '智能调度多种 AI 模型，根据任务类型选择最优模型，确保最佳效果和性能',
            },
            {
              icon: CheckCircle2,
              title: '自动化测试',
              description:
                '完整的测试覆盖，包括单元测试、集成测试和 E2E 测试，确保代码质量',
            },
            {
              icon: Globe,
              title: '全栈闭环',
              description:
                '从前端到后端、从 AI 服务到数据库的完整闭环，提供流畅的用户体验',
            },
          ].map((highlight, index) => {
            const Icon = highlight.icon
            return (
              <div
                key={index}
                className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border border-primary-100 dark:border-primary-800 rounded-xl p-8 card-hover"
              >
                <div className="w-14 h-14 bg-card border border-border rounded-xl flex items-center justify-center mb-6 shadow-sm">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-card-foreground">
                  {highlight.title}
                </h3>
                <p className="text-muted-foreground">{highlight.description}</p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

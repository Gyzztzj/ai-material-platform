# AI 素材平台

一个基于 AI 的素材处理平台，提供图片生成、抠图、编辑和素材管理等功能。

## ✨ 功能特性

- 🎨 **AI 图片生成** - 基于提示词生成高质量图片
- ✂️ **智能抠图** - 一键去除图片背景
- 🖼️ **图片编辑** - 使用 AI 编辑和优化图片
- 📦 **批量处理** - 支持批量 AI 任务处理
- 📚 **素材库** - 完善的素材管理功能
- 👤 **用户认证** - 安全的用户注册和登录系统
- 📊 **任务追踪** - 实时查看 AI 任务状态

## 🛠️ 技术栈

### 前端
- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Zustand** - 状态管理
- **Tailwind CSS** - 样式框架
- **shadcn/ui** - UI 组件库

### 后端
- **NestJS 11** - 后端框架
- **TypeScript** - 类型安全
- **TypeORM** - ORM 框架
- **PostgreSQL** - 关系型数据库
- **Redis** - 缓存和消息队列
- **Bull** - 任务队列
- **JWT** - 认证授权
- **Swagger** - API 文档

### 第三方 AI 服务
- 通义万相 - 图片生成
- 豆包 - 图片编辑
- Remove.bg - 抠图

## 🚀 快速开始

### Docker Compose 部署（推荐）

1. 克隆项目
```bash
git clone <repository-url>
cd ai-material-platform
```

2. 配置环境变量
```bash
cp .env.docker .env
# 编辑 .env 文件，填写你的 API Keys
```

3. 启动服务
```bash
docker-compose up -d
```

4. 访问应用
- 前端: http://localhost:5173
- 后端 API: http://localhost:3000
- API 文档: http://localhost:3000/api/docs

### 本地开发部署

详细的本地部署指南请参考 [本地部署文档](./docs/本地部署文档.md)

## 📁 项目结构

```
ai-material-platform/
├── ai-material/          # 前端项目
│   ├── src/
│   │   ├── components/  # 组件
│   │   ├── pages/       # 页面
│   │   ├── services/    # API 服务
│   │   ├── hooks/       # 自定义 Hooks
│   │   ├── store/       # 状态管理
│   │   └── App.tsx
│   └── package.json
├── server/              # 后端项目
│   ├── src/
│   │   ├── ai/          # AI 模块
│   │   ├── auth/        # 认证模块
│   │   ├── common/      # 公共模块
│   │   ├── material/    # 素材模块
│   │   ├── user/        # 用户模块
│   │   └── main.ts
│   └── package.json
├── docs/                # 文档
│   ├── 前端技术文档.md
│   ├── 服务端技术文档.md
│   └── 本地部署文档.md
├── docker-compose.yml
└── package.json
```

## 📚 文档

- [前端技术文档](./docs/前端技术文档.md) - 前端架构、技术栈、组件说明
- [服务端技术文档](./docs/服务端技术文档.md) - 后端架构、API 设计、数据库设计
- [本地部署文档](./docs/本地部署文档.md) - 本地开发环境部署指南

## 🤝 开发指南

### 安装依赖
```bash
# 根目录
pnpm install

# 前端
cd ai-material
pnpm install

# 后端
cd ../server
pnpm install
```

### 启动开发环境
```bash
# 启动前端（终端 1）
pnpm dev:frontend

# 启动后端（终端 2）
pnpm dev:backend
```

### 代码规范
```bash
# 代码检查
pnpm lint

# 格式化（后端）
pnpm format:backend
```

### Git 提交
项目使用 Commitizen 进行规范提交：
```bash
pnpm commit
```

## 📝 环境变量

### 后端环境变量 (.env)
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/ai_material
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-strong-secret-key
TONGYI_API_KEY=your-tongyi-api-key
DOUBAI_API_KEY=your-doubao-api-key
REMOVE_BG_API_KEY=your-remove-bg-api-key
```

### 前端环境变量 (ai-material/.env)
```env
VITE_API_URL=http://localhost:3000/api
```

## 📄 许可证

MIT License

## 📞 联系方式

如有问题，请提交 Issue 或 Pull Request。

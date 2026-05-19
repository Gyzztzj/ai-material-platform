# AI 素材平台

一个基�?AI 的素材处理平台，提供图片生成、抠图、编辑和素材管理等功能�?
## �?功能特�?
- 🎨 **AI 图片生成** - 基于提示词生成高质量图片
- ✂️ **智能抠图** - 一键去除图片背�?- 🖼�?**图片编辑** - 使用 AI 编辑和优化图�?- 📦 **批量处理** - 支持批量 AI 任务处理
- 📚 **素材�?* - 完善的素材管理功�?- 👤 **用户认证** - 安全的用户注册和登录系统
- 📊 **任务追踪** - 实时查看 AI 任务状�?
## 🛠�?技术栈

### 前端
- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Zustand** - 状态管�?- **Tailwind CSS** - 样式框架
- **shadcn/ui** - UI 组件�?
### 后端
- **NestJS 11** - 后端框架
- **TypeScript** - 类型安全
- **TypeORM** - ORM 框架
- **PostgreSQL** - 关系型数据库
- **Redis** - 缓存和消息队�?- **Bull** - 任务队列
- **JWT** - 认证授权
- **Swagger** - API 文档

### 第三�?AI 服务
- 通义万相 - 图片生成
- 豆包 - 图片编辑
- Remove.bg - 抠图

## 🚀 快速开�?
### Docker Compose 部署（推荐）

1. 克隆项目
```bash
git clone <repository-url>
cd web-platform
```

2. 配置环境变量
```bash
cp .env.docker .env
# 编辑 .env 文件，填写你�?API Keys
```

3. 启动服务
```bash
docker-compose up -d
```

4. 访问应用
- 前端: http://localhost:5173
- 后端 API: http://localhost:3000
- API 文档: http://localhost:3000/api/docs

### 本地开发部�?
详细的本地部署指南请参�?[本地部署文档](./docs/本地部署文档.md)

## 📁 项目结构

```
web-platform/
├── web/          # 前端项目
�?  ├── src/
�?  �?  ├── components/  # 组件
�?  �?  ├── pages/       # 页面
�?  �?  ├── services/    # API 服务
�?  �?  ├── hooks/       # 自定�?Hooks
�?  �?  ├── store/       # 状态管�?�?  �?  └── App.tsx
�?  └── package.json
├── server/              # 后端项目
�?  ├── src/
�?  �?  ├── ai/          # AI 模块
�?  �?  ├── auth/        # 认证模块
�?  �?  ├── common/      # 公共模块
�?  �?  ├── material/    # 素材模块
�?  �?  ├── user/        # 用户模块
�?  �?  └── main.ts
�?  └── package.json
├── docs/                # 文档
�?  ├── 前端技术文�?md
�?  ├── 服务端技术文�?md
�?  └── 本地部署文档.md
├── docker-compose.yml
└── package.json
```

## 📚 文档

- [前端技术文档](./docs/前端技术文�?md) - 前端架构、技术栈、组件说�?- [服务端技术文档](./docs/服务端技术文�?md) - 后端架构、API 设计、数据库设计
- [本地部署文档](./docs/本地部署文档.md) - 本地开发环境部署指�?
## 🤝 开发指�?
### 安装依赖
```bash
# 根目�?pnpm install

# 前端
cd web
pnpm install

# 后端
cd ../server
pnpm install
```

### 启动开发环�?```bash
# 启动前端（终�?1�?pnpm dev:frontend

# 启动后端（终�?2�?pnpm dev:backend
```

### 代码规范
```bash
# 代码检�?pnpm lint

# 格式化（后端�?pnpm format:backend
```

### Git 提交
项目使用 Commitizen 进行规范提交�?```bash
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

### 前端环境变量 (web/.env)
```env
VITE_API_URL=http://localhost:3000/api
```

## 📄 许可�?
MIT License

## 📞 联系方式

如有问题，请提交 Issue �?Pull Request�?
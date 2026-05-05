
# AI素材平台 - 部署文档

## 项目概述

这是一个完整的AI素材生成平台，包含前端和后端两部分：

- **前端**：React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **后端**：NestJS + TypeScript + PostgreSQL + Redis + Bull队列

## 目录结构

```
ai-material-platform/
├── ai-material/        # 前端项目
└── server/             # 后端项目
```

---

## 第一部分：Vercel 部署前端

### 前置准备

1. GitHub 账号
2. Vercel 账号
3. 代码已推送到 GitHub 仓库

### 步骤 1：准备环境变量

在前端项目根目录下创建 `.env.production` 文件，或者在 Vercel 后台配置环境变量：

```env
VITE_API_URL=https://your-railway-app.railway.app
```

### 步骤 2：创建 Vercel 配置文件

在前端项目根目录创建 `vercel.json`：

```json
{
  "framework": "vite",
  "buildCommand": "cd ai-material &amp;&amp; pnpm install &amp;&amp; pnpm build",
  "outputDirectory": "ai-material/dist",
  "env": {
    "VITE_API_URL": "@vercel/VITE_API_URL"
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 步骤 3：通过 Vercel 部署

1. 登录 [Vercel](https://vercel.com)
2. 点击 "New Project"
3. 选择你的 GitHub 仓库
4. 配置项目：
   - **Project Name**: 输入项目名称（如 ai-material-platform）
   - **Root Directory**: 选择 `ai-material`（或保持默认，根据 vercel.json）
   - **Framework Preset**: 选择 Vite
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
5. 在 Environment Variables 中添加：
   - `VITE_API_URL`: 你的后端 API 地址（后面会部署到 Railway）
6. 点击 "Deploy"

### 步骤 4：配置自定义域名（可选）

1. 在 Vercel 项目 Settings → Domains 中添加自定义域名
2. 按照提示配置 DNS 解析

---

## 第二部分：Railway 部署后端 + 数据库

### 前置准备

1. GitHub 账号
2. Railway 账号
3. 代码已推送到 GitHub 仓库
4. API Keys（通义万相、豆包等）

### 步骤 1：创建 Railway 项目

1. 登录 [Railway](https://railway.app)
2. 点击 "New Project"
3. 选择 "Deploy from repo"

### 步骤 2：添加 PostgreSQL 数据库

1. 在 Railway 项目中点击 "Add Service" → "Database"
2. 选择 PostgreSQL
3. 等待数据库启动完成
4. 点击数据库，查看 Variables，会看到 `DATABASE_URL`

### 步骤 3：添加 Redis

1. 点击 "Add Service" → "Database"
2. 选择 Redis
3. 等待启动完成

### 步骤 4：配置后端服务

1. 点击 "Add Service" → "GitHub Repo"
2. 选择你的仓库
3. 配置服务：
   - **Root Directory**: `server`
   - **Build Command**: `pnpm install &amp;&amp; pnpm build`
   - **Start Command**: `node dist/main.js`

### 步骤 5：配置环境变量

在 Railway 服务 Settings → Variables 中添加以下变量：

```env
# 服务端口（Railway会自动设置）
PORT=3000

# 数据库配置（从 PostgreSQL 服务中复制 DATABASE_URL）
DATABASE_URL=postgresql://user:pass@host:port/dbname
DATABASE_SSL=true

# Redis 配置（从 Redis 服务中复制）
REDIS_HOST=xxx.railway.app
REDIS_PORT=xxx
REDIS_PASSWORD=xxx
REDIS_DB=0

# JWT配置（请修改为强密钥）
JWT_SECRET=your-strong-secret-key-here-change-in-production
JWT_EXPIRES_IN=7d

# AI API配置
TONGYI_API_KEY=your_tongyi_api_key_here
DOUBAI_API_KEY=your_doubao_api_key_here
REMOVE_BG_API_KEY=your_remove_bg_api_key_here
```

**重要说明**：
- `DATABASE_URL` 从 PostgreSQL 服务的 Variables 中复制
- Redis 相关变量从 Redis 服务的 Variables 中复制
- `DATABASE_SSL` 设为 `true` 以支持 Railway 的 SSL 连接

### 步骤 6：配置持久化存储

Railway 容器重启后文件会丢失，建议使用云存储服务（如阿里云 OSS、七牛云等）替代本地 `uploads` 目录。

临时方案（仅用于测试）：
- 使用 Redis 临时缓存图片（不推荐用于生产）

推荐方案：
- 配置云存储服务，修改代码中的文件上传逻辑

### 步骤 7：部署并生成域名

1. 点击 "Deploy"
2. 等待部署完成
3. 在 Railway 服务 Settings → Domains 中可以看到自动生成的域名

### 步骤 8：更新前端环境变量

将 Railway 生成的后端域名更新到 Vercel 的环境变量 `VITE_API_URL` 中。

---

## 第三部分：本地 Docker 部署（可选）

### 使用 Docker Compose 启动完整环境

```bash
cd server

# 复制环境变量示例文件
cp .env.example .env

# 根据需要修改 .env 文件中的配置

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app
```

服务地址：
- 前端：需要单独启动或部署
- 后端 API：http://localhost:3000
- Swagger 文档：http://localhost:3000/api
- PostgreSQL：localhost:5432
- Redis：localhost:6379

### 停止服务

```bash
docker-compose down

# 同时删除数据卷（谨慎操作）
docker-compose down -v
```

---

## 部署检查清单

- [ ] 前端已部署到 Vercel，可正常访问
- [ ] 后端已部署到 Railway，服务正常运行
- [ ] PostgreSQL 数据库已创建并连接成功
- [ ] Redis 已创建并连接成功
- [ ] 前端环境变量 `VITE_API_URL` 指向正确的后端地址
- [ ] 后端环境变量中所有 AI API Keys 已配置
- [ ] 可以正常注册/登录用户
- [ ] 可以正常生成 AI 图片
- [ ] 可以正常上传和管理素材
- [ ] Swagger 文档可访问（生产环境建议关闭）

---

## 常见问题

### Q1: Railway 部署失败，提示找不到模块

**A**: 确保 package.json 中的 dependencies 包含所有必需的包，并且 build 命令能正常完成。

### Q2: 数据库连接失败

**A**: 检查 `DATABASE_URL` 是否正确，`DATABASE_SSL` 是否设为 `true`。

### Q3: 前端显示 "Network Error"

**A**: 检查 `VITE_API_URL` 是否正确，后端是否已启动，CORS 是否配置正确。

### Q4: AI 生成失败

**A**: 检查 API Keys 是否正确配置，账户是否有足够额度。

---

## 生产环境优化建议

1. **关闭 TypeORM synchronize**：在生产环境中设置 `synchronize: false`，使用数据库迁移
2. **配置 HTTPS**：确保所有流量通过 HTTPS
3. **添加监控**：集成 Sentry、New Relic 等监控服务
4. **配置备份**：定期备份 PostgreSQL 数据库
5. **使用 CDN**：前端静态资源使用 CDN 加速
6. **配置限流**：根据实际需求调整 rate limit
7. **日志管理**：配置日志收集和分析
8. **安全加固**：
   - 配置安全的 CORS 策略
   - 添加 Helmet 安全头
   - 定期更新依赖包


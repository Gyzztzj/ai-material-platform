
# AI素材平台 - 完整项目文档

## 目录

- [第一部分：部署指南](#第一部分部署指南)
  - [1. 前端部署（Vercel平台）](#1-前端部署vercel平台)
  - [2. 服务端部署（Railway平台）](#2-服务端部署railway平台)
  - [3. 数据库部署与配置（Railway平台）](#3-数据库部署与配置railway平台)
- [第二部分：技术点文档](#第二部分技术点文档)
  - [1. 项目架构概述](#1-项目架构概述)
  - [2. 关键技术实现细节](#2-关键技术实现细节)
  - [3. 项目难点与解决方案](#3-项目难点与解决方案)
  - [4. 可扩展与可维护性设计](#4-可扩展与可维护性设计)

---

# 第一部分：部署指南

## 1. 前端部署（Vercel平台）

### 1.1 前置准备

- GitHub 账号，代码已推送到仓库
- Vercel 账号（可使用 GitHub 账号直接登录）

### 1.2 环境变量配置

在 Vercel 后台配置以下环境变量：

| 环境变量 | 说明 | 示例值 |
|---------|------|--------|
| `VITE_API_URL` | 后端 API 地址 | `https://your-railway-app.railway.app` |

### 1.3 部署步骤

#### 步骤 1：创建 Vercel 项目

1. 访问 [vercel.com](https://vercel.com) 并登录
2. 点击 **New Project**
3. 选择对应的 GitHub 仓库

#### 步骤 2：配置项目

在项目配置页面：

- **Project Name**: 输入项目名称（如 `ai-material-platform`）
- **Root Directory**: 设置为 `ai-material`
- **Framework Preset**: 选择 **Vite**
- **Build Command**: `pnpm build`
- **Output Directory**: `dist`

#### 步骤 3：配置环境变量

在 **Environment Variables** 部分：

- 添加 `VITE_API_URL`，值为后端服务地址（后面会部署到 Railway）

#### 步骤 4：部署

点击 **Deploy**，等待 1-2 分钟完成部署。部署成功后会自动生成一个 `.vercel.app` 域名。

### 1.4 自定义域名配置（可选）

1. 在 Vercel 项目页面，进入 **Settings → Domains**
2. 点击 **Add**，输入你的自定义域名
3. Vercel 会提供 DNS 配置指引，按照指引在你的域名服务商处添加记录
4. 等待 DNS 生效（通常需要几分钟到几小时）

### 1.5 部署后验证

1. 访问 Vercel 提供的域名或自定义域名
2. 检查页面是否正常加载
3. 打开浏览器开发者工具 → Network，确认 API 请求的 URL 正确

### 1.6 常见问题

#### Q: 部署成功但页面空白？

**A:** 检查以下几点：
- 确认 `VITE_API_URL` 配置正确
- 检查浏览器控制台是否有错误信息
- 确认 `vercel.json` 中配置了路由重写（见下方）

#### Q: 刷新页面 404？

**A:** 需要在前端项目根目录创建 `vercel.json` 配置路由重写：

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 2. 服务端部署（Railway平台）

### 2.1 前置准备

- GitHub 账号，代码已推送到仓库
- Railway 账号
- 各 AI 服务 API Key（通义万相、豆包、Remove.bg 等）

### 2.2 环境变量配置

后端需要配置以下环境变量：

| 环境变量 | 说明 | 是否必填 |
|---------|------|---------|
| `PORT` | 服务端口，Railway会自动设置 | 否 |
| `DATABASE_URL` | PostgreSQL 连接字符串 | 是 |
| `DATABASE_SSL` | 是否启用 SSL 连接数据库，Railway 设为 `true` | 是 |
| `REDIS_HOST` | Redis 主机地址 | 是 |
| `REDIS_PORT` | Redis 端口 | 是 |
| `REDIS_PASSWORD` | Redis 密码 | 是 |
| `REDIS_DB` | Redis 数据库编号，通常为 `0` | 是 |
| `JWT_SECRET` | JWT 签名密钥，请设置为强随机字符串 | 是 |
| `JWT_EXPIRES_IN` | Token 过期时间，如 `7d` | 否 |
| `TONGYI_API_KEY` | 阿里云通义万相 API Key | 是 |
| `DOUBAI_API_KEY` | 火山引擎豆包 API Key | 是 |
| `REMOVE_BG_API_KEY` | Remove.bg 抠图 API Key | 否 |
| `LOG_LEVEL` | 日志级别，如 `info` | 否 |

### 2.3 部署步骤

#### 步骤 1：创建 Railway 项目

1. 访问 [railway.app](https://railway.app) 并登录
2. 点击 **New Project**
3. 选择 **Deploy from repo**

#### 步骤 2：添加服务

依次添加以下三个服务：

1. **PostgreSQL 数据库**（详见第3部分）
2. **Redis**（详见第3部分）
3. **后端服务**

#### 步骤 3：配置后端服务

在添加后端服务时：

- 选择对应的 GitHub 仓库
- 配置服务参数：
  - **Root Directory**: `server`
  - **Build Command**: `pnpm install && pnpm build`
  - **Start Command**: `node dist/main.js`

#### 步骤 4：配置环境变量

在服务的 **Settings → Variables** 中添加第2.2节列出的所有环境变量。

**重要提示**：
- `DATABASE_URL` 从 PostgreSQL 服务的 Variables 中复制
- Redis 相关变量从 Redis 服务的 Variables 中复制
- `DATABASE_SSL` 必须设为 `true`

#### 步骤 5：部署

配置完成后点击 **Deploy**，等待部署完成。Railway 会自动分配一个域名（如 `your-app-name.up.railway.app`）。

### 2.4 部署状态监控

在 Railway 项目页面：

- **Deployments** 标签页：查看部署历史和日志
- **Metrics** 标签页：查看 CPU、内存、网络等资源使用情况
- 点击服务卡片可查看该服务的详细状态和日志

### 2.5 常见问题

#### Q: Railway 部署失败？

**A:** 检查以下几点：
- 确保 `package.json` 中 dependencies 包含所有必需包
- 查看部署日志（Deployments 标签页）确认错误信息
- 确保 build 命令在本地能正常运行

#### Q: 服务启动失败？

**A:** 常见原因：
- 数据库连接失败：检查 `DATABASE_URL` 和 `DATABASE_SSL`
- Redis 连接失败：检查 Redis 相关配置
- 环境变量缺失：确认所有必填环境变量都已配置

---

## 3. 数据库部署与配置（Railway平台）

### 3.1 PostgreSQL 数据库创建

#### 步骤 1：添加数据库服务

1. 在 Railway 项目中点击 **Add Service**
2. 选择 **Database**
3. 选择 **PostgreSQL**

#### 步骤 2：获取连接信息

数据库启动后：
1. 点击数据库卡片
2. 进入 **Variables** 标签页
3. 复制 `DATABASE_URL` 的值，用于配置后端服务

### 3.2 Redis 配置

#### 步骤 1：添加 Redis 服务

1. 点击 **Add Service**
2. 选择 **Database**
3. 选择 **Redis**

#### 步骤 2：获取连接信息

Redis 启动后：
1. 点击 Redis 卡片
2. 进入 **Variables** 标签页
3. 复制以下信息用于配置后端：
   - `REDISHOST` → `REDIS_HOST`
   - `REDISPORT` → `REDIS_PORT`
   - `REDISPASSWORD` → `REDIS_PASSWORD`

### 3.3 数据迁移与初始化

当前项目使用 TypeORM 的 `synchronize: true` 模式，会在启动时自动创建表结构。

**生产环境建议**：
- 关闭 `synchronize`（设为 `false`）
- 使用 TypeORM Migrations 管理数据库变更

创建迁移示例：

```bash
# 生成迁移
npx typeorm-ts-node-commonjs migration:generate src/migrations/MyMigration -d src/data-source.ts

# 运行迁移
npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts
```

### 3.4 数据库备份与恢复

#### 备份方案（Railway）

Railway 提供自动备份：
1. 进入数据库服务页面
2. 点击 **Settings**
3. 可以看到 **Backups** 部分，Railway 会自动创建备份

#### 手动备份与恢复

使用 `pg_dump` 备份：

```bash
# 备份
pg_dump "$DATABASE_URL" &gt; backup.sql

# 恢复
psql "$DATABASE_URL" &lt; backup.sql
```

---

# 第二部分：技术点文档

## 1. 项目架构概述

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                        前端层                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   首页      │  │  AI 生成页   │  │  素材库     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │  抠图页     │  │  批量处理页  │                     │
│  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS + WebSocket
                            ▼
┌─────────────────────────────────────────────────────────┐
│                      后端服务层                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Auth 模块    │  │  User 模块   │  │  AI 模块    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │Material 模块 │  │  Common 模块  │                     │
│  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
              │                       │
              │                       │
              ▼                       ▼
┌──────────────────────┐    ┌──────────────────────┐
│    PostgreSQL        │    │        Redis         │
│  - 用户表           │    │  - 缓存             │
│  - AI 任务表        │    │  - 会话管理         │
│  - 素材表           │    │  - Bull 队列        │
└──────────────────────┘    └──────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│                    第三方 AI 服务                       │
│  - 通义万相（图片生成）                                 │
│  - 豆包（图片编辑）                                     │
│  - Remove.bg（抠图）                                   │
└─────────────────────────────────────────────────────────┘
```

### 1.2 技术栈选型

#### 前端技术栈

| 技术 | 版本 | 用途 | 选型理由 |
|-----|------|------|---------|
| React | 19.x | UI 框架 | 生态丰富，社区活跃，组件化开发 |
| TypeScript | 6.x | 类型安全 | 提供静态类型检查，减少运行时错误 |
| Vite | 8.x | 构建工具 | 开发体验好，构建速度快 |
| React Router | 7.x | 路由管理 | 官方推荐，支持嵌套路由和懒加载 |
| Zustand | 5.x | 状态管理 | 轻量级，API 简洁，学习成本低 |
| Tailwind CSS | 4.x | 样式框架 | 原子化 CSS，开发效率高 |
| shadcn/ui | - | UI 组件库 | 可定制性强，与 Tailwind 完美配合 |
| Axios | 1.x | HTTP 客户端 | 支持拦截器，功能完善 |

#### 后端技术栈

| 技术 | 版本 | 用途 | 选型理由 |
|-----|------|------|---------|
| NestJS | 11.x | 后端框架 | 企业级框架，模块化架构，TypeScript 原生支持 |
| TypeScript | 5.x | 类型安全 | 与前端统一语言，全栈类型共享 |
| TypeORM | 0.3.x | ORM 框架 | 支持多种数据库，迁移工具完善 |
| PostgreSQL | 18 | 关系型数据库 | 功能强大，支持 JSONB，适合复杂查询 |
| Redis | 7.x | 缓存/队列 | 高性能，支持 Bull 队列 |
| Bull | 4.x | 任务队列 | 基于 Redis，支持任务调度和重试 |
| JWT | - | 认证授权 | 无状态认证，便于横向扩展 |
| Swagger | - | API 文档 | 自动生成文档，便于调试 |
| Winston | 3.x | 日志系统 | 功能强大，支持日志轮转 |

### 1.3 核心业务流程

#### 1.3.1 用户认证流程

```
用户注册/登录 → 验证凭证 → 生成 JWT Token → 返回 Token → 前端存储 Token
                                                              ↓
                                                   后续请求携带 Token → 后端验证 → 授权访问
```

#### 1.3.2 AI 图片生成流程

```
用户输入提示词 → 前端提交请求 → 后端创建任务记录 → 加入 Bull 队列
                                                              ↓
                                                   Worker 从队列获取任务 → 调用 AI 服务 API
                                                              ↓
                                                   更新任务状态/进度 → 前端轮询/ WebSocket 推送
                                                              ↓
                                                   任务完成 → 保存结果 → 返回给前端
```

#### 1.3.3 素材管理流程

```
用户上传图片 → 后端保存文件 → 创建素材记录 → 返回素材信息
                                                    ↓
                                        用户查看/编辑/删除素材
```

---

## 2. 关键技术实现细节

### 2.1 前端核心功能模块

#### 2.1.1 状态管理（Zustand）

**User Store** (`store/user.store.ts`)：

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  credits: number;
}

interface UserStore {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) =&gt; void;
  setToken: (token: string | null) =&gt; void;
  logout: () =&gt; void;
}

export const useUserStore = create&lt;UserStore&gt;()(
  persist(
    (set) =&gt; ({
      user: null,
      token: null,
      setUser: (user) =&gt; set({ user }),
      setToken: (token) =&gt; set({ token }),
      logout: () =&gt; set({ user: null, token: null }),
    }),
    {
      name: 'user-storage',
    }
  )
);
```

**Task Store** (`store/task.store.ts`)：管理 AI 任务状态。

#### 2.1.2 路由设计（React Router）

路由结构在 `App.tsx` 中定义：

```
/login                - 登录页（公开）
/                     - 首页（公开）
├─ /generate          - AI 生成页（需登录）
├─ /library           - 素材库（需登录）
├─ /remove-bg         - 抠图页（需登录）
└─ /batch             - 批量处理页（需登录）
```

**ProtectedRoute** (`components/auth/ProtectedRoute.tsx`)：路由守卫，检查用户是否登录。

#### 2.1.3 API 封装（Axios）

在 `services/api/axios.instance.ts` 中配置了 Axios 实例：

- 基础 URL 从环境变量读取
- 请求拦截器：自动添加 Authorization header
- 响应拦截器：
  - 解包后端响应格式 `{ code, data, message }`
  - 统一错误处理和提示

#### 2.1.4 组件封装

项目使用 shadcn/ui 组件库，组件位于 `components/ui/`：

- Button、Card、Input 等基础组件
- LoadingSpinner、PageLoading、Skeleton 等加载状态组件
- Toast 消息提示组件

### 2.2 后端 API 设计

#### 2.2.1 API 响应格式

所有 API 统一响应格式：

```typescript
{
  code: number;      // 状态码，200 表示成功
  data: any;         // 响应数据
  message: string;   // 提示信息
}
```

此格式由 `TransformInterceptor` 统一包装。

#### 2.2.2 主要接口

**认证接口** (`auth/`)：
- `POST /auth/login` - 用户登录
- `POST /auth/register` - 用户注册

**用户接口** (`user/`)：
- `GET /user/profile` - 获取当前用户信息

**AI 接口** (`ai/`)：
- `POST /ai/generate` - 生成图片
- `POST /ai/remove-bg` - 抠图
- `POST /ai/edit` - 编辑图片
- `POST /ai/batch` - 批量处理
- `GET /ai/tasks` - 获取任务列表
- `GET /ai/tasks/:id` - 获取任务详情

**素材接口** (`material/`)：
- `GET /material` - 获取素材列表
- `POST /material/upload` - 上传素材
- `PUT /material/:id` - 更新素材
- `DELETE /material/:id` - 删除素材

#### 2.2.3 DTO 验证

使用 `class-validator` 和 `class-transformer` 进行参数验证：

```typescript
import { IsString, IsEmail, MinLength } from 'class-validator';

export class LoginUserDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @IsString()
  @MinLength(6, { message: '密码至少6位' })
  password: string;
}
```

### 2.3 数据库表结构

#### 2.3.1 用户表 (`user`)

| 字段 | 类型 | 说明 | 约束 |
|-----|------|------|------|
| id | int | 主键 | auto increment |
| email | varchar | 邮箱 | unique |
| password | varchar | 密码（加密存储） | not null |
| role | varchar | 角色 | default 'user' |
| credits | int | 积分 | default 100 |
| createdAt | timestamp | 创建时间 | auto |
| updatedAt | timestamp | 更新时间 | auto |

#### 2.3.2 AI 任务表 (`ai_task`)

| 字段 | 类型 | 说明 | 约束 |
|-----|------|------|------|
| id | int | 主键 | auto increment |
| userId | int | 用户 ID | index |
| type | varchar | 任务类型 | 'generate', 'remove-bg', 'batch' |
| params | jsonb | 任务参数 | |
| status | varchar | 状态 | index, default 'pending' |
| progress | int | 进度 | default 0 |
| result | jsonb | 结果 | nullable |
| error | varchar | 错误信息 | nullable |
| createdAt | timestamp | 创建时间 | index |
| updatedAt | timestamp | 更新时间 | |

**状态说明**：
- `pending` - 等待处理
- `processing` - 处理中
- `completed` - 已完成
- `failed` - 失败

#### 2.3.3 素材表 (`material`)

| 字段 | 类型 | 说明 | 约束 |
|-----|------|------|------|
| id | int | 主键 | auto increment |
| userId | int | 用户 ID | index |
| name | varchar | 素材名称 | |
| url | varchar | 文件 URL | |
| size | int | 文件大小（字节） | |
| type | varchar | 素材类型 | index, default 'image' |
| category | varchar | 分类 | nullable |
| createdAt | timestamp | 创建时间 | index |
| updatedAt | timestamp | 更新时间 | |

### 2.4 认证授权机制

#### 2.4.1 JWT 认证流程

1. **登录**：用户提交邮箱密码，后端验证后生成 JWT Token
2. **Token 存储**：前端将 Token 存储在 localStorage
3. **请求携带**：每次 API 请求在 Authorization header 中携带 Token
4. **后端验证**：`JwtAuthGuard` 验证 Token 有效性
5. **获取用户**：`@CurrentUser()` 装饰器获取当前登录用户

#### 2.4.2 关键实现代码

**JwtAuthGuard** (`auth/jwt-auth.guard.ts`)：

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) return false;
    
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
      request.user = payload;
    } catch {
      return false;
    }
    
    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

**CurrentUser Decorator** (`auth/current-user.decorator.ts`)：

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) =&gt; {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

---

## 3. 项目难点与解决方案

### 3.1 难点 1：AI 任务异步处理

**问题描述**：
AI 服务（如图片生成）通常需要几秒到几分钟的处理时间，不能使用同步请求，否则会导致请求超时。

**解决方案**：
使用 **Bull 队列** 进行异步任务处理：

1. 请求进来后立即返回任务 ID
2. 将任务加入 Bull 队列
3. Worker 进程从队列获取任务并处理
4. 处理过程中更新任务状态和进度
5. 前端通过轮询获取任务状态

**关键实现** (`ai/ai.module.ts`)：

```typescript
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ai-tasks',
    }),
  ],
  providers: [
    GenerateService,
    GenerateProcessor, // Worker
  ],
})
export class AiModule {}
```

**Processor** (`ai/processors/generate.processor.ts`)：

```typescript
@Processor('ai-tasks')
export class GenerateProcessor {
  @Process('generate')
  async handleGenerate(job: Job) {
    // 处理图片生成
    // 更新任务状态
  }
}
```

### 3.2 难点 2：前后端状态同步

**问题描述**：
AI 任务处理时间较长，前端需要实时知道任务进度。

**解决方案**：
采用 **轮询** 机制，前端定期请求任务状态：

```typescript
// hooks/useTaskPolling.ts
import { useEffect, useRef } from 'react';

export function useTaskPolling(
  taskId: number | null,
  onUpdate: (task: any) =&gt; void,
  isComplete: (task: any) =&gt; boolean,
) {
  const intervalRef = useRef&lt;NodeJS.Timeout&gt;();

  useEffect(() =&gt; {
    if (!taskId) return;

    // 立即请求一次
    fetchTask(taskId);

    // 每 2 秒轮询
    intervalRef.current = setInterval(() =&gt; {
      fetchTask(taskId);
    }, 2000);

    return () =&gt; clearInterval(intervalRef.current);
  }, [taskId]);

  async function fetchTask(id: number) {
    const task = await getTask(id);
    onUpdate(task);
    if (isComplete(task)) {
      clearInterval(intervalRef.current);
    }
  }
}
```

**可优化方向**：后续可改用 WebSocket 实现更实时的推送。

### 3.3 难点 3：文件存储

**问题描述**：
Railway 等 PaaS 平台的文件系统是临时的，容器重启后文件会丢失。

**解决方案**：
短期方案：当前使用本地存储，适合开发测试

长期方案：建议迁移到云对象存储（如阿里云 OSS、AWS S3）

**OSS 集成示例**：

```typescript
import OSS from 'ali-oss';

const client = new OSS({
  region: 'oss-cn-hangzhou',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: 'ai-material',
});

async function uploadToOSS(file: File) {
  const result = await client.put(`uploads/${Date.now()}-${file.name}`, file);
  return result.url;
}
```

### 3.4 性能优化措施

#### 3.4.1 前端优化

- **路由懒加载**：使用 `React.lazy()` 和 `Suspense` 减少首屏加载体积
- **图片优化**：使用 WebP 格式，适当压缩
- **状态管理优化**：Zustand 按需订阅，避免不必要的重渲染

#### 3.4.2 后端优化

- **数据库索引**：在常用查询字段（userId、status、createdAt）添加索引
- **Redis 缓存**：缓存热点数据，减少数据库查询
- **接口限流**：使用 `express-rate-limit` 防止恶意请求

---

## 4. 可扩展与可维护性设计

### 4.1 代码组织架构

#### 4.1.1 后端目录结构

```
server/src/
├── ai/                    # AI 模块
│   ├── controllers/       # 控制器
│   ├── services/          # 业务逻辑
│   ├── processors/        # Bull 队列 Worker
│   ├── dto/               # 数据传输对象
│   ├── entities/          # 数据库实体
│   └── ai.module.ts
├── auth/                  # 认证模块
├── user/                  # 用户模块
├── material/              # 素材模块
├── common/                # 公共模块
│   ├── exceptions/        # 自定义异常
│   ├── filters/           # 异常过滤器
│   ├── interceptors/      # 拦截器
│   └── utils/             # 工具函数
├── config/                # 配置
├── app.module.ts
└── main.ts
```

#### 4.1.2 前端目录结构

```
ai-material/src/
├── components/
│   ├── auth/              # 认证相关组件
│   ├── editor/            # 编辑器组件
│   ├── layout/            # 布局组件
│   └── ui/                # UI 组件（shadcn）
├── hooks/                 # 自定义 Hooks
├── pages/                 # 页面组件
├── services/              # API 服务
├── store/                 # Zustand 状态管理
├── constants/             # 常量定义
├── lib/                   # 工具库
└── styles/                # 样式文件
```

### 4.2 错误处理机制

#### 4.2.1 后端错误处理

**自定义异常** (`common/exceptions/`)：

```typescript
export class ApiException extends HttpException {
  constructor(message: string, statusCode: number = 400) {
    super(message, statusCode);
  }
}
```

**全局异常过滤器** (`common/filters/http-exception.filter.ts`)：

```typescript
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse&lt;Response&gt;();
    
    const status = exception.getStatus?.() || 500;
    const message = exception.message || 'Internal server error';
    
    response.status(status).json({
      code: status,
      message,
      data: null,
    });
  }
}
```

#### 4.2.2 前端错误处理

- Axios 响应拦截器统一处理 API 错误
- Toast 组件显示用户友好的错误提示
- 路由级错误边界（Error Boundary）

### 4.3 日志系统设计

使用 **Winston** 日志库，配置在 `config/logger.config.ts`：

```typescript
export const winstonConfig = {
  transports: [
    new winston.transports.Console(),  // 控制台输出
    new winstonDailyRotateFile({       // 按天轮转文件
      dirname: 'logs',
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
};
```

**日志级别**（从低到高）：
- `debug` - 调试信息
- `info` - 一般信息
- `warn` - 警告
- `error` - 错误

### 4.4 未来功能扩展规划

#### 4.4.1 功能扩展

- [ ] 支持更多 AI 模型（Midjourney、Stable Diffusion 等）
- [ ] 图片模板功能
- [ ] 团队协作与分享
- [ ] 素材标签系统
- [ ] 高级搜索与筛选
- [ ] WebSocket 实时推送
- [ ] 订阅支付功能

#### 4.4.2 技术改进

- [ ] 引入 TypeORM Migrations 管理数据库变更
- [ ] 集成 E2E 测试（Playwright / Cypress）
- [ ] 完善单元测试
- [ ] CI/CD 自动化流程
- [ ] 集成 Sentry 错误监控
- [ ] 集成 Prometheus + Grafana 监控
- [ ] 容器化部署优化（Kubernetes）
- [ ] 多环境配置（dev/staging/prod）

---

## 附录

### A. 本地开发环境搭建

#### 前置要求

- Node.js 18+
- pnpm
- Docker（可选，用于运行 PostgreSQL 和 Redis）

#### 使用 Docker Compose（推荐）

```bash
cd server
cp .env.example .env
# 编辑 .env，填入 API Keys
docker-compose up -d
```

服务地址：
- 后端 API: http://localhost:3000
- API 文档: http://localhost:3000/api
- PostgreSQL: localhost:5432
- Redis: localhost:6379

#### 手动启动

```bash
# 1. 启动 PostgreSQL 和 Redis（使用本地安装或 Docker）

# 2. 启动后端
cd server
pnpm install
cp .env.example .env
# 编辑 .env
pnpm start:dev

# 3. 启动前端
cd ai-material
pnpm install
pnpm dev
```

### B. 快速开始参考

1. 按照部署指南依次部署数据库、后端、前端
2. 注册账号，会自动获得 100 积分
3. 访问 AI 生成页，输入提示词生成图片
4. 在素材库管理生成的素材

### C. 相关资源

- [NestJS 文档](https://docs.nestjs.com)
- [React 文档](https://react.dev)
- [Vite 文档](https://cn.vitejs.dev)
- [Tailwind CSS 文档](https://tailwindcss.com)
- [TypeORM 文档](https://typeorm.io)
- [Railway 文档](https://docs.railway.app)
- [Vercel 文档](https://vercel.com/docs)


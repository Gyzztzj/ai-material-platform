# AI 素材平台 - 后端

这是 AI 素材平台的后端项目，基于 NestJS 11 + TypeScript 构建的企业级 REST API 服务。

## 技术栈

- **NestJS 11** - 后端框架
- **TypeScript** - 类型安全
- **TypeORM** - ORM 框架
- **PostgreSQL** - 关系型数据库
- **Redis** - 缓存和消息队列
- **Bull** - 任务队列
- **JWT** - 认证授权
- **Swagger** - API 文档
- **Winston** - 日志系统
- **bcrypt** - 密码加密

## 开发指南

### 安装依赖
```bash
pnpm install
```

### 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件填入配置
```

### 启动开发服务器
```bash
# 开发模式（支持热重载）
pnpm start:dev

# 调试模式
pnpm start:debug

# 生产模式
pnpm build
pnpm start:prod
```

### 代码规范
```bash
# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

## 环境变量

```env
# 服务配置
PORT=3000
NODE_ENV=development

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/ai_material
DATABASE_SSL=false

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT 配置
JWT_SECRET=your-strong-secret-key-here
JWT_EXPIRES_IN=7d

# AI API 配置
TONGYI_API_KEY=your-tongyi-api-key
DOUBAI_API_KEY=your-doubao-api-key
REMOVE_BG_API_KEY=your-remove-bg-api-key

# 日志配置
LOG_LEVEL=info
```

## 项目结构

```
src/
├── ai/                    # AI 模块
│   ├── constants/         # 常量
│   ├── controllers/       # 控制器
│   ├── dto/               # 数据传输对象
│   ├── entities/          # 数据库实体
│   ├── processors/        # 任务处理器
│   ├── services/          # 业务逻辑
│   ├── ai.controller.ts
│   └── ai.module.ts
├── auth/                  # 认证模块
├── common/                # 公共模块
├── config/                # 配置
├── database/              # 数据库
├── material/              # 素材模块
├── user/                  # 用户模块
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts
```

## API 文档

启动服务后访问：
- Swagger 文档: http://localhost:3000/api/docs

## 文档

详细的技术文档请参考 [服务端技术文档](../docs/服务端技术文档.md)

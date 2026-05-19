# AI 素材平台 - 前端

这是 AI 素材平台的前端项目，基于 React 19 + TypeScript + Vite 构建。

## 技术栈

- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **React Router** - 路由管理
- **Zustand** - 状态管理
- **Tailwind CSS** - 样式框架
- **shadcn/ui** - UI 组件库
- **Axios** - HTTP 客户端
- **Lucide React** - 图标库

## 开发指南

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm dev
```

### 构建生产版本
```bash
pnpm build
```

### 预览构建结果
```bash
pnpm preview
```

### 代码检查
```bash
pnpm lint
```

## 环境变量

创建 `.env` 文件配置：

```env
VITE_API_URL=http://localhost:3000/api
```

## 项目结构

```
src/
├── components/      # 组件
│   ├── auth/       # 认证相关组件
│   ├── editor/     # 编辑器组件
│   ├── layout/     # 布局组件
│   └── ui/         # UI 基础组件
├── hooks/          # 自定义 Hooks
├── pages/          # 页面
├── services/       # API 服务
├── store/          # 状态管理
├── constants/      # 常量
├── lib/            # 工具库
├── styles/         # 样式
├── App.tsx         # 根组件
└── main.tsx        # 应用入口
```

## 文档

详细的技术文档请参考 [前端技术文档](../docs/前端技术文档.md)

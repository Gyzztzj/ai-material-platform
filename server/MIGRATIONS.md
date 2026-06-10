# 数据库迁移指南

## 迁移命令说明

### 运行所有未执行的迁移

```bash
pnpm migration:run
```

### 回滚最后一个迁移

```bash
pnpm migration:revert
```

### 查看所有迁移状态

```bash
pnpm migration:show
```

### 创建新的空迁移文件

```bash
pnpm migration:create src/database/migrations/YourMigrationName
```

### 根据实体变化自动生成迁移文件

```bash
pnpm migration:generate
```

## 首次运行

确保你已经：

1. 配置好 `.env` 文件中的数据库连接信息
2. 创建了数据库 `ai-material-db`（如果尚未创建）
3. 运行 `pnpm install` 安装所有依赖

然后执行迁移：

```bash
pnpm migration:run
```

## 开发流程

1. 修改实体文件（`*.entity.ts`）
2. 生成迁移文件：`pnpm migration:generate`
3. 检查生成的迁移文件是否正确
4. 运行迁移：`pnpm migration:run`

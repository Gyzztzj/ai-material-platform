FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@10.12.1

# 允许构建脚本运行
RUN pnpm config set allow-scripts true

COPY package.json pnpm-lock.yaml ./

# 安装所有依赖（包括 devDependencies）
RUN pnpm install --frozen-lockfile

COPY . .

# 确保我们有必要的构建文件
RUN ls -la

# 构建应用
RUN pnpm build

# 检查构建输出
RUN ls -la dist || true

FROM node:22-alpine AS production

WORKDIR /app

# 安装wget用于健康检查
RUN apk add --no-cache wget

RUN npm install -g pnpm@10.12.1

# 允许构建脚本运行
RUN pnpm config set allow-scripts true

COPY package.json pnpm-lock.yaml ./

# 只安装生产依赖
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
# 使用 Node.js 18 Alpine 版本
FROM node:18-alpine AS base

# 安裝 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml* ./

# 安裝依賴
RUN pnpm install --frozen-lockfile

# 複製所有檔案
COPY . .

# 建置應用程式
RUN pnpm build

# 暴露 3000 port
EXPOSE 3000

# 啟動應用程式
CMD ["pnpm", "start"]

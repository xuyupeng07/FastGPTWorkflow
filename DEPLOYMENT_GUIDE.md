# FastGPT工作流案例系统部署指南

## 项目概述

本项目是一个完整的FastGPT工作流案例分享系统，包含：
- 前端Web应用（Next.js）
- 后端API服务（Express.js）
- PostgreSQL数据库
- 完整的工作流数据管理

## 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端Web应用    │────│   后端API服务   │────│  PostgreSQL     │
│   (Next.js)     │    │   (Express.js)  │    │   数据库        │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 48900   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 环境要求

- Node.js 16.0+
- npm 或 yarn
- PostgreSQL 12+
- Git

## 快速部署

### 1. 克隆项目

```bash
git clone <repository-url>
cd fastgpt-workflow-share
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置数据库

#### 3.1 数据库连接配置

在项目中，数据库连接配置位于：
- `database/setup.js`
- `database/migrate-data.js`
- `api/server.js`

当前配置：
```javascript
const DATABASE_URL = 'postgresql://postgres:bzncrmdw@dbconn.sealoshzh.site:48900/?directConnection=true';
```

**生产环境部署时，请修改为您自己的数据库连接信息。**

#### 3.2 初始化数据库

```bash
# 创建数据库表结构
node database/setup.js

# 迁移示例数据
node database/migrate-data.js

# 验证数据库连接和数据
node test-db.js
```

### 4. 启动服务

#### 4.1 启动API服务器

```bash
node api/server.js
```

服务器将在 `http://localhost:3001` 启动

#### 4.2 启动前端应用

```bash
npm run dev
```

前端应用将在 `http://localhost:3000` 启动

### 5. 验证部署

#### 5.1 测试API接口

```bash
node test-api.js
```

#### 5.2 访问前端应用

打开浏览器访问 `http://localhost:3000`

## 生产环境部署

### 1. 环境变量配置

创建 `.env` 文件：

```bash
# 数据库配置
DATABASE_URL=postgresql://username:password@host:port/database

# API服务器配置
API_PORT=3001
API_HOST=0.0.0.0

# 前端配置
NEXT_PUBLIC_API_URL=http://your-api-domain.com
```

### 2. 构建前端应用

```bash
npm run build
```

### 3. 使用PM2部署（推荐）

#### 3.1 安装PM2

```bash
npm install -g pm2
```

#### 3.2 创建PM2配置文件

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [
    {
      name: 'fastgpt-api',
      script: 'api/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      exec_mode: 'cluster'
    },
    {
      name: 'fastgpt-web',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'cluster'
    }
  ]
};
```

#### 3.3 启动服务

```bash
pm2 start ecosystem.config.js
```

### 4. 使用Docker部署

#### 4.1 创建Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000 3001

CMD ["npm", "start"]
```

#### 4.2 创建docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/fastgpt
    depends_on:
      - db

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=fastgpt
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

#### 4.3 启动容器

```bash
docker-compose up -d
```

## 数据库管理

### 备份数据库

```bash
pg_dump "postgresql://username:password@host:port/database" > backup.sql
```

### 恢复数据库

```bash
psql "postgresql://username:password@host:port/database" < backup.sql
```

### 数据库迁移

如需添加新的工作流数据，可以：

1. 修改 `database/migrate-data.js` 中的数据
2. 重新运行迁移脚本：

```bash
node database/migrate-data.js
```

## 监控和日志

### 1. API服务监控

健康检查端点：`GET /health`

```bash
curl http://localhost:3001/health
```

### 2. 日志管理

使用PM2查看日志：

```bash
pm2 logs fastgpt-api
pm2 logs fastgpt-web
```

### 3. 性能监控

```bash
pm2 monit
```

## 故障排除

### 常见问题

#### 1. 数据库连接失败

- 检查数据库连接字符串
- 确认数据库服务正在运行
- 检查网络连接和防火墙设置

#### 2. API服务启动失败

- 检查端口是否被占用
- 查看错误日志
- 确认依赖包已正确安装

#### 3. 前端应用无法访问API

- 检查API服务是否正在运行
- 确认API URL配置正确
- 检查CORS设置

### 调试命令

```bash
# 测试数据库连接
node test-db.js

# 测试API接口
node test-api.js

# 检查端口占用
lsof -i :3000
lsof -i :3001

# 查看进程状态
pm2 status
```

## 安全配置

### 1. 数据库安全

- 使用强密码
- 限制数据库访问IP
- 启用SSL连接
- 定期备份数据

### 2. API安全

- 添加API密钥认证
- 配置CORS策略
- 启用HTTPS
- 添加请求频率限制

### 3. 服务器安全

- 使用防火墙
- 定期更新系统
- 监控异常访问
- 配置SSL证书

## 扩展功能

### 1. 添加新的工作流

1. 在 `database/migrate-data.js` 中添加新的工作流数据
2. 运行迁移脚本更新数据库
3. 重启API服务

### 2. 自定义API接口

在 `api/server.js` 中添加新的路由和处理逻辑

### 3. 前端功能扩展

修改 `src/` 目录下的组件和页面文件

## 维护计划

### 日常维护

- 监控系统性能
- 检查错误日志
- 备份数据库
- 更新依赖包

### 定期维护

- 清理旧日志文件
- 优化数据库性能
- 更新系统安全补丁
- 检查磁盘空间使用

## 技术支持

如遇到部署问题，请检查：

1. 系统要求是否满足
2. 依赖包是否正确安装
3. 配置文件是否正确
4. 网络连接是否正常
5. 日志文件中的错误信息

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 完整的数据库设计和API接口
- 前端工作流展示功能
- 用户行为统计功能
- 完整的部署文档
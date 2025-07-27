# 环境变量配置说明

本项目已将所有硬编码配置替换为环境变量，便于不同环境的部署和管理。

## 📋 完整环境变量列表

### 数据库配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `DATABASE_URL` | `postgresql://postgres:bzncrmdw@dbconn.sealoshzh.site:48900/?directConnection=true` | PostgreSQL数据库连接字符串 |
| `DB_MAX_CONNECTIONS` | `10` | 数据库连接池最大连接数 |
| `DB_IDLE_TIMEOUT` | `30000` | 空闲连接超时时间（毫秒） |
| `DB_CONNECTION_TIMEOUT` | `10000` | 连接超时时间（毫秒） |
| `DB_QUERY_TIMEOUT` | `30000` | 查询超时时间（毫秒） |

### API服务器配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PORT` | `3002` | API服务器端口号 |
| `API_BASE_URL` | `http://localhost:3002` | API服务器基础URL |
| `NODE_ENV` | `development` | 运行环境（development/production） |

### 前端配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3002` | 前端调用的API地址（公开变量） |
| `FRONTEND_PORT` | `3000` | 前端应用端口号 |
| `HEALTH_CHECK_INTERVAL` | `30000` | 健康检查间隔时间（毫秒） |
| `DATA_QUERY_LIMIT` | `3000` | 数据查询限制条数 |

### CORS配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,https://qktyoucivudx.sealoshzh.site,https://vjugeqdfnhuc.sealoshzh.site` | 允许的跨域请求来源（逗号分隔） |

### 文件上传配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `UPLOAD_MAX_SIZE` | `5242880` | 文件上传最大大小（字节，默认5MB） |
| `UPLOAD_DIR` | `public/uploads` | 文件上传目录 |

## 🚀 使用方法

### 1. 本地开发

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量文件
vim .env

# 启动服务
pnpm run dev:full
```

### 2. 生产部署

#### Docker部署

```dockerfile
# Dockerfile示例
FROM node:18-alpine

# 设置环境变量
ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://user:pass@host:port/db
ENV NEXT_PUBLIC_API_URL=https://your-api-domain.com
ENV ALLOWED_ORIGINS=https://your-frontend-domain.com

# ... 其他配置
```

#### 云平台部署

在云平台（如Vercel、Railway、Heroku等）的环境变量配置中设置：

```bash
DATABASE_URL=postgresql://user:pass@host:port/db
NEXT_PUBLIC_API_URL=https://your-api-domain.com
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-admin-domain.com
NODE_ENV=production
```

### 3. 环境特定配置

#### 开发环境 (.env.development)
```bash
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/fastgpt_dev
NEXT_PUBLIC_API_URL=http://localhost:3002
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

#### 测试环境 (.env.test)
```bash
NODE_ENV=test
DATABASE_URL=postgresql://localhost:5432/fastgpt_test
NEXT_PUBLIC_API_URL=http://localhost:3002
DATA_QUERY_LIMIT=100
```

#### 生产环境 (.env.production)
```bash
NODE_ENV=production
DATABASE_URL=postgresql://prod-host:5432/fastgpt_prod
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com
DB_MAX_CONNECTIONS=20
UPLOAD_MAX_SIZE=10485760
```

## 🔧 配置验证

启动应用时，会在控制台输出当前配置信息：

```bash
🌐 允许的CORS域名: ['http://localhost:3000', 'https://yourdomain.com']
🚀 API服务器已启动
📍 地址: http://localhost:3002
✅ 数据库连接池创建成功
```

## 📝 配置最佳实践

### 1. 安全性
- ❌ 不要在代码中硬编码敏感信息
- ✅ 使用环境变量存储数据库密码、API密钥等
- ✅ 在生产环境中使用强密码和加密连接

### 2. 环境隔离
- ✅ 为不同环境使用不同的数据库
- ✅ 使用不同的域名和端口
- ✅ 根据环境调整性能参数

### 3. 版本控制
- ✅ 提交 `.env.example` 文件作为模板
- ❌ 不要提交实际的 `.env` 文件
- ✅ 在 `.gitignore` 中排除 `.env` 文件

### 4. 文档维护
- ✅ 及时更新环境变量文档
- ✅ 为新增的环境变量提供默认值
- ✅ 说明每个变量的用途和影响

## 🐛 故障排除

### 1. 环境变量未生效

检查文件名是否正确：
```bash
ls -la .env*
# 应该看到 .env 文件（不是 .env.example）
```

### 2. 数据库连接失败

验证数据库连接字符串：
```bash
echo $DATABASE_URL
# 或在Node.js中
console.log('DATABASE_URL:', process.env.DATABASE_URL);
```

### 3. CORS错误

检查允许的域名配置：
```bash
echo $ALLOWED_ORIGINS
# 确保包含当前访问的域名
```

### 4. 前端API调用失败

确认公开环境变量：
```bash
echo $NEXT_PUBLIC_API_URL
# Next.js的公开变量必须以NEXT_PUBLIC_开头
```

## 🔄 迁移指南

如果你有旧版本的硬编码配置，按以下步骤迁移：

1. **备份现有配置**
2. **创建 `.env` 文件**
3. **设置所需的环境变量**
4. **重启应用服务**
5. **验证功能正常**

现在你的FastGPT工作流项目已经完全支持环境变量配置，可以轻松在不同环境间部署和管理！
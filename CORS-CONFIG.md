# 跨域配置说明

## 问题描述
在公网部署时，前端应用和API服务器可能运行在不同的域名下，这会导致浏览器的同源策略阻止跨域请求，出现CORS（Cross-Origin Resource Sharing）错误。

## 解决方案

### 1. API服务器CORS配置

我们在 `api/server.js` 中配置了完善的CORS支持：

- **动态域名检查**：支持从环境变量读取允许的域名列表
- **开发环境友好**：自动允许所有localhost和127.0.0.1的请求
- **生产环境安全**：只允许配置的特定域名
- **完整的HTTP方法支持**：GET, POST, PUT, DELETE, OPTIONS
- **凭据支持**：允许携带cookies和认证信息

### 2. Next.js配置

在 `next.config.ts` 中添加了CORS响应头：

- 为所有路由添加基础CORS头部
- 为API路由添加专门的CORS配置
- 支持预检请求（OPTIONS）

### 3. 环境变量配置

创建 `.env` 文件来配置允许的域名：

```bash
# 复制示例配置文件
cp .env.example .env

# 编辑配置文件，添加你的域名
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

## 使用方法

### 本地开发

1. 启动API服务器：
```bash
pnpm run dev:api
```

2. 启动前端应用：
```bash
pnpm run dev
```

### 公网部署

1. 设置环境变量 `ALLOWED_ORIGINS`，包含你的公网域名
2. 重启API服务器
3. 确保前端应用的API请求指向正确的API服务器地址

## 当前支持的域名

- 本地开发：`http://localhost:3000-3003`
- 公网部署：
  - `https://qktyoucivudx.sealoshzh.site`
  - `https://vjugeqdfnhuc.sealoshzh.site`

## 故障排除

### 1. 检查CORS错误

在浏览器开发者工具的控制台中查看是否有类似错误：
```
Access to fetch at 'https://api.example.com' from origin 'https://app.example.com' has been blocked by CORS policy
```

### 2. 验证配置

启动API服务器时，会在控制台输出当前允许的域名列表：
```
🌐 允许的CORS域名: ['http://localhost:3000', 'https://your-domain.com']
```

### 3. 测试CORS

可以使用curl命令测试CORS配置：
```bash
curl -H "Origin: https://your-domain.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://your-api-server.com/api/workflows
```

## 安全注意事项

1. **不要使用通配符 `*`** 在生产环境中，除非确实需要
2. **定期审查允许的域名列表**，移除不再需要的域名
3. **使用HTTPS**，特别是在生产环境中
4. **限制允许的HTTP方法**，只开放必要的方法

## 更多配置选项

如果需要更复杂的CORS配置，可以修改 `api/server.js` 中的CORS设置：

```javascript
app.use(cors({
  origin: function (origin, callback) {
    // 自定义域名验证逻辑
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'], // 暴露自定义响应头
  maxAge: 86400 // 预检请求缓存时间（秒）
}));
```
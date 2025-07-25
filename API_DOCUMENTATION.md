# FastGPT工作流案例 API 文档

## 概述

本API提供FastGPT工作流案例的完整数据访问接口，支持工作流的查询、分类、标签管理和用户行为统计等功能。

**基础URL**: `http://localhost:3001`

## 认证

当前版本为开放API，无需认证。

## 响应格式

所有API响应都采用统一的JSON格式：

```json
{
  "success": true|false,
  "data": {},
  "error": "错误信息",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## API接口

### 1. 工作流分类

#### 获取所有分类

```http
GET /api/categories
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "customer-service",
      "name": "客服助手",
      "description": "智能客服相关工作流",
      "icon": "MessageCircle",
      "color": "#3b82f6",
      "sort_order": 1,
      "workflow_count": 15
    }
  ]
}
```

### 2. 工作流管理

#### 获取工作流列表

```http
GET /api/workflows
```

**查询参数**:
- `category` (string): 分类ID，"all"表示所有分类
- `search` (string): 搜索关键词
- `tag` (string): 标签筛选
- `difficulty` (string): 难度筛选 (beginner|intermediate|advanced)
- `page` (number): 页码，默认1
- `limit` (number): 每页数量，默认20

**示例请求**:
```http
GET /api/workflows?category=customer-service&page=1&limit=10
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "customer-service-demo",
      "title": "智能客服助手",
      "description": "基于FastGPT构建的智能客服系统",
      "long_description": "详细描述...",
      "category_id": "customer-service",
      "category_name": "客服助手",
      "author_id": 1,
      "author_name": "FastGPT团队",
      "author_avatar": "/avatars/fastgpt-team.jpg",
      "thumbnail_url": "/thumbnails/customer-service.jpg",
      "difficulty": "intermediate",
      "estimated_time": "30分钟",
      "usage_count": 1234,
      "like_count": 89,
      "demo_url": "https://demo.fastgpt.com/customer-service",
      "share_id": "g20squJLPzWUtIyLXr3oLfE0",
      "status": "published",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "published_at": "2024-01-01T00:00:00.000Z",
      "tags": ["AI助手", "客服", "对话"],
      "screenshots": ["/screenshots/customer-service-1.jpg"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### 获取工作流详情

```http
GET /api/workflows/:id
```

**路径参数**:
- `id` (string): 工作流ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "customer-service-demo",
    "title": "智能客服助手",
    "description": "基于FastGPT构建的智能客服系统",
    "long_description": "详细描述...",
    "category_id": "customer-service",
    "category_name": "客服助手",
    "author_name": "FastGPT团队",
    "author_avatar": "/avatars/fastgpt-team.jpg",
    "author_bio": "专业的AI工作流开发团队",
    "config_json": {
      "nodes": [...],
      "edges": [...],
      "variables": [...]
    },
    "nodes_count": 5,
    "edges_count": 4,
    "variables_count": 3,
    "tags": ["AI助手", "客服", "对话"],
    "screenshots": ["/screenshots/customer-service-1.jpg"],
    "instructions": [
      "1. 配置知识库，上传常见问题和答案",
      "2. 设置对话流程和转接规则"
    ],
    "requirements": [
      "FastGPT账号",
      "知识库数据"
    ]
  }
}
```

### 3. 标签管理

#### 获取所有标签

```http
GET /api/tags
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "AI助手",
      "color": "#3b82f6",
      "usage_count": 25
    }
  ]
}
```

### 4. 用户行为

#### 记录用户行为

```http
POST /api/workflows/:id/actions
```

**路径参数**:
- `id` (string): 工作流ID

**请求体**:
```json
{
  "action_type": "view|like|copy|download|try"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "操作记录成功"
}
```

### 5. 统计信息

#### 获取统计信息

```http
GET /api/stats
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalWorkflows": 50,
    "categoryStats": [
      {
        "category_id": "customer-service",
        "workflow_count": 15
      }
    ],
    "popularTags": [
      {
        "tag_name": "AI助手",
        "usage_count": 25
      }
    ],
    "recentActions": [
      {
        "action_type": "view",
        "count": 1234
      }
    ]
  }
}
```

### 6. 系统状态

#### 健康检查

```http
GET /health
```

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

## 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 数据模型

### 工作流 (Workflow)

```typescript
interface Workflow {
  id: string;
  title: string;
  description: string;
  long_description?: string;
  category_id: string;
  author_id: number;
  thumbnail_url?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_time?: string;
  usage_count: number;
  like_count: number;
  demo_url?: string;
  share_id?: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  published_at?: string;
}
```

### 工作流配置 (WorkflowConfig)

```typescript
interface WorkflowConfig {
  workflow_id: string;
  config_json: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    variables: WorkflowVariable[];
    version: string;
    aiSettings?: any;
    dataset?: any;
    selectedTools?: any;
    chatConfig?: any;
  };
  nodes_count: number;
  edges_count: number;
  variables_count: number;
}
```

### 分类 (Category)

```typescript
interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order: number;
}
```

### 标签 (Tag)

```typescript
interface Tag {
  id: number;
  name: string;
  color?: string;
  description?: string;
}
```

## 使用示例

### JavaScript/TypeScript

```javascript
// 获取工作流列表
const response = await fetch('/api/workflows?category=customer-service&page=1');
const data = await response.json();

if (data.success) {
  console.log('工作流列表:', data.data);
  console.log('分页信息:', data.pagination);
}

// 获取工作流详情
const workflowResponse = await fetch('/api/workflows/customer-service-demo');
const workflowData = await workflowResponse.json();

if (workflowData.success) {
  console.log('工作流配置:', workflowData.data.config_json);
}

// 记录用户行为
const actionResponse = await fetch('/api/workflows/customer-service-demo/actions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action_type: 'view'
  })
});
```

### cURL

```bash
# 获取所有分类
curl -X GET "http://localhost:3001/api/categories"

# 搜索工作流
curl -X GET "http://localhost:3001/api/workflows?search=客服&category=customer-service"

# 获取工作流详情
curl -X GET "http://localhost:3001/api/workflows/customer-service-demo"

# 记录点赞行为
curl -X POST "http://localhost:3001/api/workflows/customer-service-demo/actions" \
  -H "Content-Type: application/json" \
  -d '{"action_type": "like"}'
```

## 部署说明

### 环境要求

- Node.js 16+
- PostgreSQL 12+
- npm 或 yarn

### 启动步骤

1. 安装依赖:
```bash
npm install
```

2. 初始化数据库:
```bash
node database/setup.js
```

3. 迁移数据:
```bash
node database/migrate-data.js
```

4. 启动API服务器:
```bash
node api/server.js
```

5. 访问API:
```
http://localhost:3001/api/workflows
```

### 环境变量

```bash
# 数据库连接
DATABASE_URL=postgresql://username:password@host:port/database

# 服务器端口
PORT=3001
```

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 支持工作流CRUD操作
- 支持分类和标签管理
- 支持用户行为统计
- 支持搜索和筛选功能
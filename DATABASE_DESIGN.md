# FastGPT工作流案例数据库设计文档

## 1. 项目概述

### 1.1 目标
构建一个完整的工作流案例数据库系统，支持工作流的存储、检索、分类和管理，为FastGPT工作流分享平台提供数据支撑。

### 1.2 核心功能
- 工作流案例的CRUD操作
- 分类管理和标签系统
- 用户统计和评价系统
- 搜索和筛选功能
- 免登录体验链接管理

## 2. 数据库设计

### 2.1 技术选型
- **数据库**: PostgreSQL 14+
- **ORM**: Prisma
- **缓存**: Redis
- **文件存储**: AWS S3 / 阿里云OSS

### 2.2 数据库表结构

#### 2.2.1 工作流分类表 (workflow_categories)
```sql
CREATE TABLE workflow_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.2.2 作者表 (authors)
```sql
CREATE TABLE authors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    website_url TEXT,
    github_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.2.3 工作流表 (workflows)
```sql
CREATE TABLE workflows (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    long_description TEXT,
    category_id VARCHAR(50) NOT NULL REFERENCES workflow_categories(id),
    author_id INTEGER NOT NULL REFERENCES authors(id),
    thumbnail_url TEXT NOT NULL,
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) NOT NULL,
    estimated_time VARCHAR(50) NOT NULL,
    usage_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    demo_url TEXT,
    share_id VARCHAR(100) UNIQUE, -- FastGPT分享ID
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    version VARCHAR(20) DEFAULT '1.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);
```

#### 2.2.4 工作流配置表 (workflow_configs)
```sql
CREATE TABLE workflow_configs (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(50) NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    config_json JSONB NOT NULL, -- 完整的FastGPT配置JSON
    nodes_count INTEGER NOT NULL,
    edges_count INTEGER NOT NULL,
    variables_count INTEGER NOT NULL,
    config_version VARCHAR(20) DEFAULT '1.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```



#### 2.2.7 工作流截图表 (workflow_screenshots)
```sql
CREATE TABLE workflow_screenshots (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(50) NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(200),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.2.8 工作流说明表 (workflow_instructions)
```sql
CREATE TABLE workflow_instructions (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(50) NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    instruction_text TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.2.9 工作流需求表 (workflow_requirements)
```sql
CREATE TABLE workflow_requirements (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(50) NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    requirement_text TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.2.10 用户行为统计表 (user_actions)
```sql
CREATE TABLE user_actions (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(50) NOT NULL REFERENCES workflows(id),
    action_type VARCHAR(20) CHECK (action_type IN ('view', 'like', 'copy', 'try', 'share')) NOT NULL,
    user_ip VARCHAR(45),
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.3 索引设计
```sql
-- 工作流表索引
CREATE INDEX idx_workflows_category ON workflows(category_id);
CREATE INDEX idx_workflows_author ON workflows(author_id);
CREATE INDEX idx_workflows_published ON workflows(is_published, published_at);
CREATE INDEX idx_workflows_featured ON workflows(is_featured);
CREATE INDEX idx_workflows_usage ON workflows(usage_count DESC);
CREATE INDEX idx_workflows_likes ON workflows(like_count DESC);
CREATE INDEX idx_workflows_created ON workflows(created_at DESC);

-- 全文搜索索引
CREATE INDEX idx_workflows_search ON workflows USING gin(to_tsvector('english', title || ' ' || description));

-- 用户行为索引
CREATE INDEX idx_user_actions_workflow ON user_actions(workflow_id, action_type);
CREATE INDEX idx_user_actions_time ON user_actions(created_at);
```

## 3. 后端API设计

### 3.1 技术架构
- **框架**: Next.js 14 API Routes
- **验证**: Zod
- **数据库**: Prisma ORM
- **缓存**: Redis
- **限流**: Rate Limiting

### 3.2 API接口规范

#### 3.2.1 工作流相关接口

##### GET /api/workflows
获取工作流列表

**请求参数:**
```typescript
interface GetWorkflowsQuery {
  page?: number;           // 页码，默认1
  limit?: number;          // 每页数量，默认20，最大100
  category?: string;       // 分类ID
  difficulty?: string;     // 难度级别

  search?: string;         // 搜索关键词
  sortBy?: 'newest' | 'popular' | 'usage' | 'likes'; // 排序方式
  featured?: boolean;      // 是否只返回精选
}
```

**响应格式:**
```typescript
interface GetWorkflowsResponse {
  success: boolean;
  data: {
    workflows: Workflow[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    filters: {
      categories: WorkflowCategory[];
      difficulties: string[];
    };
  };
  message?: string;
}
```

##### GET /api/workflows/[id]
获取单个工作流详情

**响应格式:**
```typescript
interface GetWorkflowResponse {
  success: boolean;
  data: {
    workflow: Workflow;
    related: Workflow[]; // 相关工作流
    stats: {
      copyCount: number;
      tryCount: number;
    };
  };
  message?: string;
}
```

##### POST /api/workflows
创建新工作流

**请求体:**
```typescript
interface CreateWorkflowRequest {
  title: string;
  description: string;
  longDescription?: string;
  categoryId: string;
  authorId: number;
  thumbnailUrl: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  demoUrl?: string;
  shareId?: string;

  screenshots: string[];
  instructions: string[];
  requirements: string[];
  config: FastGPTWorkflowConfig;
}
```

##### PUT /api/workflows/[id]
更新工作流

##### DELETE /api/workflows/[id]
删除工作流

#### 3.2.2 分类相关接口

##### GET /api/categories
获取所有分类

**响应格式:**
```typescript
interface GetCategoriesResponse {
  success: boolean;
  data: {
    categories: WorkflowCategory[];
  };
}
```

##### POST /api/categories
创建新分类

##### PUT /api/categories/[id]
更新分类

##### DELETE /api/categories/[id]
删除分类

#### 3.2.3 统计相关接口

##### POST /api/workflows/[id]/actions
记录用户行为

**请求体:**
```typescript
interface RecordActionRequest {
  action: 'view' | 'like' | 'copy' | 'try' | 'share';
  userAgent?: string;
  referrer?: string;
}
```

##### GET /api/stats/dashboard
获取仪表板统计数据

**响应格式:**
```typescript
interface DashboardStatsResponse {
  success: boolean;
  data: {
    totalWorkflows: number;
    totalCopies: number;
    totalTries: number;
    popularWorkflows: Workflow[];
    recentWorkflows: Workflow[];
    categoryStats: {
      categoryId: string;
      name: string;
      count: number;
    }[];
    dailyStats: {
      date: string;
      copies: number;
      tries: number;
    }[];
  };
}
```

#### 3.2.5 搜索相关接口

##### GET /api/search
全文搜索工作流

**请求参数:**
```typescript
interface SearchQuery {
  q: string;              // 搜索关键词
  page?: number;
  limit?: number;
  category?: string;
  difficulty?: string;

}
```

##### GET /api/search/suggestions
获取搜索建议

**请求参数:**
```typescript
interface SearchSuggestionsQuery {
  q: string;              // 搜索关键词前缀
  limit?: number;         // 建议数量，默认10
}
```

### 3.3 数据模型定义

#### 3.3.1 Prisma Schema
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model WorkflowCategory {
  id          String      @id
  name        String
  icon        String
  color       String
  description String?
  sortOrder   Int         @default(0) @map("sort_order")
  isActive    Boolean     @default(true) @map("is_active")
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")
  
  workflows   Workflow[]
  
  @@map("workflow_categories")
}

model Author {
  id         Int       @id @default(autoincrement())
  name       String
  email      String?   @unique
  avatarUrl  String?   @map("avatar_url")
  bio        String?
  websiteUrl String?   @map("website_url")
  githubUrl  String?   @map("github_url")
  isVerified Boolean   @default(false) @map("is_verified")
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")
  
  workflows  Workflow[]
  
  @@map("authors")
}

model Workflow {
  id              String            @id
  title           String
  description     String
  longDescription String?           @map("long_description")
  categoryId      String            @map("category_id")
  authorId        Int               @map("author_id")
  thumbnailUrl    String            @map("thumbnail_url")
  difficulty      Difficulty
  estimatedTime   String            @map("estimated_time")
  usageCount      Int               @default(0) @map("usage_count")
  likeCount       Int               @default(0) @map("like_count")
  demoUrl         String?           @map("demo_url")
  shareId         String?           @unique @map("share_id")
  isFeatured      Boolean           @default(false) @map("is_featured")
  isPublished     Boolean           @default(true) @map("is_published")
  version         String            @default("1.0")
  createdAt       DateTime          @default(now()) @map("created_at")
  updatedAt       DateTime          @updatedAt @map("updated_at")
  publishedAt     DateTime?         @map("published_at")
  
  category        WorkflowCategory  @relation(fields: [categoryId], references: [id])
  author          Author            @relation(fields: [authorId], references: [id])
  config          WorkflowConfig?

  screenshots     WorkflowScreenshot[]
  instructions    WorkflowInstruction[]
  requirements    WorkflowRequirement[]
  userActions     UserAction[]
  
  @@map("workflows")
}

model WorkflowConfig {
  id             Int      @id @default(autoincrement())
  workflowId     String   @unique @map("workflow_id")
  configJson     Json     @map("config_json")
  nodesCount     Int      @map("nodes_count")
  edgesCount     Int      @map("edges_count")
  variablesCount Int      @map("variables_count")
  configVersion  String   @default("1.0") @map("config_version")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  
  workflow       Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  
  @@map("workflow_configs")
}



model WorkflowScreenshot {
  id         Int      @id @default(autoincrement())
  workflowId String   @map("workflow_id")
  imageUrl   String   @map("image_url")
  altText    String?  @map("alt_text")
  sortOrder  Int      @default(0) @map("sort_order")
  createdAt  DateTime @default(now()) @map("created_at")
  
  workflow   Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  
  @@map("workflow_screenshots")
}

model WorkflowInstruction {
  id              Int      @id @default(autoincrement())
  workflowId      String   @map("workflow_id")
  instructionText String   @map("instruction_text")
  sortOrder       Int      @map("sort_order")
  createdAt       DateTime @default(now()) @map("created_at")
  
  workflow        Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  
  @@map("workflow_instructions")
}

model WorkflowRequirement {
  id              Int      @id @default(autoincrement())
  workflowId      String   @map("workflow_id")
  requirementText String   @map("requirement_text")
  sortOrder       Int      @map("sort_order")
  createdAt       DateTime @default(now()) @map("created_at")
  
  workflow        Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  
  @@map("workflow_requirements")
}

model UserAction {
  id         Int        @id @default(autoincrement())
  workflowId String     @map("workflow_id")
  actionType ActionType @map("action_type")
  userIp     String?    @map("user_ip")
  userAgent  String?    @map("user_agent")
  referrer   String?
  createdAt  DateTime   @default(now()) @map("created_at")
  
  workflow   Workflow   @relation(fields: [workflowId], references: [id])
  
  @@map("user_actions")
}

enum Difficulty {
  beginner
  intermediate
  advanced
}

enum ActionType {
  view
  like
  copy
  try
  share
}
```

## 4. 实施计划

### 4.1 第一阶段：基础架构
- [ ] 数据库设计和创建
- [ ] Prisma配置和模型定义
- [ ] 基础API接口开发
- [ ] 数据迁移脚本

### 4.2 第二阶段：核心功能
- [ ] 工作流CRUD接口
- [ ] 分类和标签管理
- [ ] 搜索功能实现
- [ ] 用户行为统计

### 4.3 第三阶段：优化和扩展
- [ ] 缓存策略实施
- [ ] 性能优化
- [ ] 监控和日志
- [ ] 备份策略

### 4.4 第四阶段：高级功能
- [ ] 推荐算法
- [ ] 数据分析仪表板
- [ ] API限流和安全
- [ ] 国际化支持

## 5. 部署和运维

### 5.1 环境配置
```bash
# 环境变量
DATABASE_URL="postgresql://username:password@localhost:5432/fastgpt_workflows"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_API_URL="https://api.fastgpt-workflows.com"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="fastgpt-workflows"
```

### 5.2 数据库迁移
```bash
# 安装依赖
npm install prisma @prisma/client

# 生成Prisma客户端
npx prisma generate

# 运行数据库迁移
npx prisma db push

# 填充初始数据
npx prisma db seed
```

### 5.3 监控指标
- 数据库连接数
- API响应时间
- 错误率
- 缓存命中率
- 存储使用量

## 6. 安全考虑

### 6.1 数据安全
- 敏感数据加密
- SQL注入防护
- XSS防护
- CSRF防护

### 6.2 访问控制
- API密钥管理
- 速率限制
- IP白名单
- 权限验证

### 6.3 数据备份
- 定期数据库备份
- 增量备份策略
- 灾难恢复计划
- 数据恢复测试

## 7. 性能优化

### 7.1 数据库优化
- 索引优化
- 查询优化
- 连接池配置
- 分区策略

### 7.2 缓存策略
- Redis缓存
- CDN配置
- 浏览器缓存
- API响应缓存

### 7.3 扩展性
- 水平扩展
- 读写分离
- 微服务架构
- 负载均衡

---

**文档版本**: v1.0  
**创建日期**: 2024年1月  
**最后更新**: 2024年1月  
**维护者**: FastGPT开发团队
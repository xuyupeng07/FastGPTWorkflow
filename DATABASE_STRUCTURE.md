# FastGPT Workflow 数据库表结构文档

## 概述

FastGPT Workflow 是一个基于 PostgreSQL 的工作流管理系统，包含 4 个核心业务表，用于管理工作流、作者、分类和用户行为数据。

**数据库信息：**
- 数据库类型：PostgreSQL
- 字符编码：UTF-8
- 时区：无时区（timestamp without time zone）
- 生成时间：2025-07-28

## 数据库架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     authors     │    │workflow_categories│    │   workflows     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │◄───┤ id (PK)         │◄───┤ id (PK)         │
│ name            │    │ name            │    │ title           │
│ email (UNIQUE)  │    │ description     │    │ description     │
│ avatar_url      │    │ sort_order      │    │ author_id (FK)  │
│ bio             │    │ is_active       │    │ category_id (FK)│
│ website_url     │    │ created_at      │    │ thumbnail_url   │
│ github_url      │    │ updated_at      │    │ is_published    │
│ is_verified     │    └─────────────────┘    │ is_featured     │
│ created_at      │                           │ like_count      │
│ updated_at      │                           │ usage_count     │
└─────────────────┘                           │ json_source     │
                                              │ created_at      │
                                              │ updated_at      │
                                              │ published_at    │
                                              │ demo_url        │
                                              └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │  user_actions   │
                                              ├─────────────────┤
                                              │ id (PK)         │
                                              │ workflow_id (FK)│
                                              │ action_type     │
                                              │ user_session_id │
                                              │ user_ip         │
                                              │ user_agent      │
                                              │ referrer        │
                                              │ created_at      │
                                              └─────────────────┘
```

## 核心业务表详细说明

### 1. authors（作者表）

**表描述：** 存储工作流作者的基本信息和认证状态

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|----------|------|--------|------|
| id | integer | PRIMARY KEY, NOT NULL | nextval('authors_id_seq') | 作者唯一标识，自增主键 |
| name | varchar(100) | NOT NULL | - | 作者姓名，最大100字符 |
| email | varchar(255) | UNIQUE, NULL | - | 作者邮箱，唯一约束 |
| avatar_url | text | NULL | - | 头像图片URL |
| bio | text | NULL | - | 作者简介 |
| website_url | text | NULL | - | 个人网站URL |
| github_url | text | NULL | - | GitHub主页URL |
| is_verified | boolean | NULL | false | 是否已认证作者 |
| created_at | timestamp | NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | timestamp | NULL | CURRENT_TIMESTAMP | 最后更新时间 |

**索引：**
- `authors_pkey`: 主键索引 (id)
- `authors_email_key`: 唯一索引 (email)

**触发器：**
- `update_authors_updated_at`: 更新时自动设置 updated_at 字段

---

### 2. workflow_categories（工作流分类表）

**表描述：** 管理工作流的分类信息，支持排序和启用/禁用状态

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|----------|------|--------|------|
| id | varchar(50) | PRIMARY KEY, NOT NULL | - | 分类唯一标识，字符串类型 |
| name | varchar(100) | NOT NULL | - | 分类名称，最大100字符 |
| description | text | NULL | - | 分类描述 |
| sort_order | integer | NULL | 0 | 排序顺序，数字越小越靠前 |
| is_active | boolean | NULL | true | 是否启用该分类 |
| created_at | timestamp | NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | timestamp | NULL | CURRENT_TIMESTAMP | 最后更新时间 |

**索引：**
- `workflow_categories_pkey`: 主键索引 (id)

**触发器：**
- `update_workflow_categories_updated_at`: 更新时自动设置 updated_at 字段

---

### 3. workflows（工作流主表）

**表描述：** 系统核心表，存储工作流的完整信息，包括内容、状态、统计数据等

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|----------|------|--------|------|
| id | varchar(50) | PRIMARY KEY, NOT NULL | - | 工作流唯一标识 |
| title | varchar(200) | NOT NULL | - | 工作流标题，最大200字符 |
| description | text | NOT NULL | - | 工作流详细描述 |
| author_id | integer | NOT NULL, FK | - | 作者ID，外键关联 authors.id |
| category_id | varchar(50) | NOT NULL, FK | - | 分类ID，外键关联 workflow_categories.id |
| thumbnail_url | text | NULL | - | 缩略图URL |
| is_published | boolean | NULL | true | 是否已发布 |
| is_featured | boolean | NULL | false | 是否为精选工作流 |
| like_count | integer | NULL | 0 | 点赞数量 |
| usage_count | integer | NULL | 0 | 使用次数 |
| json_source | text | NULL | - | 工作流JSON源码 |
| created_at | timestamp | NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | timestamp | NULL | CURRENT_TIMESTAMP | 最后更新时间 |
| published_at | timestamp | NULL | - | 发布时间 |
| demo_url | text | NULL | - | 演示链接URL |

**外键约束：**
- `workflows_author_id_fkey`: author_id → authors.id
- `workflows_category_id_fkey`: category_id → workflow_categories.id

**索引：**
- `workflows_pkey`: 主键索引 (id)
- `idx_workflows_author`: 作者索引 (author_id)
- `idx_workflows_category`: 分类索引 (category_id)
- `idx_workflows_published`: 发布状态索引 (is_published, published_at)
- `idx_workflows_featured`: 精选状态索引 (is_featured)
- `idx_workflows_created`: 创建时间索引 (created_at DESC)
- `idx_workflows_likes`: 点赞数索引 (like_count DESC)
- `idx_workflows_usage`: 使用次数索引 (usage_count DESC)
- `idx_workflows_search`: 全文搜索索引 (title + description)

**触发器：**
- `update_workflows_updated_at`: 更新时自动设置 updated_at 字段

---

### 4. user_actions（用户行为记录表）

**表描述：** 记录用户对工作流的各种操作行为，用于统计分析和防重复操作

| 字段名 | 数据类型 | 约束 | 默认值 | 说明 |
|--------|----------|------|--------|------|
| id | integer | PRIMARY KEY, NOT NULL | nextval('user_actions_id_seq') | 行为记录唯一标识，自增主键 |
| workflow_id | varchar(50) | NOT NULL, FK | - | 工作流ID，外键关联 workflows.id |
| action_type | varchar(20) | NOT NULL | - | 行为类型（如：like, view, download等） |
| user_session_id | varchar(100) | NULL | - | 用户会话ID |
| user_ip | varchar(45) | NULL | - | 用户IP地址（支持IPv6） |
| user_agent | text | NULL | - | 用户浏览器信息 |
| referrer | text | NULL | - | 来源页面URL |
| created_at | timestamp | NULL | CURRENT_TIMESTAMP | 行为发生时间 |

**外键约束：**
- `user_actions_workflow_id_fkey`: workflow_id → workflows.id

**索引：**
- `user_actions_pkey`: 主键索引 (id)
- `idx_user_actions_workflow`: 工作流行为索引 (workflow_id, action_type)
- `idx_user_actions_session`: 会话索引 (user_session_id)
- `idx_user_actions_ip`: IP地址索引 (user_ip)
- `idx_user_actions_time`: 时间索引 (created_at)
- `idx_user_actions_unique_like`: 防重复点赞唯一索引 (workflow_id, user_session_id, action_type)

**特殊约束：**
- 防重复点赞：同一会话对同一工作流只能点赞一次

## 数据库序列

系统使用以下序列来生成自增ID：

| 序列名 | 起始值 | 增量 | 用途 |
|--------|--------|------|------|
| authors_id_seq | 1 | 1 | 作者表主键生成 |
| user_actions_id_seq | 1 | 1 | 用户行为表主键生成 |
| workflow_instructions_id_seq | 1 | 1 | 工作流说明表主键生成（预留） |
| workflow_screenshots_id_seq | 1 | 1 | 工作流截图表主键生成（预留） |

## 数据库函数和触发器

### 自动更新时间戳函数

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### 触发器列表

| 触发器名 | 表名 | 触发时机 | 功能 |
|----------|------|----------|------|
| update_authors_updated_at | authors | BEFORE UPDATE | 自动更新 updated_at 字段 |
| update_workflow_categories_updated_at | workflow_categories | BEFORE UPDATE | 自动更新 updated_at 字段 |
| update_workflows_updated_at | workflows | BEFORE UPDATE | 自动更新 updated_at 字段 |

## 性能优化策略

### 1. 索引策略
- **主键索引**：所有表都有主键索引，确保快速定位
- **外键索引**：为所有外键字段创建索引，优化关联查询
- **业务索引**：为常用查询字段创建索引（如发布状态、创建时间等）
- **全文搜索索引**：使用 GIN 索引支持工作流标题和描述的全文搜索
- **复合索引**：为多字段查询创建复合索引

### 2. 查询优化
- **分页查询**：使用 LIMIT 和 OFFSET 进行分页
- **条件过滤**：利用索引进行高效的条件过滤
- **排序优化**：为常用排序字段创建降序索引

### 3. 数据完整性
- **外键约束**：确保数据引用完整性
- **唯一约束**：防止重复数据
- **检查约束**：通过应用层和数据库层双重验证

## 业务逻辑说明

### 1. 工作流发布流程
1. 创建工作流时 `is_published = true`（默认发布）
2. 发布时设置 `published_at` 时间戳
3. 只有已发布的工作流才会在前端展示

### 2. 用户行为统计
1. 每次用户操作都会记录到 `user_actions` 表
2. 通过 `action_type` 区分不同行为类型
3. 使用会话ID防止重复点赞
4. 定期统计更新 `workflows` 表的计数字段

### 3. 分类管理
1. 支持分类的启用/禁用状态
2. 通过 `sort_order` 控制分类显示顺序
3. 分类与工作流是一对多关系

### 4. 作者认证
1. 通过 `is_verified` 字段标识认证状态
2. 认证作者的工作流可能获得更高权重
3. 支持多种社交链接（网站、GitHub等）

## 数据备份和恢复

### 备份策略
- **全量备份**：每日进行完整数据库备份
- **增量备份**：每小时备份变更数据
- **结构备份**：单独备份表结构定义

### 恢复流程
1. 结构恢复：先恢复表结构和约束
2. 数据恢复：按依赖关系顺序恢复数据
3. 索引重建：恢复完成后重建索引
4. 验证检查：确保数据完整性

## 扩展性考虑

### 预留表结构
- `workflow_instructions`：工作流说明步骤表（已预留序列）
- `workflow_screenshots`：工作流截图表（已预留序列）
- `category_stats`：分类统计表（性能优化用）
- `workflow_details`：工作流详情视图表（性能优化用）

### 水平扩展
- 可按 `category_id` 进行分表
- 可按时间范围对 `user_actions` 进行分区
- 支持读写分离架构

### 垂直扩展
- 大文本字段（如 `json_source`）可考虑分离存储
- 图片资源使用CDN存储
- 缓存热点数据减少数据库压力

## 维护建议

### 定期维护任务
1. **统计信息更新**：定期更新表统计信息
2. **索引维护**：重建碎片化严重的索引
3. **数据清理**：清理过期的用户行为数据
4. **性能监控**：监控慢查询和资源使用情况

### 监控指标
- 表大小和增长趋势
- 索引使用率和效率
- 查询响应时间
- 并发连接数
- 锁等待情况

---

**文档版本：** 1.0  
**最后更新：** 2025-07-28  
**维护者：** FastGPT Workflow 开发团队
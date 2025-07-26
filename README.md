# FastGPT 工作流案例分享平台

一个现代化的 FastGPT 工作流案例分享平台，让用户能够快速浏览、体验和获取各种 FastGPT 工作流模板。

## ✨ 核心特性

- 🚀 **免登录体验** - 无需注册即可体验所有工作流
- 📚 **丰富模板库** - 涵盖客服、写作、分析等多个领域
- 💾 **一键复制** - 快速复制工作流 JSON 配置
- 🎯 **智能分类** - 按用途、难度等维度筛选
- 📱 **响应式设计** - 完美适配各种设备
- 🔍 **实时搜索** - 快速找到需要的工作流

## 🛠️ 技术栈

- **前端**: Next.js 14 + TypeScript
- **样式**: Tailwind CSS + shadcn/ui
- **后端**: Express.js + PostgreSQL
- **图标**: Lucide React
- **部署**: Vercel

## 🚀 快速开始

### 环境要求

- Node.js 16.0+
- PostgreSQL 12+
- pnpm (推荐) 或 npm

### 安装和运行

1. **克隆项目**
```bash
git clone <repository-url>
cd FastGPTWorkflow
```

2. **安装依赖**
```bash
pnpm install
```

3. **初始化数据库**
```bash
# 创建数据库表结构
node database/setup.js

# 导入示例数据
node database/migrate-data.js
```

4. **启动服务**
```bash
# 同时启动前端和后端
pnpm run dev:full

# 或者分别启动
pnpm run dev      # 前端 (http://localhost:3000)
pnpm run dev:api  # 后端 (http://localhost:3001)
```

## 📋 主要功能

### 🏠 首页
- 工作流卡片网格展示
- 分类筛选和搜索
- 热门工作流推荐
- 统计信息展示

### 📄 工作流详情
- 完整的工作流信息
- JSON 配置查看和复制
- 在线体验链接
- 使用说明和要求

### 🔧 管理后台
- 工作流管理 (CRUD)
- 分类管理
- 用户行为统计
- 数据导入导出

## 📁 项目结构

```
FastGPTWorkflow/
├── src/
│   ├── app/                 # Next.js 页面
│   ├── components/          # React 组件
│   ├── hooks/              # 自定义 Hooks
│   └── lib/                # 工具库和类型定义
├── api/                    # Express.js 后端
├── database/               # 数据库脚本
├── public/                 # 静态资源
└── package.json
```

## 🔧 开发脚本

```bash
# 开发
pnpm run dev          # 启动前端开发服务器
pnpm run dev:api      # 启动后端 API 服务器
pnpm run dev:full     # 同时启动前后端

# 构建
pnpm run build        # 构建前端应用
pnpm run start        # 启动生产环境前端
pnpm run start:full   # 启动生产环境前后端

# 数据库
node database/setup.js           # 初始化数据库
node database/migrate-data.js    # 导入示例数据

# 测试
node test-db.js       # 测试数据库连接
node test-api.js      # 测试 API 接口
```

## 🌐 访问地址

- **前端应用**: http://localhost:3000
- **后端 API**: http://localhost:3001
- **管理后台**: http://localhost:3000/admin

## 📝 API 接口

- `GET /api/workflows` - 获取工作流列表
- `GET /api/workflows/:id` - 获取工作流详情
- `GET /api/categories` - 获取分类列表
- `POST /api/workflows/:id/actions` - 记录用户行为
- `GET /api/stats` - 获取统计信息

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙋‍♂️ 支持

如有问题或建议，请提交 [Issue](https://github.com/your-repo/issues)

        
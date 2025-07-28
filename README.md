# FastGPT 工作流案例分享平台

一个现代化的 FastGPT 工作流案例分享平台，让用户能够快速浏览、体验和获取各种 FastGPT 工作流模板。

## 🌟 在线演示

- **演示地址**: [https://fastgpt-workflow.vercel.app](https://fastgpt-workflow.vercel.app)
- **管理后台**: [https://fastgpt-workflow.vercel.app/admin](https://fastgpt-workflow.vercel.app/admin)

> 💡 无需注册即可体验所有功能！

## ✨ 核心特性

- 🚀 **免登录体验** - 无需注册即可体验所有工作流
- 📚 **丰富模板库** - 涵盖客服、写作、分析等多个领域
- 💾 **一键复制** - 快速复制工作流 JSON 配置
- 🎯 **智能分类** - 按用途、难度等维度筛选
- 📱 **响应式设计** - 完美适配各种设备
- 🔍 **实时搜索** - 快速找到需要的工作流

## 🛠️ 技术栈

- **前端**: Next.js 15 + React 19 + TypeScript
- **样式**: Tailwind CSS 4.0 + shadcn/ui
- **数据库**: PostgreSQL
- **状态管理**: Zustand + SWR
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

3. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local 文件，配置数据库连接
# DATABASE_URL=postgresql://username:password@host:port/database
```

4. **启动开发服务器**
```bash
pnpm run dev      # 启动开发服务器 (http://localhost:3000)
```

> 注意：项目使用 Next.js API Routes，无需单独启动后端服务器

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
│   ├── app/                 # Next.js 13+ App Router
│   │   ├── api/            # API Routes
│   │   ├── admin/          # 管理后台页面
│   │   └── workflow/       # 工作流详情页面
│   ├── components/          # React 组件
│   │   ├── ui/             # shadcn/ui 基础组件
│   │   └── *.tsx           # 业务组件
│   ├── contexts/           # React Context
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库和类型定义
│   └── styles/             # 样式文件
├── public/                 # 静态资源
│   └── uploads/            # 上传的文件
└── package.json
```

## 🔧 开发脚本

```bash
# 开发
pnpm run dev          # 启动开发服务器 (http://localhost:3000)

# 构建
pnpm run build        # 构建生产版本
pnpm run start        # 启动生产服务器

# 代码质量
pnpm run lint         # ESLint 代码检查
```

## 🌐 访问地址

- **主应用**: http://localhost:3000
- **管理后台**: http://localhost:3000/admin
- **API 接口**: http://localhost:3000/api/*

## 📝 API 接口

### 工作流相关
- `GET /api/workflows` - 获取工作流列表
  - 查询参数: `limit`, `category`, `author`, `search`
- `GET /api/workflows/[id]` - 获取工作流详情
- `POST /api/workflows` - 创建新工作流 (需要管理员权限)
- `PUT /api/workflows/[id]` - 更新工作流 (需要管理员权限)
- `DELETE /api/workflows/[id]` - 删除工作流 (需要管理员权限)

### 分类和作者
- `GET /api/categories` - 获取分类列表
- `GET /api/authors` - 获取作者列表

### 统计和行为
- `POST /api/workflows/[id]/actions` - 记录用户行为
- `GET /api/stats` - 获取统计信息 (需要管理员权限)

## 🎯 使用指南

### 普通用户
1. 访问首页浏览工作流
2. 使用搜索和筛选功能找到需要的工作流
3. 点击工作流卡片查看详情
4. 复制 JSON 配置到你的 FastGPT 实例
5. 点击体验链接在线试用

### 管理员
1. 访问 `/admin` 页面
2. 添加、编辑或删除工作流
3. 管理分类和标签
4. 查看使用统计

## 🤝 贡献指南

欢迎贡献工作流案例和代码改进！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 贡献工作流
- 确保工作流配置完整且可用
- 提供清晰的描述和使用说明
- 添加合适的分类和标签
- 如有可能，提供在线体验链接

## 🚀 部署指南

### Vercel 部署 (推荐)

1. Fork 本项目到你的 GitHub
2. 在 [Vercel](https://vercel.com) 中导入项目
3. 配置环境变量:
   - `DATABASE_URL`: PostgreSQL 数据库连接字符串
4. 点击部署即可

### 自托管部署

```bash
# 构建项目
pnpm run build

# 启动生产服务器
pnpm run start
```

## ❓ 常见问题

### Q: 如何添加新的工作流？
A: 访问 `/admin` 页面，使用管理员功能添加工作流。或者通过 API 接口 `POST /api/workflows` 添加。

### Q: 工作流 JSON 格式要求？
A: 请确保 JSON 格式符合 FastGPT 的工作流配置标准，包含完整的节点和连接信息。

### Q: 如何配置数据库？
A: 项目支持 PostgreSQL 数据库，在 `.env.local` 中配置 `DATABASE_URL` 即可。

### Q: 支持哪些文件上传格式？
A: 支持常见的图片格式 (PNG, JPG, SVG) 作为工作流缩略图。

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙋‍♂️ 支持

- 📧 问题反馈: [提交 Issue](https://github.com/your-repo/issues)
- 💬 讨论交流: [GitHub Discussions](https://github.com/your-repo/discussions)
- 📖 文档: [项目 Wiki](https://github.com/your-repo/wiki)

---

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！

        
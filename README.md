# FastGPT工作流分享平台

一个现代化的FastGPT工作流案例分享平台，让用户能够快速体验、学习和复用各种AI工作流模板。

## 🌟 项目特色

- **🚀 免登录体验** - 无需注册即可体验所有工作流
- **📚 丰富的模板库** - 涵盖客服、教育、营销等多个领域
- **💻 一键复制配置** - 快速获取工作流JSON配置
- **🔍 智能搜索** - 支持标题、描述、标签的模糊搜索
- **📱 响应式设计** - 完美适配桌面端和移动端
- **⚡ 实时数据** - 动态加载，实时统计

## 🏗️ 技术架构

### 前端技术栈
- **框架**: Next.js 15.4.3 (App Router)
- **样式**: Tailwind CSS + shadcn/ui
- **状态管理**: Zustand + SWR
- **动画**: Framer Motion
- **图标**: Lucide React
- **代码高亮**: Prism.js
- **语言**: TypeScript

### 后端技术栈
- **API服务**: Express.js
- **数据库**: PostgreSQL
- **ORM**: 原生SQL查询
- **文件上传**: Multer
- **跨域**: CORS

### 系统架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端Web应用    │────│   后端API服务   │────│  PostgreSQL     │
│   (Next.js)     │    │   (Express.js)  │    │   数据库        │
│   Port: 3000    │    │   Port: 3001    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 快速开始

### 环境要求

- Node.js 16.0+
- npm 或 yarn
- PostgreSQL 12+

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd FastGPTWorkflow/fastgpt-workflow-share
```

2. **安装依赖**
```bash
npm install
```

3. **配置数据库**
```bash
# 初始化数据库表结构
npm run setup:db

# 迁移示例数据
npm run migrate:data
```

4. **启动服务**
```bash
# 同时启动前端和后端
npm run dev:full

# 或者分别启动
npm run dev:api  # 启动API服务 (端口3001)
npm run dev      # 启动前端应用 (端口3000)
```

5. **访问应用**
- 前端应用: http://localhost:3000
- API服务: http://localhost:3001
- 健康检查: http://localhost:3001/health

## 📁 项目结构

```
fastgpt-workflow-share/
├── 📄 README.md                    # 项目说明文档
├── 📄 API_DOCUMENTATION.md         # API接口文档
├── 📄 DATABASE_DESIGN.md           # 数据库设计文档
├── 📄 DEPLOYMENT_GUIDE.md          # 部署指南
├── 📄 FRONTEND_INTEGRATION.md      # 前端集成文档
├── 📦 package.json                 # 项目依赖配置
├── ⚙️ next.config.ts               # Next.js配置
├── ⚙️ tailwind.config.js           # Tailwind CSS配置
├── ⚙️ tsconfig.json                # TypeScript配置
│
├── 🗂️ src/                         # 前端源代码
│   ├── 📱 app/                     # Next.js应用路由
│   │   ├── 🏠 page.tsx             # 主页
│   │   ├── 📋 workflow/[id]/       # 工作流详情页
│   │   └── 🚫 not-found.tsx        # 404页面
│   ├── 🧩 components/              # React组件
│   │   ├── 🎯 Header.tsx           # 导航组件
│   │   ├── 📊 WorkflowGrid.tsx     # 工作流网格
│   │   ├── 🎴 WorkflowCard.tsx     # 工作流卡片
│   │   └── 🎨 ui/                  # UI基础组件
│   ├── 🪝 hooks/                   # 自定义Hooks
│   │   └── 🔌 useApi.ts            # API数据Hooks
│   └── 📚 lib/                     # 工具库
│       ├── 🌐 api.ts               # API客户端
│       ├── 📝 types.ts             # 类型定义
│       └── 💾 data.ts              # 静态数据
│
├── 🗂️ api/                         # 后端API服务
│   ├── 🚀 server.js                # Express服务器
│   └── 📁 public/                  # 静态文件
│
├── 🗂️ database/                    # 数据库相关
│   ├── 🏗️ setup.js                 # 数据库初始化
│   ├── 📊 init.sql                 # 数据库结构
│   └── 🔄 migrate-data.js          # 数据迁移
│
└── 🗂️ public/                      # 静态资源
    ├── 🖼️ thumbnails/              # 工作流缩略图
    ├── 📸 screenshots/             # 工作流截图
    └── 🎨 icons/                   # 图标文件
```

## 🎯 核心功能

### 🏠 主页功能
- **工作流展示**: 卡片式网格布局展示所有工作流
- **分类筛选**: 按客服、教育、营销等分类筛选
- **搜索功能**: 实时搜索工作流标题、描述和标签
- **排序功能**: 按热门度、使用量、最新时间排序
- **分页加载**: 支持大数据量的分页展示

### 📋 工作流详情
- **详细信息**: 完整的工作流描述和使用说明
- **配置预览**: JSON配置的语法高亮显示
- **一键复制**: 复制工作流配置到剪贴板
- **在线体验**: 免登录体验工作流功能
- **使用统计**: 实时显示查看、点赞、使用次数

### 👤 用户交互
- **行为记录**: 自动记录用户的查看、点赞、复制等行为
- **实时反馈**: 操作后的即时状态更新
- **友好提示**: 清晰的成功和错误提示信息

## 🔧 开发指南

### 可用脚本

```bash
# 开发环境
npm run dev              # 启动前端开发服务器
npm run dev:api          # 启动后端API服务器
npm run dev:full         # 同时启动前后端服务

# 生产环境
npm run build            # 构建前端应用
npm run start            # 启动前端生产服务器
npm run start:api        # 启动后端生产服务器
npm run start:full       # 同时启动前后端生产服务

# 数据库管理
npm run setup:db         # 初始化数据库
npm run migrate:data     # 迁移示例数据

# 测试和验证
npm run test:db          # 测试数据库连接
npm run test:api         # 测试API接口
node test-integration.js # 完整集成测试

# 代码质量
npm run lint             # ESLint代码检查
```

### 环境变量配置

创建 `.env.local` 文件：

```bash
# API服务配置
NEXT_PUBLIC_API_URL=http://localhost:3001

# 数据库配置（生产环境需要修改）
DATABASE_URL=postgresql://postgres:bzncrmdw@dbconn.sealoshzh.site:48900/?directConnection=true

# 应用配置
NEXT_PUBLIC_APP_NAME=FastGPT工作流分享平台
NODE_ENV=development
```

### 添加新工作流

1. **准备数据**: 在 `database/migrate-data.js` 中添加新的工作流数据
2. **运行迁移**: `npm run migrate:data`
3. **重启服务**: 重启API服务以加载新数据

### 自定义组件

项目使用 shadcn/ui 组件库，可以轻松添加新组件：

```bash
# 添加新的UI组件
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

## 📊 API接口

### 主要接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/categories` | GET | 获取所有分类 |
| `/api/workflows` | GET | 获取工作流列表 |
| `/api/workflows/:id` | GET | 获取工作流详情 |
| `/api/tags` | GET | 获取所有标签 |
| `/api/stats` | GET | 获取统计信息 |
| `/api/workflows/:id/actions` | POST | 记录用户行为 |

### 请求示例

```javascript
// 获取工作流列表
fetch('/api/workflows?category=customer-service&page=1&limit=10')
  .then(response => response.json())
  .then(data => console.log(data));

// 记录用户行为
fetch('/api/workflows/demo-id/actions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action_type: 'like' })
});
```

详细的API文档请参考 [API_DOCUMENTATION.md](./fastgpt-workflow-share/API_DOCUMENTATION.md)

## 🗄️ 数据库设计

### 核心数据表

- **workflows**: 工作流主表
- **workflow_categories**: 分类表
- **workflow_tags**: 标签表
- **workflow_configs**: 配置表
- **user_actions**: 用户行为表
- **authors**: 作者表

### 数据关系

```
workflows (1) ←→ (1) workflow_configs
workflows (N) ←→ (1) workflow_categories
workflows (N) ←→ (M) workflow_tags
workflows (N) ←→ (1) authors
workflows (1) ←→ (N) user_actions
```

详细的数据库设计请参考 [DATABASE_DESIGN.md](./fastgpt-workflow-share/DATABASE_DESIGN.md)

## 🚀 部署指南

### 开发环境部署

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库
npm run setup:db
npm run migrate:data

# 3. 启动服务
npm run dev:full
```

### 生产环境部署

```bash
# 1. 构建应用
npm run build

# 2. 启动生产服务
npm run start:full
```

### Docker部署

```bash
# 构建镜像
docker build -t fastgpt-workflow .

# 运行容器
docker run -p 3000:3000 -p 3001:3001 fastgpt-workflow
```

### 使用PM2部署

```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start ecosystem.config.js
```

详细的部署指南请参考 [DEPLOYMENT_GUIDE.md](./fastgpt-workflow-share/DEPLOYMENT_GUIDE.md)

## 🔧 故障排除

### 常见问题

**Q: 数据库连接失败**
A: 检查数据库连接字符串和网络连接，确认PostgreSQL服务正在运行

**Q: API服务启动失败**
A: 检查端口3001是否被占用，查看错误日志确认具体问题

**Q: 前端无法访问API**
A: 确认API服务正在运行，检查CORS配置和环境变量

**Q: 工作流数据为空**
A: 运行数据迁移脚本：`npm run migrate:data`

### 调试命令

```bash
# 检查服务状态
curl http://localhost:3001/health

# 测试数据库连接
npm run test:db

# 测试API接口
npm run test:api

# 检查端口占用
lsof -i :3000
lsof -i :3001
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 贡献方式

1. **报告问题**: 在Issues中报告bug或提出功能建议
2. **提交代码**: Fork项目，创建分支，提交Pull Request
3. **完善文档**: 改进文档和示例
4. **分享工作流**: 贡献新的工作流模板

### 开发流程

1. Fork项目到你的GitHub账号
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 创建Pull Request

### 代码规范

- 使用TypeScript进行类型检查
- 遵循ESLint代码规范
- 编写清晰的注释和文档
- 保持代码简洁和可读性

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [FastGPT](https://github.com/labring/FastGPT) - 强大的AI工作流平台
- [Next.js](https://nextjs.org/) - React全栈框架
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的CSS框架
- [shadcn/ui](https://ui.shadcn.com/) - 精美的React组件库
- [Lucide](https://lucide.dev/) - 优雅的图标库

## 📞 联系我们

- 项目主页: [GitHub Repository](https://github.com/your-username/fastgpt-workflow)
- 问题反馈: [GitHub Issues](https://github.com/your-username/fastgpt-workflow/issues)
- 功能建议: [GitHub Discussions](https://github.com/your-username/fastgpt-workflow/discussions)

---

**⭐ 如果这个项目对你有帮助，请给我们一个Star！**

**🚀 让我们一起构建更好的AI工作流生态系统！**

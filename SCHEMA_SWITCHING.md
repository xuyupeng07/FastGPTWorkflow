# 数据库Schema快速切换指南

本文档介绍如何在FastGPTWorkflow项目中快速切换不同的PostgreSQL数据库schema。

## 🎯 功能概述

通过环境变量配置，您可以轻松地在不同的数据库schema之间切换，无需修改代码。这对于以下场景非常有用：

- 开发环境与生产环境使用不同schema
- 测试新功能时使用独立的schema
- 数据迁移和备份场景
- 多租户应用的schema隔离

## 📋 环境变量配置

在`.env.local`文件中配置以下环境变量：

```bash
# 主要使用的schema
DB_SCHEMA=publiccopy

# 备用schema（当主schema中找不到表时会查找此schema）
DB_FALLBACK_SCHEMA=public
```

### 配置说明

- **DB_SCHEMA**: 主要使用的schema名称（默认: `publiccopy`）
- **DB_FALLBACK_SCHEMA**: 备用schema名称（默认: `public`）

## 🔄 快速切换方法

### 方法1: 使用切换脚本（推荐）

我们提供了一个便捷的切换脚本：

```bash
# 查看帮助
node switch_schema.js help

# 切换到public schema
node switch_schema.js public

# 切换到publiccopy schema
node switch_schema.js publiccopy

# 切换到自定义schema
node switch_schema.js custom your_schema_name
```

### 方法2: 手动修改环境变量

直接编辑`.env.local`文件：

```bash
# 使用public schema
DB_SCHEMA=public
DB_FALLBACK_SCHEMA=

# 使用publiccopy schema
DB_SCHEMA=publiccopy
DB_FALLBACK_SCHEMA=public

# 使用自定义schema
DB_SCHEMA=my_custom_schema
DB_FALLBACK_SCHEMA=public
```

## 🚀 应用配置更改

修改schema配置后，需要重启应用程序：

```bash
# 停止当前运行的服务器（Ctrl+C）
# 然后重新启动
npm run dev
```

启动时会看到类似的日志信息：

```
✅ 数据库连接池创建成功
✅ 已设置数据库schema为: publiccopy, public
📋 当前schema配置: DB_SCHEMA=publiccopy, FALLBACK_SCHEMA=public
```

## 📊 Schema工作原理

### Search Path机制

PostgreSQL使用`search_path`来确定查找表的顺序：

1. 首先在`DB_SCHEMA`指定的schema中查找
2. 如果找不到，则在`DB_FALLBACK_SCHEMA`中查找
3. 这样可以实现平滑的schema切换和向后兼容

### 示例场景

假设配置为：
```bash
DB_SCHEMA=publiccopy
DB_FALLBACK_SCHEMA=public
```

当执行SQL查询`SELECT * FROM workflows`时：
1. 首先查找`publiccopy.workflows`
2. 如果不存在，则查找`public.workflows`

## 🛠️ Schema管理

### 创建新Schema

如果需要创建新的schema，可以使用以下SQL：

```sql
-- 创建新schema
CREATE SCHEMA your_new_schema;

-- 复制现有schema的结构和数据
CREATE SCHEMA your_new_schema;
-- 然后使用我们提供的copy_schema.js脚本
```

### 使用现有的复制脚本

项目中包含了`setup_publiccopy_schema.js`脚本，可以参考其实现来创建新的schema复制脚本。

## 🔍 故障排除

### 常见问题

1. **Schema不存在错误**
   ```
   ERROR: schema "your_schema" does not exist
   ```
   解决方案：确保目标schema已在数据库中创建

2. **表不存在错误**
   ```
   ERROR: relation "table_name" does not exist
   ```
   解决方案：检查目标schema中是否包含所需的表

3. **权限错误**
   ```
   ERROR: permission denied for schema
   ```
   解决方案：确保数据库用户有访问目标schema的权限

### 调试技巧

1. **查看当前search_path**
   ```sql
   SHOW search_path;
   ```

2. **列出所有schema**
   ```sql
   SELECT schema_name FROM information_schema.schemata;
   ```

3. **查看schema中的表**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'your_schema_name';
   ```

## 📝 最佳实践

1. **开发环境**: 使用独立的schema进行开发和测试
2. **生产环境**: 使用稳定的schema，并设置合适的备用schema
3. **数据迁移**: 先在新schema中测试，确认无误后再切换
4. **备份策略**: 定期备份重要schema的数据
5. **权限管理**: 为不同环境设置适当的数据库权限

## 🔗 相关文件

- `src/lib/db.ts` - 数据库连接和schema配置
- `.env.example` - 环境变量模板
- `switch_schema.js` - Schema切换脚本
- `setup_publiccopy_schema.js` - Schema复制脚本

---

如有问题，请查看应用程序启动日志或联系开发团队。
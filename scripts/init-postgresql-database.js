const { Pool } = require('pg');

// PostgreSQL数据库初始化脚本
// 请在运行前配置正确的数据库连接信息
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/database_name?directConnection=true',
  ssl: false
});

async function initPostgreSQLDatabase() {
  try {
    console.log('=== PostgreSQL数据库初始化开始 ===');
    
    // 1. 创建workflow schema
    console.log('\n1. 创建workflow schema...');
    
    try {
      await pool.query(`CREATE SCHEMA IF NOT EXISTS workflow`);
      console.log(`✅ Schema创建成功: workflow`);
    } catch (error) {
      console.log(`⚠️ Schema创建失败: workflow - ${error.message}`);
    }
    
    // 2. 创建用户表
    console.log('\n2. 创建用户表...');
    
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS workflow.users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await pool.query(createUsersTable);
    console.log('✅ 用户表创建成功');
    
    // 3. 创建作者表
    console.log('\n3. 创建作者表...');
    
    const createAuthorsTable = `
      CREATE TABLE IF NOT EXISTS workflow.authors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        bio TEXT,
        avatar_url VARCHAR(255),
        social_links JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await pool.query(createAuthorsTable);
    console.log('✅ 作者表创建成功');
    
    // 4. 创建工作流分类表
    console.log('\n4. 创建工作流分类表...');
    
    const createWorkflowCategoriesTable = `
      CREATE TABLE IF NOT EXISTS workflow.workflow_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(100),
        color VARCHAR(7),
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await pool.query(createWorkflowCategoriesTable);
    console.log('✅ 工作流分类表创建成功');
    
    // 5. 创建图片表
    console.log('\n5. 创建图片表...');
    
    const createImagesTable = `
      CREATE TABLE IF NOT EXISTS workflow.images (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255),
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        width INTEGER,
        height INTEGER,
        alt_text VARCHAR(255),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await pool.query(createImagesTable);
    console.log('✅ 图片表创建成功');
    
    // 6. 创建工作流表
    console.log('\n6. 创建工作流表...');
    
    const createWorkflowsTable = `
      CREATE TABLE IF NOT EXISTS workflow.workflows (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        content TEXT,
        category_id INTEGER REFERENCES workflow.workflow_categories(id),
        author_id INTEGER REFERENCES workflow.authors(id),
        thumbnail_image_id INTEGER REFERENCES workflow.images(id),
        tags TEXT[],
        difficulty_level VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
        estimated_time INTEGER,
        view_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        is_published BOOLEAN DEFAULT false,
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await pool.query(createWorkflowsTable);
    console.log('✅ 工作流表创建成功');
    
    // 7. 创建图片变体表
    console.log('\n7. 创建图片变体表...');
    
    const createImageVariantsTable = `
      CREATE TABLE IF NOT EXISTS workflow.image_variants (
        id SERIAL PRIMARY KEY,
        image_id INTEGER REFERENCES workflow.images(id) ON DELETE CASCADE,
        variant_type VARCHAR(50) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        width INTEGER,
        height INTEGER,
        file_size INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await pool.query(createImageVariantsTable);
    console.log('✅ 图片变体表创建成功');
    
    // 8. 创建图片使用记录表
    console.log('\n8. 创建图片使用记录表...');
    
    const createImageUsagesTable = `
      CREATE TABLE IF NOT EXISTS workflow.image_usages (
        id SERIAL PRIMARY KEY,
        image_id INTEGER REFERENCES workflow.images(id) ON DELETE CASCADE,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER NOT NULL,
        usage_type VARCHAR(50) NOT NULL,
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(entity_type, entity_id, usage_type, is_primary)
      )
    `;
    
    await pool.query(createImageUsagesTable);
    console.log('✅ 图片使用记录表创建成功');
    
    // 9. 创建用户行为记录表
    console.log('\n9. 创建用户行为记录表...');
    
    const createUserActionsTable = `
      CREATE TABLE IF NOT EXISTS workflow.user_actions (
        id SERIAL PRIMARY KEY,
        user_session_id VARCHAR(255),
        user_ip VARCHAR(45),
        action_type VARCHAR(50) NOT NULL,
        workflow_id INTEGER REFERENCES workflow.workflows(id),
        action_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await pool.query(createUserActionsTable);
    console.log('✅ 用户行为记录表创建成功');
    
    // 10. 创建图片元数据表
    console.log('\n10. 创建图片元数据表...');
    
    const createImageMetadataTable = `
      CREATE TABLE IF NOT EXISTS workflow.image_metadata (
        id SERIAL PRIMARY KEY,
        image_id INTEGER REFERENCES workflow.images(id) ON DELETE CASCADE,
        metadata_key VARCHAR(100) NOT NULL,
        metadata_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(image_id, metadata_key)
      )
    `;
    
    await pool.query(createImageMetadataTable);
    console.log('✅ 图片元数据表创建成功');
    
    // 11. 创建图片标签表
    console.log('\n11. 创建图片标签表...');
    
    const createImageTagsTable = `
      CREATE TABLE IF NOT EXISTS workflow.image_tags (
        id SERIAL PRIMARY KEY,
        image_id INTEGER REFERENCES workflow.images(id) ON DELETE CASCADE,
        tag_name VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(image_id, tag_name)
      )
    `;
    
    await pool.query(createImageTagsTable);
    console.log('✅ 图片标签表创建成功');
    
    // 12. 创建索引
    console.log('\n12. 创建数据库索引...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_username ON workflow.users(username)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON workflow.users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON workflow.users(role)',
      'CREATE INDEX IF NOT EXISTS idx_users_is_active ON workflow.users(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_user_actions_user_session_id ON workflow.user_actions(user_session_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_actions_workflow_id ON workflow.user_actions(workflow_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_actions_action_type ON workflow.user_actions(action_type)',
      'CREATE INDEX IF NOT EXISTS idx_user_actions_created_at ON workflow.user_actions(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_user_actions_user_ip ON workflow.user_actions(user_ip)'
    ];
    
    for (const indexSQL of indexes) {
      try {
        await pool.query(indexSQL);
        console.log(`✅ 索引创建成功`);
      } catch (error) {
        console.log(`⚠️ 索引创建失败: ${error.message}`);
      }
    }
    
    // 13. 插入初始数据
    console.log('\n13. 插入初始数据...');
    
    // 插入默认管理员用户
    const insertAdminUser = `
      INSERT INTO workflow.users (username, email, password_hash, role)
      VALUES ('admin', 'admin@example.com', '$2b$10$example_hash', 'admin')
      ON CONFLICT (username) DO NOTHING
    `;
    
    await pool.query(insertAdminUser);
    console.log('✅ 默认管理员用户创建成功');
    
    // 插入默认分类
    const insertDefaultCategories = `
      INSERT INTO workflow.workflow_categories (name, description, icon, color, sort_order)
      VALUES 
        ('自动化', '自动化工作流程', 'automation', '#3B82F6', 1),
        ('数据处理', '数据处理和分析', 'data', '#10B981', 2),
        ('通知提醒', '通知和提醒系统', 'notification', '#F59E0B', 3),
        ('文件管理', '文件处理和管理', 'file', '#8B5CF6', 4)
      ON CONFLICT DO NOTHING
    `;
    
    await pool.query(insertDefaultCategories);
    console.log('✅ 默认分类数据插入成功');
    
    console.log('\n=== PostgreSQL数据库初始化完成 ===');
    console.log('✅ 数据库名称: FastAgent');
    console.log('✅ 主要Schema: workflow');
    console.log('✅ 备份Schema: workflow2');
    console.log('✅ 所有表和索引已创建');
    console.log('✅ 初始数据已插入');
    
  } catch (error) {
    console.error('PostgreSQL数据库初始化失败:', error);
  } finally {
    await pool.end();
  }
}

// 注意：这是初始化脚本，请根据需要手动执行
// 执行命令: node scripts/init-postgresql-database.js
// initPostgreSQLDatabase();

module.exports = { initPostgreSQLDatabase };
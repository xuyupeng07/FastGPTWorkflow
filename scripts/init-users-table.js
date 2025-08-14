const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// 数据库连接配置
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/database_name?directConnection=true';
const DB_SCHEMA = process.env.DB_SCHEMA || 'workflow';
const FALLBACK_SCHEMA = process.env.DB_FALLBACK_SCHEMA || 'public';

// 构建search_path
const getSearchPath = () => {
  if (DB_SCHEMA === 'public') {
    return 'public';
  }
  return `${DB_SCHEMA}, ${FALLBACK_SCHEMA}`;
};

// 创建数据库连接
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: false,
});

async function initUsersTable() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 开始初始化用户表...');
    
    // 设置schema
    const searchPath = getSearchPath();
    await client.query(`SET search_path TO ${searchPath}`);
    console.log(`✅ 已设置数据库schema为: ${searchPath}`);
    
    // 创建用户表
    const createUsersTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE,
        login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP WITH TIME ZONE
      );
    `;
    
    await client.query(createUsersTableSQL);
    console.log('✅ 用户表创建成功');
    
    // 创建索引
    const createIndexesSQL = [
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);',
      'CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);'
    ];
    
    for (const sql of createIndexesSQL) {
      await client.query(sql);
    }
    console.log('✅ 索引创建成功');
    
    // 创建更新时间触发器函数
    const createTriggerFunctionSQL = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;
    
    await client.query(createTriggerFunctionSQL);
    console.log('✅ 触发器函数创建成功');
    
    // 创建触发器
    const createTriggerSQL = `
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;
    
    await client.query(createTriggerSQL);
    console.log('✅ 触发器创建成功');
    
    // 检查是否已存在管理员用户
    const checkAdminResult = await client.query(
      'SELECT id FROM users WHERE username = $1 OR role = $2',
      ['admin', 'admin']
    );
    
    if (checkAdminResult.rows.length === 0) {
      // 创建默认管理员用户
      const defaultPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
      
      const insertAdminSQL = `
        INSERT INTO users (username, email, password_hash, role, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, username, role;
      `;
      
      const adminResult = await client.query(insertAdminSQL, [
        'admin',
        'admin@fastgpt.cn',
        hashedPassword,
        'admin',
        true
      ]);
      
      console.log('✅ 默认管理员用户创建成功:', adminResult.rows[0]);
      console.log(`📋 管理员账户信息:`);
      console.log(`   用户名: admin`);
      console.log(`   密码: ${defaultPassword}`);
      console.log(`   邮箱: admin@fastgpt.cn`);
    } else {
      console.log('ℹ️  管理员用户已存在，跳过创建');
    }
    
    // 创建用户会话表（可选，用于更安全的会话管理）
    const createSessionsTableSQL = `
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ip_address INET,
        user_agent TEXT
      );
    `;
    
    await client.query(createSessionsTableSQL);
    console.log('✅ 用户会话表创建成功');
    
    // 创建会话表索引
    const createSessionIndexesSQL = [
      'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);',
      'CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);'
    ];
    
    for (const sql of createSessionIndexesSQL) {
      await client.query(sql);
    }
    console.log('✅ 会话表索引创建成功');
    
    console.log('🎉 用户表初始化完成！');
    
  } catch (error) {
    console.error('❌ 初始化用户表失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 清理过期会话的函数
async function cleanupExpiredSessions() {
  const client = await pool.connect();
  
  try {
    const searchPath = getSearchPath();
    await client.query(`SET search_path TO ${searchPath}`);
    
    const result = await client.query(
      'DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP'
    );
    
    console.log(`🧹 清理了 ${result.rowCount} 个过期会话`);
  } catch (error) {
    console.error('❌ 清理过期会话失败:', error);
  } finally {
    client.release();
  }
}

// 主函数
async function main() {
  try {
    await initUsersTable();
    await cleanupExpiredSessions();
  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  initUsersTable,
  cleanupExpiredSessions
};
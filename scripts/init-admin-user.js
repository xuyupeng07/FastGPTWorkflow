const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// 数据库连接配置
const DATABASE_URL = process.env.DATABASE_URL;
const DB_SCHEMA = process.env.DB_SCHEMA || 'workflow';
const FALLBACK_SCHEMA = process.env.DB_FALLBACK_SCHEMA || 'public';

// 构建search_path
const getSearchPath = () => {
  if (DB_SCHEMA === 'public') {
    return 'public';
  }
  return `${DB_SCHEMA}, ${FALLBACK_SCHEMA}`;
};

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: false
});

async function initAdminUser() {
  const client = await pool.connect();
  
  try {
    console.log('开始初始化管理员用户...');
    
    // 设置schema
    const searchPath = getSearchPath();
    await client.query(`SET search_path TO ${searchPath}`);
    console.log(`✅ 已设置数据库schema为: ${searchPath}`);
    
    // 检查是否已存在管理员用户
    const existingAdmin = await client.query(
      'SELECT id FROM users WHERE username = $1',
      ['admin']
    );
    
    if (existingAdmin.rows.length > 0) {
      console.log('管理员用户已存在，跳过初始化');
      return;
    }
    
    // 获取默认管理员密码
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    
    // 加密密码
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
    
    // 创建管理员用户
    const result = await client.query(
      `INSERT INTO users (username, email, password_hash, role, is_active, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
       RETURNING id, username, email, role`,
      ['admin', 'admin@fastgpt.com', hashedPassword, 'admin', true]
    );
    
    console.log('管理员用户创建成功:');
    console.log('- 用户名: admin');
    console.log('- 邮箱: admin@fastgpt.com');
    console.log('- 密码:', defaultPassword);
    console.log('- 角色: admin');
    console.log('- 用户ID:', result.rows[0].id);
    
  } catch (error) {
    console.error('初始化管理员用户失败:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// 注意：这是初始化脚本，请根据需要手动执行
// 执行命令: node scripts/init-admin-user.js
// initAdminUser()
//   .then(() => {
//     console.log('管理员用户初始化完成');
//     process.exit(0);
//   })
//   .catch((error) => {
//     console.error('初始化失败:', error);
//     process.exit(1);
//   });

module.exports = { initAdminUser };
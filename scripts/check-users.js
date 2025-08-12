require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

// 数据库连接
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkUsers() {
  try {
    console.log('🔗 连接数据库...');
    
    // 获取schema配置
    const schema = process.env.DB_SCHEMA || process.env.DB_FALLBACK_SCHEMA || 'public';
    console.log(`📋 使用schema: ${schema}`);
    
    // 查询所有用户
    const usersQuery = `SELECT id, username, email, role, is_active, created_at FROM ${schema}.users ORDER BY created_at DESC`;
    console.log('🔍 查询用户:', usersQuery);
    
    const result = await pool.query(usersQuery);
    console.log(`👥 找到 ${result.rows.length} 个用户:`);
    
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, 用户名: ${user.username}, 邮箱: ${user.email}, 角色: ${user.role}, 激活: ${user.is_active}, 创建时间: ${user.created_at}`);
    });
    
    // 查询最近创建的用户
    const recentUsersQuery = `SELECT * FROM ${schema}.users WHERE created_at > NOW() - INTERVAL '1 hour' ORDER BY created_at DESC`;
    const recentResult = await pool.query(recentUsersQuery);
    
    console.log(`\n🕐 最近1小时内创建的用户 (${recentResult.rows.length} 个):`);
    recentResult.rows.forEach((user, index) => {
      console.log(`${index + 1}. 完整信息:`, user);
    });
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
    console.error('错误详情:', error.message);
  } finally {
    await pool.end();
    console.log('🔚 数据库连接已关闭');
  }
}

checkUsers();
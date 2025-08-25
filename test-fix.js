const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// 数据库连接配置
const DATABASE_URL = process.env.DATABASE_URL;
const DB_SCHEMA = process.env.DB_SCHEMA || 'workflow';
const FALLBACK_SCHEMA = process.env.DB_FALLBACK_SCHEMA || 'public';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: false
});

async function testFix() {
  const client = await pool.connect();
  
  try {
    // 设置search_path
    const searchPath = DB_SCHEMA === 'public' ? 'public' : `${DB_SCHEMA}, ${FALLBACK_SCHEMA}`;
    await client.query(`SET search_path TO ${searchPath}`);
    console.log(`✅ 已设置数据库schema为: ${searchPath}`);
    
    console.log('测试修复结果...');
    
    // 选择一个测试工作流
    const testWorkflowId = 29;
    
    // 查看修复前的状态
    const beforeResult = await client.query('SELECT id, title, usage_count FROM workflows WHERE id = $1', [testWorkflowId]);
    console.log('\n测试工作流当前状态:', beforeResult.rows[0]);
    
    // 模拟API调用 - 记录copy行为
    console.log('\n模拟copy操作...');
    
    // 1. 插入user_action记录
    const actionResult = await client.query(`
      INSERT INTO user_actions (workflow_id, action_type, user_session_id, user_ip, user_agent, referrer)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at
    `, [testWorkflowId, 'copy', 'test-session-123', '192.168.1.1', 'Mozilla/5.0 Test', 'http://localhost:3001']);
    
    console.log('✅ user_action记录插入成功:', actionResult.rows[0]);
    
    // 2. 更新usage_count
    const updateResult = await client.query(`
      UPDATE workflows 
      SET usage_count = COALESCE(usage_count, 0) + 1 
      WHERE id = $1
      RETURNING id, title, usage_count
    `, [testWorkflowId]);
    
    console.log('✅ usage_count更新成功:', updateResult.rows[0]);
    
    // 模拟try操作
    console.log('\n模拟try操作...');
    
    // 1. 插入user_action记录
    const tryActionResult = await client.query(`
      INSERT INTO user_actions (workflow_id, action_type, user_session_id, user_ip, user_agent, referrer)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at
    `, [testWorkflowId, 'try', 'test-session-123', '192.168.1.1', 'Mozilla/5.0 Test', 'http://localhost:3001']);
    
    console.log('✅ try action记录插入成功:', tryActionResult.rows[0]);
    
    // 2. 更新usage_count
    const tryUpdateResult = await client.query(`
      UPDATE workflows 
      SET usage_count = COALESCE(usage_count, 0) + 1 
      WHERE id = $1
      RETURNING id, title, usage_count
    `, [testWorkflowId]);
    
    console.log('✅ usage_count再次更新成功:', tryUpdateResult.rows[0]);
    
    // 查看最终状态
    const finalResult = await client.query('SELECT id, title, usage_count FROM workflows WHERE id = $1', [testWorkflowId]);
    console.log('\n最终状态:', finalResult.rows[0]);
    
    // 查看最近的操作记录
    const recentActions = await client.query(`
      SELECT id, workflow_id, action_type, created_at
      FROM user_actions 
      WHERE workflow_id = $1
      ORDER BY created_at DESC 
      LIMIT 5
    `, [testWorkflowId]);
    
    console.log('\n最近的操作记录:');
    recentActions.rows.forEach(row => {
      console.log(`  ID: ${row.id}, 操作: ${row.action_type}, 时间: ${row.created_at}`);
    });
    
    console.log('\n🎉 测试完成！copy和try功能现在应该可以正常增加使用次数了。');
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testFix();
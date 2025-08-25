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

async function testDatabase() {
  const client = await pool.connect();
  
  try {
    // 设置search_path
    const searchPath = DB_SCHEMA === 'public' ? 'public' : `${DB_SCHEMA}, ${FALLBACK_SCHEMA}`;
    await client.query(`SET search_path TO ${searchPath}`);
    console.log(`✅ 已设置数据库schema为: ${searchPath}`);
    
    // 检查workflows表结构
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'workflow' 
      AND table_name = 'workflows'
      AND column_name IN ('usage_count', 'id', 'title')
      ORDER BY ordinal_position
    `);
    console.log('workflows表相关字段结构:');
    columnsResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}, nullable: ${row.is_nullable}, default: ${row.column_default}`);
    });
    
    // 检查有多少工作流的usage_count是null
    const nullCountResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(usage_count) as with_usage_count,
        COUNT(*) - COUNT(usage_count) as null_usage_count
      FROM workflows
    `);
    console.log('\nusage_count统计:', nullCountResult.rows[0]);
    
    // 查看最近的user_actions记录
    const recentActionsResult = await client.query(`
      SELECT workflow_id, action_type, created_at
      FROM user_actions 
      WHERE action_type IN ('copy', 'try')
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    console.log('\n最近的copy/try操作:');
    recentActionsResult.rows.forEach(row => {
      console.log(`  工作流${row.workflow_id}: ${row.action_type} at ${row.created_at}`);
    });
    
    // 测试更新一个工作流的usage_count
    console.log('\n测试更新usage_count...');
    const testWorkflowId = 29; // 选择一个usage_count为null的工作流
    
    // 先查看当前值
    const beforeResult = await client.query('SELECT id, title, usage_count FROM workflows WHERE id = $1', [testWorkflowId]);
    console.log('更新前:', beforeResult.rows[0]);
    
    // 执行更新
    const updateResult = await client.query(`
      UPDATE workflows 
      SET usage_count = COALESCE(usage_count, 0) + 1 
      WHERE id = $1
      RETURNING id, title, usage_count
    `, [testWorkflowId]);
    console.log('更新后:', updateResult.rows[0]);
    
  } catch (error) {
    console.error('Database test error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testDatabase();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 数据库连接配置
const pool = new Pool({
  connectionString: 'postgresql://postgres:bzncrmdw@dbconn.sealoshzh.site:48900/?directConnection=true',
  ssl: false
});

async function dropWorkflowRequirements() {
  const client = await pool.connect();
  
  try {
    console.log('🔗 正在连接到远程数据库...');
    
    console.log('🗑️ 开始删除workflow_requirements表及其相关依赖...');
    
    // 分步执行删除操作
    console.log('1. 删除workflow_requirements表的索引...');
    await client.query('DROP INDEX IF EXISTS idx_requirements_workflow;');
    
    console.log('2. 删除workflow_requirements表...');
    await client.query('DROP TABLE IF EXISTS workflow_requirements CASCADE;');
    
    console.log('✅ workflow_requirements表及其相关依赖已成功删除！');
    
  } catch (error) {
    console.error('❌ 删除workflow_requirements表失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    console.log('🔌 数据库连接已关闭');
  }
}

// 执行删除操作
if (require.main === module) {
  dropWorkflowRequirements();
}

module.exports = { dropWorkflowRequirements };
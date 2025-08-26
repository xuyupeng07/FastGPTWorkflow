require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function verifyResult() {
  try {
    console.log('=== 验证数据复制结果 ===\n');
    
    const schemas = ['workflow', 'workflow2', 'public'];
    const results = {};
    
    // 获取每个schema的表和记录数
    for (const schema of schemas) {
      console.log(`检查 ${schema} schema...`);
      
      const tablesResult = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `, [schema]);
      
      results[schema] = {};
      
      for (const tableRow of tablesResult.rows) {
        const tableName = tableRow.table_name;
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${schema}."${tableName}"`);
        results[schema][tableName] = parseInt(countResult.rows[0].count);
      }
    }
    
    // 比较结果
    console.log('\n=== 数据对比结果 ===');
    
    const workflowTables = Object.keys(results.workflow || {});
    let allMatch = true;
    
    for (const tableName of workflowTables) {
      const workflowCount = results.workflow[tableName] || 0;
      const workflow2Count = results.workflow2[tableName] || 0;
      const publicCount = results.public[tableName] || 0;
      
      const match = workflowCount === workflow2Count && workflowCount === publicCount;
      const status = match ? '✅' : '❌';
      
      console.log(`${status} ${tableName}: workflow(${workflowCount}) = workflow2(${workflow2Count}) = public(${publicCount})`);
      
      if (!match) {
        allMatch = false;
      }
    }
    
    console.log('\n=== 总结 ===');
    if (allMatch) {
      console.log('✅ 所有数据完全匹配！workflow数据已成功复制到workflow2和public schema');
    } else {
      console.log('❌ 发现数据不匹配，请检查复制过程');
    }
    
    // 计算总记录数
    const totalWorkflow = Object.values(results.workflow || {}).reduce((sum, count) => sum + count, 0);
    const totalWorkflow2 = Object.values(results.workflow2 || {}).reduce((sum, count) => sum + count, 0);
    const totalPublic = Object.values(results.public || {}).reduce((sum, count) => sum + count, 0);
    
    console.log(`\n总记录数: workflow(${totalWorkflow}) workflow2(${totalWorkflow2}) public(${totalPublic})`);
    
  } catch (error) {
    console.error('验证失败:', error.message);
  } finally {
    await pool.end();
  }
}

// 注意：这是初始化脚本，请根据需要手动执行
// 执行命令: node scripts/verify-copy-result.js
// verifyResult();

module.exports = { verifyResult };
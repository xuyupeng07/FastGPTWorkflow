const { Pool } = require('pg');

// 加载环境变量
require('dotenv').config();

// 数据库连接
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:bzncrmdw@dbconn.sealoshzh.site:48900/?directConnection=true'
});

async function removeCategoryFields() {
  try {
    console.log('开始删除分类表中的icon和color字段...');
    
    // 删除icon字段
    await pool.query('ALTER TABLE workflow_categories DROP COLUMN IF EXISTS icon');
    console.log('icon字段删除成功');
    
    // 删除color字段
    await pool.query('ALTER TABLE workflow_categories DROP COLUMN IF EXISTS color');
    console.log('color字段删除成功');
    
    console.log('分类字段删除完成');
  } catch (error) {
    console.error('删除字段失败:', error);
  } finally {
    await pool.end();
  }
}

removeCategoryFields();
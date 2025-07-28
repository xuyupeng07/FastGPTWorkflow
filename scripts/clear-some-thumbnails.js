const { Pool } = require('pg');

// 数据库连接配置
const pool = new Pool({
  connectionString: 'postgresql://postgres:mjns8kr8@dbconn.sealoshzh.site:47291/?directConnection=true'
});

async function clearSomeThumbnails() {
  try {
    console.log('🔄 开始清除部分工作流的缩略图...');
    
    // 清除前5个工作流的缩略图，用于测试
    const result = await pool.query(`
      UPDATE workflows 
      SET thumbnail_url = NULL 
      WHERE id IN (
        SELECT id FROM workflows 
        ORDER BY created_at 
        LIMIT 5
      )
      RETURNING id, title, thumbnail_url
    `);
    
    console.log('✅ 成功清除缩略图的工作流:');
    result.rows.forEach(row => {
      console.log(`- ${row.title} (ID: ${row.id})`);
    });
    
    console.log(`\n📊 总共清除了 ${result.rows.length} 个工作流的缩略图`);
    
  } catch (error) {
    console.error('❌ 清除缩略图失败:', error);
  } finally {
    await pool.end();
  }
}

clearSomeThumbnails();
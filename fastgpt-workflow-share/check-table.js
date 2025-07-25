const { Client } = require('pg');

async function checkTable() {
  const client = new Client({
    connectionString: 'postgresql://postgres:bzncrmdw@dbconn.sealoshzh.site:48900/?directConnection=true'
  });

  try {
    await client.connect();
    console.log('✅ 数据库连接成功！');
    
    // 查询表结构
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'workflows'
      ORDER BY ordinal_position;
    `);
    
    console.log('📊 workflows表结构:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // 查询现有数据
    const dataResult = await client.query('SELECT id, title, is_featured FROM workflows LIMIT 5');
    console.log('\n📋 现有数据:');
    dataResult.rows.forEach(row => {
      console.log(`- ID: ${row.id}, Title: ${row.title}, Featured: ${row.is_featured}`);
    });
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error('详细错误:', error);
  } finally {
    await client.end();
  }
}

checkTable();
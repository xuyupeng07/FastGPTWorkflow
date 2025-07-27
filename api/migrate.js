const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config();

// 数据库连接配置
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/fastgpt_workflow';

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: false
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ 数据库连接成功');
    
    // 读取迁移脚本
    const migrationPath = path.join(__dirname, '..', 'migrate-user-session.sql');
    console.log('迁移文件路径:', migrationPath);
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ 迁移文件不存在:', migrationPath);
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('迁移SQL长度:', migrationSQL.length);
    
    console.log('🔄 开始执行数据库迁移...');
    
    // 分割SQL语句并逐个执行
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement);
          console.log('✅ 执行成功:', statement.substring(0, 50) + '...');
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log('⚠️  已存在:', statement.substring(0, 50) + '...');
          } else {
            console.error('❌ 执行失败:', statement.substring(0, 50) + '...');
            console.error('错误:', error.message);
          }
        }
      }
    }
    
    console.log('🎉 数据库迁移完成!');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误代码:', error.code);
  } finally {
    try {
      await client.end();
    } catch (e) {
      console.error('关闭连接失败:', e.message);
    }
  }
}

runMigration();
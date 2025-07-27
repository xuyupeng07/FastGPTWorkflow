#!/usr/bin/env node

/**
 * FastGPT工作流数据库初始化脚本
 * 连接到PostgreSQL数据库并执行初始化SQL
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config();

// 数据库连接配置
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:bzncrmdw@dbconn.sealoshzh.site:48900/?directConnection=true';

// 创建数据库客户端
const client = new Client({
  connectionString: DATABASE_URL,
  ssl: false // 根据实际情况调整
});

async function initializeDatabase() {
  try {
    console.log('🔗 正在连接到数据库...');
    await client.connect();
    console.log('✅ 数据库连接成功！');

    // 先删除所有表（如果存在）
    console.log('🗑️ 清理现有表结构...');
    await client.query(`
      DROP TABLE IF EXISTS user_actions CASCADE;
      DROP TABLE IF EXISTS workflow_requirements CASCADE;
      DROP TABLE IF EXISTS workflow_instructions CASCADE;
      DROP TABLE IF EXISTS workflow_screenshots CASCADE;
      DROP TABLE IF EXISTS workflow_tag_relations CASCADE;
      DROP TABLE IF EXISTS workflow_configs CASCADE;
      DROP TABLE IF EXISTS workflows CASCADE;
      DROP TABLE IF EXISTS workflow_tags CASCADE;
      DROP TABLE IF EXISTS authors CASCADE;
      DROP TABLE IF EXISTS workflow_categories CASCADE;
    `);

    // 读取初始化SQL文件
    const sqlFilePath = path.join(__dirname, 'init.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 正在执行数据库初始化脚本...');
    
    // 执行SQL脚本
    await client.query(sqlContent);
    
    console.log('✅ 数据库初始化完成！');
    
    // 验证表是否创建成功
    console.log('🔍 验证数据库表...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('📊 已创建的表:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // 验证视图
    const viewsResult = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('👁️  已创建的视图:');
    viewsResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // 验证初始数据
    const categoriesResult = await client.query('SELECT COUNT(*) as count FROM workflow_categories');
    const authorsResult = await client.query('SELECT COUNT(*) as count FROM authors');
    
    console.log('📈 初始数据统计:');
    console.log(`  - 工作流分类: ${categoriesResult.rows[0].count} 条`);
    console.log(`  - 作者: ${authorsResult.rows[0].count} 条`);
    
    console.log('\n🎉 数据库初始化全部完成！');
    console.log('\n📝 接下来可以:');
    console.log('  1. 使用API接口添加工作流数据');
    console.log('  2. 导入现有的工作流配置');
    console.log('  3. 启动Web应用程序');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 数据库连接已关闭');
  }
}

// 执行初始化
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
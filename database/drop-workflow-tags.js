const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config();

// 数据库连接配置
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:bzncrmdw@dbconn.sealoshzh.site:48900/?directConnection=true',
  ssl: false
});

async function dropWorkflowTags() {
  const client = await pool.connect();
  
  try {
    console.log('🔗 正在连接到远程数据库...');
    
    // 读取SQL脚本
    const sqlScript = fs.readFileSync(path.join(__dirname, 'drop-workflow-tags.sql'), 'utf8');
    
    console.log('🗑️ 开始删除workflow_tags表及其相关依赖...');
    
    // 分步执行删除操作
    console.log('1. 删除触发器...');
    await client.query('DROP TRIGGER IF EXISTS trigger_update_tag_usage ON workflow_tag_relations;');
    
    console.log('2. 删除函数...');
    await client.query('DROP FUNCTION IF EXISTS update_tag_usage_count();');
    
    console.log('3. 删除popular_tags视图...');
    await client.query('DROP VIEW IF EXISTS popular_tags;');
    
    console.log('4. 删除现有workflow_details视图...');
    await client.query('DROP VIEW IF EXISTS workflow_details;');
    
    console.log('5. 重新创建workflow_details视图（移除标签字段）...');
    await client.query(`
      CREATE VIEW workflow_details AS
      SELECT 
          w.id,
          w.title,
          w.description,
          w.long_description,
          w.thumbnail_url,
          w.estimated_time,
          w.usage_count,
          w.like_count,
          w.view_count,
          w.demo_url,
          w.share_id,
          w.is_featured,
          w.is_published,
          w.version,
          w.created_at,
          w.updated_at,
          w.published_at,
          -- 分类信息
          c.name as category_name,
          c.icon as category_icon,
          c.color as category_color,
          -- 作者信息
          a.name as author_name,
          a.avatar_url as author_avatar,
          a.is_verified as author_verified,
          -- 配置信息
          wc.nodes_count,
          wc.edges_count,
          wc.variables_count,
          wc.config_json
      FROM workflows w
      LEFT JOIN workflow_categories c ON w.category_id = c.id
      LEFT JOIN authors a ON w.author_id = a.id
      LEFT JOIN workflow_configs wc ON w.id = wc.workflow_id;
    `);
    
    console.log('6. 更新search_workflows函数（移除标签参数）...');
    await client.query(`
      CREATE OR REPLACE FUNCTION search_workflows(
          p_query TEXT DEFAULT NULL,
          p_category_id VARCHAR(50) DEFAULT NULL,
          p_limit INTEGER DEFAULT 20,
          p_offset INTEGER DEFAULT 0,
          p_sort_by VARCHAR(20) DEFAULT 'newest'
      )
      RETURNS TABLE(
          id VARCHAR(50),
          title VARCHAR(200),
          description TEXT,
          category_name VARCHAR(100),
          usage_count INTEGER,
          like_count INTEGER,
          created_at TIMESTAMP,
          total_count BIGINT
      ) AS $$
      DECLARE
          query_sql TEXT;
          where_conditions TEXT[] := ARRAY[]::TEXT[];
          order_clause TEXT;
      BEGIN
          -- 构建WHERE条件
          IF p_query IS NOT NULL AND p_query != '' THEN
              where_conditions := array_append(where_conditions, 
                  'to_tsvector(''english'', w.title || '' '' || w.description) @@ plainto_tsquery(''english'', ''' || p_query || ''')');
          END IF;
          
          IF p_category_id IS NOT NULL AND p_category_id != 'all' THEN
              where_conditions := array_append(where_conditions, 'w.category_id = ''' || p_category_id || '''');
          END IF;
          
          -- 添加基本条件
          where_conditions := array_append(where_conditions, 'w.is_published = true');
          
          -- 构建ORDER BY子句
          CASE p_sort_by
              WHEN 'popular' THEN order_clause := 'ORDER BY w.like_count DESC, w.usage_count DESC';
              WHEN 'usage' THEN order_clause := 'ORDER BY w.usage_count DESC';
              WHEN 'newest' THEN order_clause := 'ORDER BY w.created_at DESC';
              ELSE order_clause := 'ORDER BY w.created_at DESC';
          END CASE;
          
          -- 构建完整查询
          query_sql := '
              SELECT w.id, w.title, w.description, c.name as category_name, 
                     w.usage_count, w.like_count, w.created_at,
                     COUNT(*) OVER() as total_count
              FROM workflows w
              LEFT JOIN workflow_categories c ON w.category_id = c.id
              WHERE ' || array_to_string(where_conditions, ' AND ') || '
              ' || order_clause || '
              LIMIT ' || p_limit || ' OFFSET ' || p_offset;
          
          RETURN QUERY EXECUTE query_sql;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('7. 删除workflow_tag_relations表...');
    await client.query('DROP TABLE IF EXISTS workflow_tag_relations CASCADE;');
    
    console.log('8. 删除workflow_tags表...');
    await client.query('DROP TABLE IF EXISTS workflow_tags CASCADE;');
    
    const result = { message: 'workflow_tags表及其相关依赖已成功删除！' };
    
    console.log('✅ workflow_tags表及其相关依赖已成功删除！');
    console.log('📊 执行结果:', result[result.length - 1]?.rows?.[0]?.message || '删除完成');
    
    // 验证表是否已删除
    console.log('🔍 验证删除结果...');
    const checkTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('workflow_tags', 'workflow_tag_relations')
    `);
    
    if (checkTables.rows.length === 0) {
      console.log('✅ 确认：workflow_tags和workflow_tag_relations表已完全删除');
    } else {
      console.log('⚠️ 警告：以下表仍然存在:', checkTables.rows.map(r => r.table_name));
    }
    
    // 检查视图状态
    const checkViews = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name IN ('popular_tags', 'workflow_details')
    `);
    
    console.log('👁️ 当前视图状态:');
    checkViews.rows.forEach(row => {
      console.log(`  - ${row.table_name}: 存在`);
    });
    
  } catch (error) {
    console.error('❌ 删除过程中发生错误:', error.message);
    console.error('详细错误:', error);
  } finally {
    client.release();
    await pool.end();
    console.log('🔌 数据库连接已关闭');
  }
}

// 执行删除操作
dropWorkflowTags().catch(console.error);
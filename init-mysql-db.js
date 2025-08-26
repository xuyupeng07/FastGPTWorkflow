const mysql = require('mysql2/promise');

async function initializeDatabase() {
  let connection;
  
  try {
    // 连接到MySQL数据库
    const connectionString = process.env.MYSQL_DATABASE_URL || 'mysql://username:password@localhost:3306/database_name';
    connection = await mysql.createConnection(connectionString);
    console.log('✅ 连接到MySQL数据库成功');
    
    // 创建platforms表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`platform\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`platform\` VARCHAR(50) NOT NULL UNIQUE,
        \`abbreviation\` VARCHAR(20) NOT NULL UNIQUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ platform表创建成功');
    
    // 创建source_types表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`sourcetype\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`sourcetype\` VARCHAR(50) NOT NULL UNIQUE,
        \`en\` VARCHAR(20) NOT NULL UNIQUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ sourcetype表创建成功');
    
    // 创建workflows表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`workflow\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`project_code\` VARCHAR(50) NOT NULL UNIQUE,
        \`description\` VARCHAR(100),
        \`url\` VARCHAR(255) UNIQUE,
        \`workflow\` JSON
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ workflow表创建成功');
    
    // 创建links表，用于短链接管理
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`link_info\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`project_code\` VARCHAR(50) NOT NULL,
        \`source_type\` VARCHAR(20) NOT NULL,
        \`platform\` VARCHAR(50) NOT NULL,
        \`short_url\` VARCHAR(255) NOT NULL UNIQUE,
        \`long_url\` VARCHAR(512) NOT NULL UNIQUE,
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ link_info表创建成功');
    
    // 插入默认平台数据
    const platforms = [
      ['微信', 'wx'],
      ['抖音', 'dy'],
      ['小红书', 'xhs'],
      ['知乎', 'zh'],
      ['微博', 'wb'],
      ['B站', 'bl'],
      ['快手', 'ks'],
      ['头条', 'tt']
    ];
    
    for (const [platform, abbreviation] of platforms) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO platform (platform, abbreviation) VALUES (?, ?)',
          [platform, abbreviation]
        );
      } catch (error) {
        // 忽略重复插入错误
      }
    }
    console.log('✅ 默认平台数据插入成功');
    
    // 插入默认来源类型数据
    const sourceTypes = [
      ['付费推广', 'paid'],
      ['自然流量', 'organic'],
      ['社交媒体', 'social'],
      ['邮件营销', 'email'],
      ['直接访问', 'direct'],
      ['推荐流量', 'referral']
    ];
    
    for (const [sourcetype, en] of sourceTypes) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO sourcetype (sourcetype, en) VALUES (?, ?)',
          [sourcetype, en]
        );
      } catch (error) {
        // 忽略重复插入错误
      }
    }
    console.log('✅ 默认来源类型数据插入成功');
    
    // 创建视图
    await connection.execute(`
      CREATE OR REPLACE VIEW \`link_workflow_info\` AS
      SELECT 
        l.id AS id,
        l.created_at AS created_at,
        l.source_type AS source_type,
        l.platform AS platform_name,
        l.project_code AS project_code,
        w.description AS description,
        l.short_url AS short_url,
        l.long_url AS long_url
      FROM link_info l 
      JOIN workflow w ON l.project_code = w.project_code
    `);
    console.log('✅ link_workflow_info视图创建成功');
    
    await connection.execute(`
      CREATE OR REPLACE VIEW \`platformmatch\` AS
      SELECT 
        l.id AS id,
        l.created_at AS created_at,
        l.source_type AS source_type,
        l.platform AS platform_name,
        l.project_code AS project_code,
        l.short_url AS short_url,
        l.long_url AS long_url,
        p.abbreviation AS abbreviation
      FROM link_info l 
      JOIN platform p ON l.platform = p.platform
    `);
    console.log('✅ platformmatch视图创建成功');
    
    // 创建点击统计表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`click_analytics\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`link_id\` INT NOT NULL,
        \`clicked_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`ip_address\` VARCHAR(45),
        \`user_agent\` TEXT,
        \`referer\` VARCHAR(512),
        \`utm_source\` VARCHAR(50),
        \`utm_medium\` VARCHAR(50),
        \`utm_content\` VARCHAR(100),
        \`utm_campaign\` VARCHAR(100),
        \`utm_workflow\` VARCHAR(255),
        FOREIGN KEY (\`link_id\`) REFERENCES \`link_info\`(\`id\`) ON DELETE CASCADE,
        INDEX \`idx_link_id\` (\`link_id\`),
        INDEX \`idx_clicked_at\` (\`clicked_at\`),
        INDEX \`idx_utm_source\` (\`utm_source\`),
        INDEX \`idx_utm_medium\` (\`utm_medium\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ click_analytics表创建成功');
    
    // 创建统计汇总视图
    await connection.execute(`
      CREATE OR REPLACE VIEW \`analytics_summary\` AS
      SELECT 
        l.id as link_id,
        l.project_code,
        l.source_type,
        l.platform,
        l.short_url,
        l.long_url,
        l.created_at as link_created_at,
        COUNT(c.id) as total_clicks,
        COUNT(DISTINCT DATE(c.clicked_at)) as active_days,
        MAX(c.clicked_at) as last_clicked_at,
        MIN(c.clicked_at) as first_clicked_at
      FROM link_info l
      LEFT JOIN click_analytics c ON l.id = c.link_id
      GROUP BY l.id, l.project_code, l.source_type, l.platform, l.short_url, l.long_url, l.created_at
    `);
    console.log('✅ analytics_summary视图创建成功');
    
    // 创建UTM参数统计视图
    await connection.execute(`
      CREATE OR REPLACE VIEW \`utm_analytics\` AS
      SELECT 
        utm_source,
        utm_medium,
        utm_content,
        utm_campaign,
        utm_workflow,
        COUNT(*) as total_clicks,
        COUNT(DISTINCT link_id) as unique_links,
        COUNT(DISTINCT ip_address) as unique_visitors,
        COUNT(DISTINCT DATE(clicked_at)) as active_days,
        MIN(clicked_at) as first_click,
        MAX(clicked_at) as last_click,
        ROUND(COUNT(*) / COUNT(DISTINCT link_id), 2) as avg_clicks_per_link,
        ROUND(COUNT(DISTINCT ip_address) / COUNT(*) * 100, 2) as conversion_rate
      FROM click_analytics
      WHERE utm_source IS NOT NULL
      GROUP BY utm_source, utm_medium, utm_content, utm_campaign, utm_workflow
    `);
    console.log('✅ utm_analytics视图创建成功');
    
    // 创建每日统计视图
    await connection.execute(`
      CREATE OR REPLACE VIEW \`daily_analytics\` AS
      SELECT 
        DATE(clicked_at) as click_date,
        utm_source,
        utm_medium,
        COUNT(*) as daily_clicks,
        COUNT(DISTINCT link_id) as unique_links_clicked,
        COUNT(DISTINCT ip_address) as unique_visitors
      FROM click_analytics
      GROUP BY DATE(clicked_at), utm_source, utm_medium
      ORDER BY click_date DESC
    `);
    console.log('✅ daily_analytics视图创建成功');
    
    // 创建平台效果统计视图
    await connection.execute(`
      CREATE OR REPLACE VIEW \`platform_performance\` AS
      SELECT 
        p.platform,
        p.abbreviation,
        COUNT(c.id) as total_clicks,
        COUNT(DISTINCT c.link_id) as links_with_clicks,
        COUNT(DISTINCT DATE(c.clicked_at)) as active_days,
        AVG(daily_clicks.clicks_per_day) as avg_daily_clicks
      FROM platform p
      LEFT JOIN link_info l ON p.platform = l.platform
      LEFT JOIN click_analytics c ON l.id = c.link_id
      LEFT JOIN (
        SELECT 
          link_id,
          DATE(clicked_at) as click_date,
          COUNT(*) as clicks_per_day
        FROM click_analytics
        GROUP BY link_id, DATE(clicked_at)
      ) daily_clicks ON l.id = daily_clicks.link_id
      GROUP BY p.platform, p.abbreviation
    `);
    console.log('✅ platform_performance视图创建成功');
    
    console.log('�� MySQL数据库初始化完成！');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行初始化
// 注意：这是初始化脚本，请根据需要手动执行
// 执行前请确保已安装 mysql2 依赖: pnpm install mysql2
// 执行命令: node init-mysql-db.js
// initializeDatabase();

module.exports = { initializeDatabase };
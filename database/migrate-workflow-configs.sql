-- 迁移脚本：将workflow_configs表合并到workflow表的json_source字段
-- 执行前请确保已备份数据库

-- 1. 首先检查当前数据状态
SELECT 
    'workflow_configs表记录数' as description,
    COUNT(*) as count
FROM workflow_configs
UNION ALL
SELECT 
    'workflows表中已有json_source的记录数' as description,
    COUNT(*) as count
FROM workflows 
WHERE json_source IS NOT NULL AND json_source != '';

-- 2. 更新workflows表，将workflow_configs的config_json合并到json_source字段
UPDATE workflows 
SET json_source = wc.config_json::text,
    updated_at = CURRENT_TIMESTAMP
FROM workflow_configs wc
WHERE workflows.id = wc.workflow_id
  AND (workflows.json_source IS NULL OR workflows.json_source = '');

-- 3. 检查合并结果
SELECT 
    'workflows表中现在有json_source的记录数' as description,
    COUNT(*) as count
FROM workflows 
WHERE json_source IS NOT NULL AND json_source != '';

-- 4. 检查是否有未合并的workflow_configs记录
SELECT 
    'workflow_configs中未合并的记录数' as description,
    COUNT(*) as count
FROM workflow_configs wc
LEFT JOIN workflows w ON wc.workflow_id = w.id
WHERE w.json_source IS NULL OR w.json_source = '';

-- 5. 显示未合并的记录详情（如果有的话）
SELECT 
    wc.workflow_id,
    w.title,
    'workflow_configs存在但workflows.json_source为空' as issue
FROM workflow_configs wc
LEFT JOIN workflows w ON wc.workflow_id = w.id
WHERE w.json_source IS NULL OR w.json_source = ''
LIMIT 10;

-- 6. 更新workflow_details视图，移除对workflow_configs表和workflow_tag_relations表的依赖
CREATE OR REPLACE VIEW workflow_details AS
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
    w.json_source,
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
    -- 从json_source解析配置信息
    CASE 
        WHEN w.json_source IS NOT NULL AND w.json_source != '' THEN
            COALESCE((w.json_source::jsonb->>'nodes_count')::integer, 0)
        ELSE 0
    END as nodes_count,
    CASE 
        WHEN w.json_source IS NOT NULL AND w.json_source != '' THEN
            COALESCE((w.json_source::jsonb->>'edges_count')::integer, 0)
        ELSE 0
    END as edges_count,
    CASE 
        WHEN w.json_source IS NOT NULL AND w.json_source != '' THEN
            COALESCE((w.json_source::jsonb->>'variables_count')::integer, 0)
        ELSE 0
    END as variables_count,
    CASE 
        WHEN w.json_source IS NOT NULL AND w.json_source != '' THEN
            w.json_source::jsonb
        ELSE NULL
    END as config_json
FROM workflows w
LEFT JOIN workflow_categories c ON w.category_id = c.id
LEFT JOIN authors a ON w.author_id = a.id
GROUP BY 
    w.id, w.title, w.description, w.long_description, w.thumbnail_url,
    w.estimated_time, w.usage_count, w.like_count, w.view_count,
    w.demo_url, w.share_id, w.is_featured, w.is_published, w.version,
    w.json_source, w.created_at, w.updated_at, w.published_at,
    c.name, c.icon, c.color,
    a.name, a.avatar_url, a.is_verified;

-- 7. 删除workflow_configs表的触发器
DROP TRIGGER IF EXISTS update_workflow_configs_updated_at ON workflow_configs;

-- 8. 删除workflow_configs表的索引
DROP INDEX IF EXISTS idx_workflow_configs_workflow;

-- 9. 删除workflow_configs表
DROP TABLE IF EXISTS workflow_configs CASCADE;

-- 10. 验证迁移结果
SELECT 
    'workflows表总记录数' as description,
    COUNT(*) as count
FROM workflows
UNION ALL
SELECT 
    'workflows表中有json_source的记录数' as description,
    COUNT(*) as count
FROM workflows 
WHERE json_source IS NOT NULL AND json_source != ''
UNION ALL
SELECT 
    'workflow_configs表是否存在' as description,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_configs') 
        THEN 1 
        ELSE 0 
    END as count;

-- 迁移完成提示
SELECT '✅ workflow_configs表已成功合并到workflows表的json_source字段，并删除了workflow_configs表' as message;
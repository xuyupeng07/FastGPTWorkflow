-- 删除workflow_tags表及其相关依赖的脚本
-- 注意：此操作不可逆，请确保已备份重要数据

-- 1. 删除触发器
DROP TRIGGER IF EXISTS trigger_update_tag_usage ON workflow_tag_relations;

-- 2. 删除函数
DROP FUNCTION IF EXISTS update_tag_usage_count();

-- 3. 删除视图（依赖workflow_tags表的视图）
DROP VIEW IF EXISTS popular_tags;

-- 4. 重新创建workflow_details视图（移除标签相关字段）
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
LEFT JOIN workflow_configs wc ON w.id = wc.workflow_id
GROUP BY 
    w.id, w.title, w.description, w.long_description, w.thumbnail_url,
    w.estimated_time, w.usage_count, w.like_count, w.view_count,
    w.demo_url, w.share_id, w.is_featured, w.is_published, w.version,
    w.created_at, w.updated_at, w.published_at,
    c.name, c.icon, c.color,
    a.name, a.avatar_url, a.is_verified,
    wc.nodes_count, wc.edges_count, wc.variables_count, wc.config_json;

-- 5. 更新search_workflows函数（移除标签参数）
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
    count_sql TEXT;
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

-- 6. 删除workflow_tag_relations表（外键约束会自动处理）
DROP TABLE IF EXISTS workflow_tag_relations CASCADE;

-- 7. 删除workflow_tags表
DROP TABLE IF EXISTS workflow_tags CASCADE;

SELECT 'workflow_tags表及其相关依赖已成功删除！' as message;
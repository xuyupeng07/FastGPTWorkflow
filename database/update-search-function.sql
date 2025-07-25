-- 更新search_workflows函数，移除对workflow_tag_relations表的依赖

-- 删除旧的函数（如果存在）
DROP FUNCTION IF EXISTS search_workflows(text, character varying, integer[], integer, integer, character varying);

-- 创建新的search_workflows函数（移除标签参数）
CREATE OR REPLACE FUNCTION public.search_workflows(
    p_query text DEFAULT NULL::text, 
    p_category_id character varying DEFAULT NULL::character varying, 
    p_limit integer DEFAULT 20, 
    p_offset integer DEFAULT 0, 
    p_sort_by character varying DEFAULT 'newest'::character varying
)
RETURNS TABLE(
    id character varying, 
    title character varying, 
    description text, 
    category_name character varying, 
    usage_count integer, 
    like_count integer, 
    created_at timestamp without time zone, 
    total_count bigint
)
LANGUAGE plpgsql
AS $$
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
$$;
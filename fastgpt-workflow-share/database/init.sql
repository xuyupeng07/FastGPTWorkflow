-- FastGPT工作流案例数据库初始化脚本
-- 数据库连接: postgresql://postgres:bzncrmdw@dbconn.sealoshzh.site:48900/?directConnection=true

-- 创建数据库扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. 工作流分类表
CREATE TABLE IF NOT EXISTS workflow_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 作者表
CREATE TABLE IF NOT EXISTS authors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    website_url TEXT,
    github_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 工作流表
CREATE TABLE IF NOT EXISTS workflows (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    long_description TEXT,
    category_id VARCHAR(50) NOT NULL REFERENCES workflow_categories(id),
    author_id INTEGER NOT NULL REFERENCES authors(id),
    thumbnail_url TEXT NOT NULL,
    estimated_time VARCHAR(50) NOT NULL,
    usage_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    demo_url TEXT,
    share_id VARCHAR(100) UNIQUE,
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    version VARCHAR(20) DEFAULT '1.0',
    json_source TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

-- 4. 工作流配置表
CREATE TABLE IF NOT EXISTS workflow_configs (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(50) NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    config_json JSONB NOT NULL,
    nodes_count INTEGER NOT NULL,
    edges_count INTEGER NOT NULL,
    variables_count INTEGER NOT NULL,
    config_version VARCHAR(20) DEFAULT '1.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workflow_id)
);

-- 5. 工作流标签表
CREATE TABLE IF NOT EXISTS workflow_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#6b7280',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. 工作流标签关联表
CREATE TABLE IF NOT EXISTS workflow_tag_relations (
    workflow_id VARCHAR(50) NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES workflow_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (workflow_id, tag_id)
);

-- 7. 工作流截图表
CREATE TABLE IF NOT EXISTS workflow_screenshots (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(50) NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(200),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. 工作流说明表
CREATE TABLE IF NOT EXISTS workflow_instructions (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(50) NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    instruction_text TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. 工作流需求表
CREATE TABLE IF NOT EXISTS workflow_requirements (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(50) NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    requirement_text TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. 用户行为统计表
CREATE TABLE IF NOT EXISTS user_actions (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(50) NOT NULL REFERENCES workflows(id),
    action_type VARCHAR(20) CHECK (action_type IN ('view', 'like', 'copy', 'try', 'share')) NOT NULL,
    user_session_id VARCHAR(100),
    user_ip VARCHAR(45),
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建唯一约束防止重复点赞
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_actions_unique_like 
ON user_actions(workflow_id, user_session_id, action_type) 
WHERE action_type = 'like' AND user_session_id IS NOT NULL;

-- 创建索引
-- 工作流表索引
CREATE INDEX IF NOT EXISTS idx_workflows_category ON workflows(category_id);
CREATE INDEX IF NOT EXISTS idx_workflows_author ON workflows(author_id);
CREATE INDEX IF NOT EXISTS idx_workflows_published ON workflows(is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_workflows_featured ON workflows(is_featured);
CREATE INDEX IF NOT EXISTS idx_workflows_usage ON workflows(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_likes ON workflows(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_created ON workflows(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_share_id ON workflows(share_id);

-- 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_workflows_search ON workflows USING gin(to_tsvector('english', title || ' ' || description));

-- 标签关联索引
CREATE INDEX IF NOT EXISTS idx_tag_relations_workflow ON workflow_tag_relations(workflow_id);
CREATE INDEX IF NOT EXISTS idx_tag_relations_tag ON workflow_tag_relations(tag_id);

-- 用户行为索引
CREATE INDEX IF NOT EXISTS idx_user_actions_workflow ON user_actions(workflow_id, action_type);
CREATE INDEX IF NOT EXISTS idx_user_actions_time ON user_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_actions_ip ON user_actions(user_ip);
CREATE INDEX IF NOT EXISTS idx_user_actions_session ON user_actions(user_session_id);

-- 配置表索引
CREATE INDEX IF NOT EXISTS idx_workflow_configs_workflow ON workflow_configs(workflow_id);

-- 截图表索引
CREATE INDEX IF NOT EXISTS idx_screenshots_workflow ON workflow_screenshots(workflow_id, sort_order);

-- 说明表索引
CREATE INDEX IF NOT EXISTS idx_instructions_workflow ON workflow_instructions(workflow_id, sort_order);

-- 需求表索引
CREATE INDEX IF NOT EXISTS idx_requirements_workflow ON workflow_requirements(workflow_id, sort_order);

-- 插入初始分类数据
INSERT INTO workflow_categories (id, name, icon, color, description, sort_order) VALUES
('customer-service', '客服助手', 'MessageCircle', '#3b82f6', '智能客服和对话助手相关工作流', 1),
('content-creation', '内容创作', 'PenTool', '#8b5cf6', '文章写作、内容生成相关工作流', 2),
('data-analysis', '数据分析', 'BarChart3', '#10b981', '数据处理和分析相关工作流', 3),
('automation', '自动化', 'Zap', '#f59e0b', '流程自动化和任务处理工作流', 4),
('education', '教育培训', 'GraduationCap', '#ef4444', '教学和培训相关工作流', 5),
('business', '商业应用', 'Briefcase', '#6366f1', '商业流程和企业应用工作流', 6)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    updated_at = CURRENT_TIMESTAMP;

-- 插入初始作者数据
INSERT INTO authors (name, email, avatar_url, bio, is_verified) VALUES
('FastGPT团队', 'team@fastgpt.com', '/fastgpt.svg', 'FastGPT官方开发团队', true),
('社区贡献者', 'community@fastgpt.com', '/community.svg', '来自社区的优秀贡献者', false)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url,
    bio = EXCLUDED.bio,
    is_verified = EXCLUDED.is_verified,
    updated_at = CURRENT_TIMESTAMP;

-- 插入初始标签数据
INSERT INTO workflow_tags (name, color) VALUES
('AI助手', '#3b82f6'),
('客服', '#10b981'),
('写作', '#8b5cf6'),
('分析', '#f59e0b'),
('自动化', '#ef4444'),
('教育', '#6366f1'),
('商业', '#8b5cf6'),
('数据处理', '#10b981'),
('对话', '#3b82f6'),
('内容生成', '#8b5cf6'),
('流程优化', '#f59e0b'),
('智能推荐', '#ef4444')
ON CONFLICT (name) DO NOTHING;

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表创建更新时间触发器
DROP TRIGGER IF EXISTS update_workflow_categories_updated_at ON workflow_categories;
CREATE TRIGGER update_workflow_categories_updated_at
    BEFORE UPDATE ON workflow_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_authors_updated_at ON authors;
CREATE TRIGGER update_authors_updated_at
    BEFORE UPDATE ON authors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflows;
CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_configs_updated_at ON workflow_configs;
CREATE TRIGGER update_workflow_configs_updated_at
    BEFORE UPDATE ON workflow_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建视图：工作流详情视图
CREATE OR REPLACE VIEW workflow_details AS
SELECT 
    w.id,
    w.title,
    w.description,
    w.long_description,
    w.thumbnail_url,
    w.difficulty,
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
    wc.config_json,
    -- 标签信息（聚合）
    COALESCE(
        json_agg(
            json_build_object(
                'id', t.id,
                'name', t.name,
                'color', t.color
            )
        ) FILTER (WHERE t.id IS NOT NULL), 
        '[]'::json
    ) as tags
FROM workflows w
LEFT JOIN workflow_categories c ON w.category_id = c.id
LEFT JOIN authors a ON w.author_id = a.id
LEFT JOIN workflow_configs wc ON w.id = wc.workflow_id
LEFT JOIN workflow_tag_relations wtr ON w.id = wtr.workflow_id
LEFT JOIN workflow_tags t ON wtr.tag_id = t.id
GROUP BY 
    w.id, w.title, w.description, w.long_description, w.thumbnail_url,
    w.difficulty, w.estimated_time, w.usage_count, w.like_count, w.view_count,
    w.demo_url, w.share_id, w.is_featured, w.is_published, w.version,
    w.created_at, w.updated_at, w.published_at,
    c.name, c.icon, c.color,
    a.name, a.avatar_url, a.is_verified,
    wc.nodes_count, wc.edges_count, wc.variables_count, wc.config_json;

-- 创建统计视图：分类统计
CREATE OR REPLACE VIEW category_stats AS
SELECT 
    c.id,
    c.name,
    c.icon,
    c.color,
    COUNT(w.id) as workflow_count,
    COALESCE(SUM(w.usage_count), 0) as total_usage,
    COALESCE(SUM(w.like_count), 0) as total_likes,
    COALESCE(SUM(w.view_count), 0) as total_views
FROM workflow_categories c
LEFT JOIN workflows w ON c.id = w.category_id AND w.is_published = true
WHERE c.is_active = true
GROUP BY c.id, c.name, c.icon, c.color, c.sort_order
ORDER BY c.sort_order;

-- 创建统计视图：热门标签
CREATE OR REPLACE VIEW popular_tags AS
SELECT 
    t.id,
    t.name,
    t.color,
    COUNT(wtr.workflow_id) as workflow_count,
    COALESCE(SUM(w.usage_count), 0) as total_usage
FROM workflow_tags t
LEFT JOIN workflow_tag_relations wtr ON t.id = wtr.tag_id
LEFT JOIN workflows w ON wtr.workflow_id = w.id AND w.is_published = true
GROUP BY t.id, t.name, t.color
HAVING COUNT(wtr.workflow_id) > 0
ORDER BY workflow_count DESC, total_usage DESC;

-- 创建函数：更新标签使用计数
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE workflow_tags 
        SET usage_count = usage_count + 1 
        WHERE id = NEW.tag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE workflow_tags 
        SET usage_count = GREATEST(usage_count - 1, 0) 
        WHERE id = OLD.tag_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：自动更新标签使用计数
DROP TRIGGER IF EXISTS trigger_update_tag_usage ON workflow_tag_relations;
CREATE TRIGGER trigger_update_tag_usage
    AFTER INSERT OR DELETE ON workflow_tag_relations
    FOR EACH ROW
    EXECUTE FUNCTION update_tag_usage_count();

-- 创建函数：记录用户行为并更新统计
CREATE OR REPLACE FUNCTION record_user_action(
    p_workflow_id VARCHAR(50),
    p_action_type VARCHAR(20),
    p_user_ip VARCHAR(45) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- 插入用户行为记录
    INSERT INTO user_actions (workflow_id, action_type, user_ip, user_agent, referrer)
    VALUES (p_workflow_id, p_action_type, p_user_ip, p_user_agent, p_referrer);
    
    -- 更新工作流统计
    CASE p_action_type
        WHEN 'view' THEN
            UPDATE workflows SET view_count = view_count + 1 WHERE id = p_workflow_id;
        WHEN 'like' THEN
            UPDATE workflows SET like_count = like_count + 1 WHERE id = p_workflow_id;
        WHEN 'copy', 'try' THEN
            UPDATE workflows SET usage_count = usage_count + 1 WHERE id = p_workflow_id;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：搜索工作流
CREATE OR REPLACE FUNCTION search_workflows(
    p_query TEXT DEFAULT NULL,
    p_category_id VARCHAR(50) DEFAULT NULL,
    p_difficulty VARCHAR(20) DEFAULT NULL,
    p_tags INTEGER[] DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_sort_by VARCHAR(20) DEFAULT 'newest'
)
RETURNS TABLE(
    id VARCHAR(50),
    title VARCHAR(200),
    description TEXT,
    category_name VARCHAR(100),
    difficulty VARCHAR(20),
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
    
    IF p_difficulty IS NOT NULL THEN
        where_conditions := array_append(where_conditions, 'w.difficulty = ''' || p_difficulty || '''');
    END IF;
    
    IF p_tags IS NOT NULL AND array_length(p_tags, 1) > 0 THEN
        where_conditions := array_append(where_conditions, 
            'EXISTS (SELECT 1 FROM workflow_tag_relations wtr WHERE wtr.workflow_id = w.id AND wtr.tag_id = ANY(''' || p_tags::text || '''))');
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
               w.difficulty, w.usage_count, w.like_count, w.created_at,
               COUNT(*) OVER() as total_count
        FROM workflows w
        LEFT JOIN workflow_categories c ON w.category_id = c.id
        WHERE ' || array_to_string(where_conditions, ' AND ') || '
        ' || order_clause || '
        LIMIT ' || p_limit || ' OFFSET ' || p_offset;
    
    RETURN QUERY EXECUTE query_sql;
END;
$$ LANGUAGE plpgsql;

-- 数据库初始化完成
SELECT 'FastGPT工作流数据库初始化完成！' as message;
-- 添加用户会话ID支持的数据库迁移脚本

-- 1. 为 user_actions 表添加 user_session_id 列
ALTER TABLE user_actions ADD COLUMN IF NOT EXISTS user_session_id VARCHAR(255);

-- 2. 创建唯一索引防止重复点赞
-- 注意：如果索引已存在，这个命令会失败，但不会影响其他操作
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_actions_unique_like 
ON user_actions (workflow_id, user_session_id) 
WHERE action_type = 'like';

-- 3. 为 user_session_id 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_actions_session_id 
ON user_actions (user_session_id);

-- 4. 创建函数：检查用户是否已点赞
CREATE OR REPLACE FUNCTION check_user_liked(p_workflow_id INTEGER, p_user_session_id VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_actions 
        WHERE workflow_id = p_workflow_id 
        AND user_session_id = p_user_session_id 
        AND action_type = 'like'
    );
END;
$$ LANGUAGE plpgsql;

-- 5. 创建函数：获取工作流点赞信息
CREATE OR REPLACE FUNCTION get_workflow_like_info(p_workflow_id INTEGER, p_user_session_id VARCHAR(255))
RETURNS TABLE(like_count INTEGER, user_liked BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.like_count::INTEGER,
        CASE WHEN ua.id IS NOT NULL THEN TRUE ELSE FALSE END as user_liked
    FROM workflows w
    LEFT JOIN user_actions ua ON w.id = ua.workflow_id 
        AND ua.user_session_id = p_user_session_id 
        AND ua.action_type = 'like'
    WHERE w.id = p_workflow_id;
END;
$$ LANGUAGE plpgsql;
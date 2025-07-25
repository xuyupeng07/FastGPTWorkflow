-- 数据库迁移脚本：添加用户会话ID支持
-- 执行时间：2024年

-- 1. 为user_actions表添加user_session_id字段
ALTER TABLE user_actions 
ADD COLUMN IF NOT EXISTS user_session_id VARCHAR(100);

-- 2. 创建唯一约束防止重复点赞
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_actions_unique_like 
ON user_actions(workflow_id, user_session_id, action_type) 
WHERE action_type = 'like' AND user_session_id IS NOT NULL;

-- 3. 添加用户会话索引
CREATE INDEX IF NOT EXISTS idx_user_actions_session ON user_actions(user_session_id);

-- 4. 创建检查用户是否已点赞的函数
CREATE OR REPLACE FUNCTION check_user_liked(p_workflow_id VARCHAR(50), p_user_session_id VARCHAR(100))
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

-- 5. 创建获取工作流点赞状态的函数
CREATE OR REPLACE FUNCTION get_workflow_like_info(p_workflow_id VARCHAR(50), p_user_session_id VARCHAR(100))
RETURNS TABLE(like_count INTEGER, user_liked BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.like_count,
        check_user_liked(p_workflow_id, p_user_session_id)
    FROM workflows w
    WHERE w.id = p_workflow_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;
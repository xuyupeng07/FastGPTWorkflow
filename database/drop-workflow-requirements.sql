-- 删除 workflow_requirements 表的 SQL 脚本
-- 这个脚本将删除 workflow_requirements 表及其相关索引

-- 1. 删除 workflow_requirements 表的索引
DROP INDEX IF EXISTS idx_requirements_workflow;

-- 2. 删除 workflow_requirements 表
DROP TABLE IF EXISTS workflow_requirements CASCADE;

SELECT 'workflow_requirements表及其相关依赖已成功删除！' as message;
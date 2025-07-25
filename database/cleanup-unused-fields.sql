-- 清理数据库中无关的字段
-- 基于API代码分析，以下字段在当前实现中未被使用

-- 先删除依赖的视图
DROP VIEW IF EXISTS workflow_details CASCADE;
DROP VIEW IF EXISTS category_stats CASCADE;

-- 1. workflows表中的无关字段
-- long_description: API中未使用此字段
-- view_count: API中有此字段但实际未在查询中使用
-- share_id: API中未使用此字段
-- version: API中未使用此字段

ALTER TABLE workflows DROP COLUMN IF EXISTS long_description;
ALTER TABLE workflows DROP COLUMN IF EXISTS view_count;
ALTER TABLE workflows DROP COLUMN IF EXISTS share_id;
ALTER TABLE workflows DROP COLUMN IF EXISTS version;

-- 删除相关的索引
DROP INDEX IF EXISTS idx_workflows_share_id;

-- 2. 删除workflow_configs表（API中未使用）
DROP TABLE IF EXISTS workflow_configs CASCADE;

SELECT '数据库字段清理完成！' as message;
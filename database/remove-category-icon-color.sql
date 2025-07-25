-- 删除分类表中的icon和color字段
-- 数据库连接: postgresql://postgres:bzncrmdw@dbconn.sealoshzh.site:48900/?directConnection=true

BEGIN;

-- 删除icon字段
ALTER TABLE workflow_categories DROP COLUMN IF EXISTS icon;

-- 删除color字段
ALTER TABLE workflow_categories DROP COLUMN IF EXISTS color;

COMMIT;

SELECT 'icon和color字段删除完成' as message;
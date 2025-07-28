import { pool } from '@/lib/db';
import { 
  createSuccessResponse, 
  createErrorResponse
} from '@/lib/api-utils';

// GET /api/admin/categories/[id] - 获取分类详情（管理后台）
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const result = await pool.query(`
      SELECT 
        wc.*,
        COUNT(w.id) as workflow_count
      FROM workflow_categories wc
      LEFT JOIN workflows w ON wc.id = w.category_id
      WHERE wc.id = $1
      GROUP BY wc.id
    `, [id]);
    
    if (result.rows.length === 0) {
      return createErrorResponse('分类不存在', 404);
    }
    
    return createSuccessResponse(result.rows[0]);
  } catch (error) {
    console.error('获取分类详情失败:', error);
    return createErrorResponse('获取分类详情失败');
  }
}

// PUT /api/admin/categories/[id] - 更新分类
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;
    
    if (!name) {
      return createErrorResponse('分类名称不能为空', 400);
    }

    // 检查分类名称是否已存在（排除当前分类）
    const existingCategory = await pool.query(
      'SELECT id FROM workflow_categories WHERE name = $1 AND id != $2',
      [name, id]
    );

    if (existingCategory.rows.length > 0) {
      return createErrorResponse('分类名称已存在', 400);
    }

    // 更新分类
    const result = await pool.query(`
      UPDATE workflow_categories SET
        name = $2,
        description = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, name, description]);

    if (result.rows.length === 0) {
      return createErrorResponse('分类不存在', 404);
    }

    return createSuccessResponse(result.rows[0], '分类更新成功');
  } catch (error) {
    console.error('更新分类失败:', error);
    return createErrorResponse('更新分类失败');
  }
}

// DELETE /api/admin/categories/[id] - 删除分类
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 检查是否有工作流使用此分类
    const workflowCount = await pool.query(
      'SELECT COUNT(*) as count FROM workflows WHERE category_id = $1',
      [id]
    );

    if (parseInt(workflowCount.rows[0].count) > 0) {
      return createErrorResponse('无法删除：该分类下还有工作流', 400);
    }

    // 删除分类
    const result = await pool.query(
      'DELETE FROM workflow_categories WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return createErrorResponse('分类不存在', 404);
    }

    return createSuccessResponse(undefined, '分类删除成功');
  } catch (error) {
    console.error('删除分类失败:', error);
    return createErrorResponse('删除分类失败');
  }
}
import { NextRequest } from 'next/server';
import { pool } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

// GET /api/categories - 获取所有工作流分类
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM workflows w WHERE w.category_id = c.id) as workflow_count
      FROM workflow_categories c
      ORDER BY c.sort_order, c.name
    `);
    
    return createSuccessResponse(result.rows);
  } catch (error) {
    console.error('获取分类失败:', error);
    return createErrorResponse('获取分类失败');
  }
}

// POST /api/categories - 创建新分类
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, icon, color, sort_order } = body;

    // 验证必填字段
    if (!name) {
      return createErrorResponse('分类名称不能为空', 400);
    }

    // 检查分类名称是否已存在
    const existingCategory = await pool.query(
      'SELECT id FROM workflow_categories WHERE name = $1',
      [name]
    );

    if (existingCategory.rows.length > 0) {
      return createErrorResponse('分类名称已存在', 400);
    }

    // 如果没有提供sort_order，则自动计算下一个值
    let finalSortOrder = sort_order;
    if (finalSortOrder === undefined || finalSortOrder === null || finalSortOrder === 0) {
      const maxSortOrderResult = await pool.query(
        'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_sort_order FROM workflow_categories'
      );
      finalSortOrder = maxSortOrderResult.rows[0].next_sort_order;
    }

    const result = await pool.query(`
      INSERT INTO workflow_categories (name, icon, color, sort_order)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, icon, color, finalSortOrder]);

    return createSuccessResponse(result.rows[0], '分类创建成功');
  } catch (error) {
    console.error('创建分类失败:', error);
    return createErrorResponse('创建分类失败');
  }
}
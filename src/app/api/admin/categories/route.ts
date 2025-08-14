import { NextRequest } from 'next/server';
import { pool } from '@/lib/db';
import { 
  createSuccessResponse, 
  createErrorResponse
} from '@/lib/api-utils';

// GET /api/admin/categories - 获取所有分类（管理后台）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    
    let query = `
      SELECT 
        wc.*,
        COUNT(w.id) as workflow_count
      FROM workflow_categories wc
      LEFT JOIN workflows w ON wc.id = w.category_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    // 搜索
    if (search) {
      query += ` AND (wc.name ILIKE $${paramIndex} OR wc.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` GROUP BY wc.id ORDER BY wc.created_at DESC`;
    
    // 分页
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // 获取总数
    let countQuery = `
      SELECT COUNT(*) as total
      FROM workflow_categories wc
      WHERE 1=1
    `;
    
    const countParams: any[] = [];
    let countParamIndex = 1;
    
    if (search) {
      countQuery += ` AND (wc.name ILIKE $${countParamIndex} OR wc.description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    return createSuccessResponse(
      result.rows,
      undefined,
      {
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        total,
        pages: Math.ceil(total / limit)
      }
    );
  } catch (error) {
    console.error('获取管理分类列表失败:', error);
    return createErrorResponse('获取管理分类列表失败');
  }
}

// POST /api/admin/categories - 创建新分类
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;
    
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
    
    // 获取当前最大的sort_order值
    const maxSortOrderResult = await pool.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_sort_order FROM workflow_categories'
    );
    const nextSortOrder = maxSortOrderResult.rows[0].next_sort_order;
    
    // 创建分类，让数据库自动生成 ID
    const result = await pool.query(`
      INSERT INTO workflow_categories (name, description, sort_order, created_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [name, description, nextSortOrder]);

    return createSuccessResponse(result.rows[0], '分类创建成功');
  } catch (error) {
    console.error('创建分类失败:', error);
    return createErrorResponse('创建分类失败');
  }
}
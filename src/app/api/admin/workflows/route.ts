import { NextRequest } from 'next/server';
import { pool } from '@/lib/db';
import { 
  createSuccessResponse, 
  createErrorResponse 
} from '@/lib/api-utils';

// GET /api/admin/workflows - 获取所有工作流列表（包括未发布的）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // 查询所有工作流列表（不过滤is_published）
    let query = `
      SELECT 
        w.*,
        wc.name as category_name,
        a.name as author_name,
        a.avatar_url as author_avatar
      FROM workflows w
      LEFT JOIN workflow_categories wc ON w.category_id = wc.id
      LEFT JOIN authors a ON w.author_id = a.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    // 分类筛选
    if (category && category !== 'all') {
      query += ` AND w.category_id = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    // 搜索
    if (search) {
      query += ` AND (w.title ILIKE $${paramIndex} OR w.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY w.created_at DESC`;
    
    // 分页
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // 为每个工作流格式化数据
    const workflowsWithExtras = result.rows.map(workflow => ({
      ...workflow,
      thumbnail: workflow.thumbnail_url || '/placeholder.svg',
      author: {
        name: workflow.author_name,
        avatar: workflow.author_avatar
      }
    }));
    
    // 总数查询（不过滤is_published）
    let countQuery = `
      SELECT COUNT(*) as total
      FROM workflows w
      WHERE 1=1
    `;
    
    const countParams: any[] = [];
    let countParamIndex = 1;
    
    if (category && category !== 'all') {
      countQuery += ` AND w.category_id = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }
    
    if (search) {
      countQuery += ` AND (w.title ILIKE $${countParamIndex} OR w.description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    return createSuccessResponse(
      workflowsWithExtras,
      undefined,
      {
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        total,
        pages: Math.ceil(total / limit)
      }
    );
  } catch (error) {
    console.error('获取管理员工作流列表失败:', error);
    return createErrorResponse('获取管理员工作流列表失败');
  }
}

// POST /api/admin/workflows - 创建新工作流
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category_id,
      author_id,
      json_source,
      thumbnail_url,
      demo_url,
      is_featured = false,
      is_published = true
    } = body;

    // 验证必填字段
    if (!title || !description || !category_id || !author_id) {
      return createErrorResponse('缺少必填字段', 400);
    }

    // 生成唯一ID
    const id = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();

    const result = await pool.query(`
      INSERT INTO workflows (
        id, title, description, category_id, author_id,
        json_source, thumbnail_url, demo_url, is_featured, is_published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      id, title, description, category_id, author_id,
      json_source, thumbnail_url, demo_url, is_featured, is_published
    ]);

    return createSuccessResponse(result.rows[0], '工作流创建成功');
  } catch (error) {
    console.error('创建工作流失败:', error);
    return createErrorResponse('创建工作流失败');
  }
}
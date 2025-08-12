import { NextRequest } from 'next/server';
import { pool } from '@/lib/db';
import { mysqlQuery } from '@/lib/mysql-db';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  buildPaginationQuery,
  buildSearchCondition,
  withApiHandler 
} from '@/lib/api-utils';

// GET /api/workflows - 获取工作流列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // 查询工作流列表，使用workflows表中的thumbnail_image_id字段
    let query = `
      SELECT 
        w.*,
        wc.name as category_name,
        a.name as author_name,
        a.avatar_url as author_avatar
      FROM workflows w
      LEFT JOIN workflow_categories wc ON w.category_id = wc.id
      LEFT JOIN authors a ON w.author_id = a.id
      WHERE w.is_published = true
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
    
    let result;
    let workflowsWithExtras = [];
    
    // 首先尝试从PostgreSQL获取数据
    try {
      result = await pool.query(query, params);
      
      // 为每个工作流格式化数据，根据thumbnail_image_id生成正确的图片URL
      // 对于SVG图片，直接使用原始图片以保持清晰度
      workflowsWithExtras = await Promise.all(result.rows.map(async workflow => {
      let thumbnailUrl = '/fastgpt.svg';
      
      if (workflow.thumbnail_image_id) {
        // 检查图片类型，如果是SVG则不使用thumbnail variant
        try {
          const imageResult = await pool.query(
            'SELECT mime_type FROM images WHERE id = $1',
            [workflow.thumbnail_image_id]
          );
          
          if (imageResult.rows.length > 0) {
            const mimeType = imageResult.rows[0].mime_type;
            if (mimeType === 'image/svg+xml') {
              // SVG图片直接使用原始图片
              thumbnailUrl = `/api/images/${workflow.thumbnail_image_id}`;
            } else {
              // 其他格式使用thumbnail variant
              thumbnailUrl = `/api/images/${workflow.thumbnail_image_id}?variant=thumbnail`;
            }
          } else {
            // 图片不存在，使用默认图片
            thumbnailUrl = '/fastgpt.svg';
          }
        } catch (error) {
          console.warn('检查图片类型失败:', error);
          // 出错时使用原始图片
          thumbnailUrl = `/api/images/${workflow.thumbnail_image_id}`;
        }
      }
      
      return {
        ...workflow,
        thumbnail: thumbnailUrl,
        author: {
          name: workflow.author_name,
          avatar: workflow.author_avatar
        }
      };
      }));
      
      // 简化的总数查询
      let countQuery = `
        SELECT COUNT(*) as total
        FROM workflows w
        WHERE w.is_published = true
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
       var total = parseInt(countResult.rows[0].total);
       
     } catch (pgError) {
       console.log('PostgreSQL查询失败，尝试MySQL:', pgError);
       
       // 如果PostgreSQL失败，尝试从MySQL获取数据
       try {
         let mysqlQuery_str = 'SELECT * FROM workflow';
         const mysqlParams: any[] = [];
         
         // 构建MySQL查询条件
         const conditions: string[] = [];
         
         if (search) {
           conditions.push('(name LIKE ? OR description LIKE ?)');
           mysqlParams.push(`%${search}%`, `%${search}%`);
         }
         
         if (conditions.length > 0) {
           mysqlQuery_str += ' WHERE ' + conditions.join(' AND ');
         }
         
         mysqlQuery_str += ' ORDER BY id DESC';
         mysqlQuery_str += ` LIMIT ${limit} OFFSET ${(page - 1) * limit}`;
         
         const mysqlResult = await mysqlQuery(mysqlQuery_str, mysqlParams) as any[];
         
         // 转换MySQL数据格式
         workflowsWithExtras = mysqlResult.map(workflow => ({
           id: workflow.id,
           title: workflow.name || '未命名工作流',
           description: workflow.description,
           project_code: workflow.project_code,
           url: workflow.url,
           json_source: workflow.workflow ? JSON.stringify(workflow.workflow) : null,
           config: workflow.workflow,
           created_at: new Date().toISOString(),
           updated_at: new Date().toISOString(),
           thumbnail: '/fastgpt.svg',
           author: {
             name: null,
             avatar: null
           },
           category_name: null,
           author_name: null,
           author_avatar: null
         }));
         
         // 获取总数
         let countQuery_mysql = 'SELECT COUNT(*) as total FROM workflow';
         const countParams_mysql: any[] = [];
         
         if (search) {
           countQuery_mysql += ' WHERE (name LIKE ? OR description LIKE ?)';
           countParams_mysql.push(`%${search}%`, `%${search}%`);
         }
         
         const countResult_mysql = await mysqlQuery(countQuery_mysql, countParams_mysql) as any[];
         total = parseInt(countResult_mysql[0].total);
         
       } catch (mysqlError) {
         console.error('MySQL查询也失败:', mysqlError);
         return createErrorResponse('获取工作流列表失败');
       }
     }
    
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
    console.error('获取工作流列表失败:', error);
    return createErrorResponse('获取工作流列表失败');
  }
}

// POST /api/workflows - 创建新工作流
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category_id,
      author_id,
      json_source,
      thumbnail_image_id,
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
        json_source, thumbnail_image_id, is_featured, is_published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      id, title, description, category_id, author_id,
      json_source, thumbnail_image_id, is_featured, is_published
    ]);

    return createSuccessResponse(result.rows[0], '工作流创建成功');
  } catch (error) {
    console.error('创建工作流失败:', error);
    return createErrorResponse('创建工作流失败');
  }
}
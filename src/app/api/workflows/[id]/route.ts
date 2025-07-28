import { NextRequest } from 'next/server';
import { pool } from '@/lib/db';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  withTransaction,
  validateRequiredFields 
} from '@/lib/api-utils';

// GET /api/workflows/[id] - 获取工作流详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    // 获取工作流基本信息
    const workflowResult = await pool.query(`
      SELECT 
        w.*,
        wc.name as category_name,
        a.name as author_name,
        a.avatar_url as author_avatar,
        a.bio as author_bio
      FROM workflows w
      LEFT JOIN workflow_categories wc ON w.category_id = wc.id
      LEFT JOIN authors a ON w.author_id = a.id
      WHERE w.id = $1
    `, [id]);
    
    if (workflowResult.rows.length === 0) {
      return createErrorResponse('工作流不存在', 404);
    }
    
    const workflow = workflowResult.rows[0];
    
    // 不再需要获取截图、说明等额外信息
    
    // 组装完整的工作流数据
    const fullWorkflow = {
      ...workflow,
      thumbnail: workflow.thumbnail_url || '/placeholder.svg', // 使用thumbnail_url字段
      author: {
        name: workflow.author_name,
        avatar: workflow.author_avatar,
        bio: workflow.author_bio
      }
    };
    
    // 增加使用次数
    await pool.query(`
      UPDATE workflows 
      SET usage_count = usage_count + 1 
      WHERE id = $1
    `, [id]);
    
    return createSuccessResponse(fullWorkflow);
  } catch (error) {
    console.error('获取工作流详情失败:', error);
    return createErrorResponse('获取工作流详情失败');
  }
}

// PUT /api/workflows/[id] - 更新工作流
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,

      category_id,
      demo_url,
      config,
      thumbnail_url,
      is_featured,
      is_published
    } = body;

    const result = await pool.query(`
      UPDATE workflows SET
        title = COALESCE($2, title),
        description = COALESCE($3, description),

        category_id = COALESCE($4, category_id),
         demo_url = COALESCE($5, demo_url),
         config = COALESCE($6, config),
         thumbnail_url = COALESCE($7, thumbnail_url),
         is_featured = COALESCE($8, is_featured),
         is_published = COALESCE($9, is_published),
         updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [
      id, title, description, category_id,
       demo_url,
       config ? JSON.stringify(config) : null,
       thumbnail_url, is_featured, is_published
    ]);

    if (result.rows.length === 0) {
      return createErrorResponse('工作流不存在', 404);
    }

    return createSuccessResponse(result.rows[0], '工作流更新成功');
  } catch (error) {
    console.error('更新工作流失败:', error);
    return createErrorResponse('更新工作流失败');
  }
}

// DELETE /api/workflows/[id] - 删除工作流
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const result = await withTransaction(async (client) => {
      // 不再需要删除截图、说明等额外信息
       // workflow_requirements表不存在，跳过删除
      await client.query('DELETE FROM user_actions WHERE workflow_id = $1', [id]);
      
      // 删除工作流
      const deleteResult = await client.query('DELETE FROM workflows WHERE id = $1 RETURNING *', [id]);
      
      if (deleteResult.rows.length === 0) {
        throw new Error('工作流不存在');
      }
      
      return deleteResult.rows[0];
    });
    
    return createSuccessResponse(undefined, '工作流删除成功');
  } catch (error) {
    console.error('删除工作流失败:', error);
    
    if (error instanceof Error && error.message === '工作流不存在') {
      return createErrorResponse('工作流不存在', 404);
    }
    
    return createErrorResponse('删除工作流失败');
  }
}
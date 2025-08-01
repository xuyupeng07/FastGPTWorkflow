import { NextRequest } from 'next/server';
import { pool } from '@/lib/db';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  withTransaction
} from '@/lib/api-utils';
import imageStorage from '@/lib/imageStorage';

// GET /api/admin/workflows/[id] - 获取工作流详情（管理后台）
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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
    
    // 组装完整的工作流数据
    const fullWorkflow = {
      ...workflow,
      author: {
        name: workflow.author_name,
        avatar: workflow.author_avatar,
        bio: workflow.author_bio
      }
    };
    
    return createSuccessResponse(fullWorkflow);
  } catch (error) {
    console.error('获取工作流详情失败:', error);
    return createErrorResponse('获取工作流详情失败');
  }
}

// PUT /api/admin/workflows/[id] - 更新工作流
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      author_id,
      category_id,
      thumbnail_image_id,
      demo_url,
      is_featured,
      is_published,
      json_source
    } = body;

    const result = await withTransaction(async (client) => {
      // 获取当前工作流信息，用于比较图片变更
      const currentWorkflow = await client.query('SELECT thumbnail_image_id FROM workflows WHERE id = $1', [id]);
      if (currentWorkflow.rows.length === 0) {
        throw new Error('工作流不存在');
      }
      
      const oldThumbnailId = currentWorkflow.rows[0].thumbnail_image_id;
      
      // 如果图片ID发生变化，更新图片关联
      if (thumbnail_image_id !== undefined && thumbnail_image_id !== oldThumbnailId) {
        // 确保 imageStorage 可用
        if (!imageStorage || typeof imageStorage.unlinkImageFromEntity !== 'function') {
          console.error('imageStorage 未正确初始化');
        } else {
          // 先解除旧图片关联
          if (oldThumbnailId) {
            try {
              await imageStorage.unlinkImageFromEntity('workflow', id, 'logo');
            } catch (error) {
              console.error('解除旧图片关联失败:', error);
              // 不中断更新流程
            }
          }

          // 建立新图片关联
          if (thumbnail_image_id) {
            try {
              await imageStorage.linkImageToEntity(thumbnail_image_id, 'workflow', id, { usageType: 'logo', isPrimary: true });
            } catch (error) {
              console.error('建立新图片关联失败:', error);
              // 不中断更新流程
            }
          }
        }
      }

      // 更新工作流基本信息
      const workflowResult = await client.query(`
        UPDATE workflows SET
          title = COALESCE($2, title),
          description = COALESCE($3, description),
          author_id = COALESCE($4, author_id),
          category_id = COALESCE($5, category_id),
          thumbnail_image_id = COALESCE($6, thumbnail_image_id),
          demo_url = COALESCE($7, demo_url),
          is_featured = COALESCE($8, is_featured),
          is_published = COALESCE($9, is_published),
          json_source = COALESCE($10, json_source),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [
        id, title, description, author_id, category_id, thumbnail_image_id, demo_url,
        is_featured, is_published, json_source
      ]);
      
      if (workflowResult.rows.length === 0) {
        throw new Error('工作流不存在');
      }
      
      // 不再需要更新截图、说明等额外信息
      
      return workflowResult.rows[0];
    });

    return createSuccessResponse(result, '工作流更新成功');
  } catch (error) {
    console.error('更新工作流失败:', error);
    
    if (error instanceof Error && error.message === '工作流不存在') {
      return createErrorResponse('工作流不存在', 404);
    }
    
    return createErrorResponse('更新工作流失败');
  }
}

// DELETE /api/admin/workflows/[id] - 删除工作流
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await withTransaction(async (client) => {
      // 不再需要删除截图、说明等额外信息
       // await client.query('DELETE FROM workflow_requirements WHERE workflow_id = $1', [id]); // 表不存在
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
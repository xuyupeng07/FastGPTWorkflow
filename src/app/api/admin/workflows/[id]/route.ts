import { NextRequest } from 'next/server';
import { pool } from '@/lib/db';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  withTransaction
} from '@/lib/api-utils';
import imageStorage from '@/lib/imageStorage';

// GET /api/admin/workflows/[id] - 获取工作流（管理后台）
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
    `, [parseInt(id)]);
    
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
    console.error('获取工作流失败:', error);
    return createErrorResponse('获取工作流失败');
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
    
    // 添加调试日志
    console.log('=== 工作流更新调试信息 ===');
    console.log('工作流ID:', id);
    console.log('接收到的请求体:', JSON.stringify(body, null, 2));
    console.log('no_login_url字段值:', body.no_login_url);
    console.log('no_login_url类型:', typeof body.no_login_url);
    console.log('========================');
    
    const {
      title,
      description,
      author_id,
      category_id,
      thumbnail_image_id,
      demo_url,
      no_login_url,
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
      // 添加更新前的调试日志
      console.log('=== 数据库更新参数 ===');
      console.log('参数数组:', [parseInt(id), title, description, author_id ? parseInt(author_id) : null, category_id ? parseInt(category_id) : null, thumbnail_image_id, demo_url, no_login_url, is_featured, is_published, json_source]);
      console.log('no_login_url参数值:', no_login_url);
      console.log('==================');
      
      const workflowResult = await client.query(`
        UPDATE workflows SET
          title = COALESCE($2, title),
          description = COALESCE($3, description),
          author_id = COALESCE($4, author_id),
          category_id = COALESCE($5, category_id),
          thumbnail_image_id = COALESCE($6, thumbnail_image_id),
          demo_url = COALESCE($7, demo_url),
          no_login_url = COALESCE($8, no_login_url),
          is_featured = COALESCE($9, is_featured),
          is_published = COALESCE($10, is_published),
          json_source = COALESCE($11, json_source),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [
        parseInt(id), title, description, 
        author_id ? parseInt(author_id) : null, 
        category_id ? parseInt(category_id) : null, 
        thumbnail_image_id, demo_url, no_login_url,
        is_featured, is_published, json_source
      ]);
      
      // 添加更新后的调试日志
      console.log('=== 数据库更新结果 ===');
      console.log('更新后的工作流数据:', JSON.stringify(workflowResult.rows[0], null, 2));
      console.log('更新后的no_login_url:', workflowResult.rows[0]?.no_login_url);
      console.log('==================');
      
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
      // 获取工作流信息，用于删除相关短链数据
      const workflowResult = await client.query('SELECT * FROM workflows WHERE id = $1', [parseInt(id)]);
      
      if (workflowResult.rows.length === 0) {
        throw new Error('工作流不存在');
      }
      
      const workflow = workflowResult.rows[0];
      
      // 删除PostgreSQL中的相关数据
      await client.query('DELETE FROM user_actions WHERE workflow_id = $1', [id]);
      
      // 清理图片使用记录
      await client.query('DELETE FROM image_usages WHERE entity_type = $1 AND entity_id = $2', ['workflow', parseInt(id)]);
      
      // 注释：workflow表不存在，移除相关删除操作
      
      // 删除工作流
      const deleteResult = await client.query('DELETE FROM workflows WHERE id = $1 RETURNING *', [parseInt(id)]);
      
      return deleteResult.rows[0];
    });
    
    // 删除MySQL中的短链相关数据
    try {
      const mysql = require('mysql2/promise');
      const mysqlConnection = await mysql.createConnection('mysql://root:bqsqcpp9@dbconn.sealoshzh.site:35853/datafollow');
      
      try {
        // 删除link_info表中的相关记录
        await mysqlConnection.execute('DELETE FROM link_info WHERE project_code = ?', [id]);
        console.log(`已删除MySQL中project_code为${id}的短链记录`);
        
        // 删除workflow表中的相关记录
        await mysqlConnection.execute('DELETE FROM workflow WHERE project_code = ?', [id]);
        console.log(`已删除MySQL中project_code为${id}的workflow记录`);
      } finally {
        await mysqlConnection.end();
      }
    } catch (mysqlError) {
      console.error('删除MySQL中的相关数据失败:', mysqlError);
      // 不中断删除流程，只记录错误
    }
    
    return createSuccessResponse(undefined, '工作流删除成功');
  } catch (error) {
    console.error('删除工作流失败:', error);
    
    if (error instanceof Error && error.message === '工作流不存在') {
      return createErrorResponse('工作流不存在', 404);
    }
    
    return createErrorResponse('删除工作流失败');
  }
}
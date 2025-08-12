import { NextRequest } from 'next/server';
import { pool } from '@/lib/db';
import { mysqlQuery } from '@/lib/mysql-db';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  withTransaction,
  validateRequiredFields 
} from '@/lib/api-utils';

// GET /api/workflows/[id] - 获取工作流
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 首先尝试从PostgreSQL的workflows表获取工作流信息
    let workflow = null;
    let workflowResult;
    
    try {
      workflowResult = await pool.query(`
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
      
      if (workflowResult.rows.length > 0) {
        workflow = workflowResult.rows[0];
      }
    } catch (pgError) {
      console.log('PostgreSQL查询失败，尝试MySQL:', pgError);
    }
    
    // 如果PostgreSQL中没有找到，尝试从MySQL的workflow表获取
    if (!workflow) {
      try {
        const mysqlResult = await mysqlQuery('SELECT * FROM workflow WHERE id = ?', [id]) as any[];
        
        if (mysqlResult.length === 0) {
          return createErrorResponse('工作流不存在', 404);
        }
        
        const mysqlWorkflow = mysqlResult[0];
        
        // 将MySQL数据转换为PostgreSQL格式
        workflow = {
          id: mysqlWorkflow.id,
          title: mysqlWorkflow.name || '未命名工作流',
          description: mysqlWorkflow.description,
          project_code: mysqlWorkflow.project_code,
          url: mysqlWorkflow.url,
          json_source: mysqlWorkflow.workflow ? JSON.stringify(mysqlWorkflow.workflow) : null,
          config: mysqlWorkflow.workflow,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          category_name: null,
          author_name: null,
          author_avatar: null,
          author_bio: null
        };
      } catch (mysqlError) {
        console.error('MySQL查询也失败:', mysqlError);
        return createErrorResponse('工作流不存在', 404);
      }
    }
    
    // 组装完整的工作流数据
    const fullWorkflow = {
      ...workflow,
      thumbnail: workflow.thumbnail_image_id ? `/api/images/${workflow.thumbnail_image_id}?variant=thumbnail` : '/fastgpt.svg',
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

// PUT /api/workflows/[id] - 更新工作流
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
      demo_url,
      config,
      thumbnail_image_id,
      is_featured,
      is_published
    } = body;

    const result = await pool.query(`
      UPDATE workflows SET
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        author_id = COALESCE($4, author_id),
        category_id = COALESCE($5, category_id),
         demo_url = COALESCE($6, demo_url),
         config = COALESCE($7, config),
         thumbnail_image_id = COALESCE($8, thumbnail_image_id),
         is_featured = COALESCE($9, is_featured),
         is_published = COALESCE($10, is_published),
         updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [
      id, title, description, author_id, category_id,
       demo_url,
       config ? JSON.stringify(config) : null,
       thumbnail_image_id, is_featured, is_published
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await withTransaction(async (client) => {
      // 获取工作流信息，用于删除相关短链数据
      const workflowResult = await client.query('SELECT * FROM workflows WHERE id = $1', [id]);
      
      if (workflowResult.rows.length === 0) {
        throw new Error('工作流不存在');
      }
      
      const workflow = workflowResult.rows[0];
      
      // 删除PostgreSQL中的相关数据
      await client.query('DELETE FROM user_actions WHERE workflow_id = $1', [id]);
      
      // 清理图片使用记录
      await client.query('DELETE FROM image_usages WHERE entity_type = $1 AND entity_id = $2', ['workflow', id]);
      
      // 删除workflow表中的记录（如果存在project_code）
      if (workflow.id) {
        try {
          await client.query('DELETE FROM workflow WHERE project_code = $1', [workflow.id]);
          console.log(`已删除workflow表中的记录: ${workflow.id}`);
        } catch (error) {
          console.log('workflow表中没有对应记录或删除失败:', error);
        }
      }
      
      // 删除工作流
      const deleteResult = await client.query('DELETE FROM workflows WHERE id = $1 RETURNING *', [id]);
      
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
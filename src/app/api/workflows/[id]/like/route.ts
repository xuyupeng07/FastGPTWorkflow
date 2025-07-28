import { NextRequest } from 'next/server';
import { pool } from '@/lib/db';
import { createSuccessResponse, createErrorResponse, withTransaction } from '@/lib/api-utils';

// POST /api/workflows/[id]/like - 点赞工作流
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user_session_id } = body;
    
    if (!user_session_id) {
      return createErrorResponse('缺少用户会话ID', 400);
    }
    
    // 检查工作流是否存在
    const workflowCheck = await pool.query('SELECT id FROM workflows WHERE id = $1', [id]);
    if (workflowCheck.rows.length === 0) {
      return createErrorResponse('工作流不存在', 404);
    }
    
    // 检查用户是否已经点赞
    const existingLike = await pool.query(`
      SELECT id FROM user_actions 
      WHERE workflow_id = $1 AND user_session_id = $2 AND action_type = 'like'
    `, [id, user_session_id]);
    
    if (existingLike.rows.length > 0) {
      return createErrorResponse('您已经点赞过这个工作流', 400);
    }
    
    // 开始事务
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 添加点赞记录
      await client.query(`
        INSERT INTO user_actions (workflow_id, user_session_id, action_type)
        VALUES ($1, $2, 'like')
      `, [id, user_session_id]);
      
      // 更新工作流点赞数
      const result = await client.query(`
        UPDATE workflows 
        SET like_count = like_count + 1 
        WHERE id = $1 
        RETURNING like_count
      `, [id]);
      
      await client.query('COMMIT');
      
      return createSuccessResponse({
        liked: true,
        likeCount: parseInt(result.rows[0].like_count)
      }, '点赞成功');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('点赞失败:', error);
    return createErrorResponse('点赞失败');
  }
}

// DELETE /api/workflows/[id]/like - 取消点赞
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const user_session_id = searchParams.get('user_session_id');
    
    if (!user_session_id) {
      return createErrorResponse('缺少用户会话ID', 400);
    }
    
    // 检查用户是否已经点赞
    const existingLike = await pool.query(`
      SELECT id FROM user_actions 
      WHERE workflow_id = $1 AND user_session_id = $2 AND action_type = 'like'
    `, [id, user_session_id]);
    
    if (existingLike.rows.length === 0) {
      return createErrorResponse('您还没有点赞过这个工作流', 400);
    }
    
    // 开始事务
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 删除点赞记录
      await client.query(`
        DELETE FROM user_actions 
        WHERE workflow_id = $1 AND user_session_id = $2 AND action_type = 'like'
      `, [id, user_session_id]);
      
      // 更新工作流点赞数
      const result = await client.query(`
        UPDATE workflows 
        SET like_count = GREATEST(like_count - 1, 0) 
        WHERE id = $1 
        RETURNING like_count
      `, [id]);
      
      await client.query('COMMIT');
      
      return createSuccessResponse({
        liked: false,
        likeCount: parseInt(result.rows[0].like_count)
      }, '取消点赞成功');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('取消点赞失败:', error);
    return createErrorResponse('取消点赞失败');
  }
}
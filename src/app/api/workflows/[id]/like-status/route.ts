import { NextRequest } from 'next/server';
import { pool } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

// GET /api/workflows/[id]/like-status - 检查用户点赞状态
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const user_session_id = searchParams.get('user_session_id');
    
    if (!user_session_id) {
      return createSuccessResponse({
        liked: false,
        like_count: 0
      });
    }
    
    // 获取工作流点赞信息
    const result = await pool.query(`
      SELECT 
        w.like_count,
        CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as user_liked
      FROM workflows w
      LEFT JOIN user_actions ua ON w.id = ua.workflow_id 
        AND ua.user_session_id = $2 
        AND ua.action_type = 'like'
      WHERE w.id = $1
    `, [id, user_session_id]);
    
    if (result.rows.length === 0) {
      return createErrorResponse('工作流不存在', 404);
    }
    
    const { like_count, user_liked } = result.rows[0];
    
    return createSuccessResponse({
      liked: user_liked,
      like_count: parseInt(like_count)
    });
  } catch (error) {
    console.error('获取点赞状态失败:', error);
    return createErrorResponse('获取点赞状态失败');
  }
}
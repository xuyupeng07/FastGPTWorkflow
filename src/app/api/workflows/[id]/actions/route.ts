import { NextRequest } from 'next/server';
import { pool } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

// POST /api/workflows/[id]/actions - 记录用户行为
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action_type, user_session_id } = body;
    
    // 验证action_type
    const validActions = ['view', 'copy', 'download', 'try', 'share'];
    if (!validActions.includes(action_type)) {
      return createErrorResponse('无效的操作类型', 400);
    }
    
    // 检查工作流是否存在
    const workflowCheck = await pool.query('SELECT id FROM workflows WHERE id = $1', [id]);
    if (workflowCheck.rows.length === 0) {
      return createErrorResponse('工作流不存在', 404);
    }
    
    // 获取请求信息
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const userIp = forwarded?.split(',')[0] || realIp || 'unknown';
    const referrer = request.headers.get('referer') || '';
    
    // 记录用户行为
    await pool.query(`
      INSERT INTO user_actions (workflow_id, action_type, user_session_id, user_ip, user_agent, referrer)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [id, action_type, user_session_id, userIp, userAgent, referrer]);
    
    // 对于某些操作，更新工作流统计
    if (action_type === 'copy' || action_type === 'try' || action_type === 'download') {
      await pool.query(`
        UPDATE workflows 
        SET usage_count = COALESCE(usage_count, 0) + 1 
        WHERE id = $1
      `, [id]);
    }
    
    return createSuccessResponse({ success: true }, '操作记录成功');
  } catch (error) {
    console.error('记录用户行为失败:', error);
    return createErrorResponse('记录用户行为失败');
  }
}
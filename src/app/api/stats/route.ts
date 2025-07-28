// NextResponse import removed as we now use api-utils
import { pool } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

// GET /api/stats - 获取统计数据
export async function GET() {
  try {
    // 获取工作流总数
    const totalWorkflowsResult = await pool.query(
      'SELECT COUNT(*) as total FROM workflows WHERE is_published = true'
    );
    const totalWorkflows = parseInt(totalWorkflowsResult.rows[0].total);

    // 获取分类统计
    const categoryStatsResult = await pool.query(`
      SELECT 
        wc.id as category_id,
        wc.name as category_name,
        COUNT(w.id) as workflow_count
      FROM workflow_categories wc
      LEFT JOIN workflows w ON wc.id = w.category_id AND w.is_published = true
      GROUP BY wc.id, wc.name
      ORDER BY workflow_count DESC, wc.name
    `);

    // 获取最近活动统计
    const recentActivitiesResult = await pool.query(`
      SELECT 
        action_type,
        COUNT(*) as count
      FROM user_actions
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY action_type
      ORDER BY count DESC
    `);

    // 获取热门工作流
    const popularWorkflowsResult = await pool.query(`
      SELECT 
        w.id,
        w.title,
        w.usage_count,
        w.like_count,
        wc.name as category_name
      FROM workflows w
      LEFT JOIN workflow_categories wc ON w.category_id = wc.id
      WHERE w.is_published = true
      ORDER BY w.usage_count DESC, w.like_count DESC
      LIMIT 10
    `);

    return createSuccessResponse({
      total_workflows: totalWorkflows,
      category_stats: categoryStatsResult.rows,
      recent_activities: recentActivitiesResult.rows,
      popular_workflows: popularWorkflowsResult.rows
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return createErrorResponse('获取统计数据失败');
  }
}
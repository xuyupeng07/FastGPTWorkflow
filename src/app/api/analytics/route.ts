import { NextRequest, NextResponse } from 'next/server';
import { mysqlQuery } from '../../../lib/mysql-db';

// 获取统计汇总数据
async function getAnalyticsSummary() {
  const rows = await mysqlQuery('SELECT * FROM analytics_summary');
  return rows;
}

// 获取UTM参数统计
async function getUTMAnalytics() {
  const rows = await mysqlQuery('SELECT * FROM utm_analytics ORDER BY total_clicks DESC');
  return rows;
}

// 获取每日统计
async function getDailyAnalytics(days: number = 30) {
  const rows = await mysqlQuery(
    'SELECT * FROM daily_analytics WHERE click_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) ORDER BY click_date DESC',
    [days]
  );
  return rows;
}

// 获取平台效果统计
async function getPlatformPerformance() {
  const rows = await mysqlQuery('SELECT * FROM platform_performance ORDER BY total_clicks DESC');
  return rows;
}

// 获取特定链接的点击详情
async function getLinkClickDetails(linkId: string, limit: number = 100) {
  const rows = await mysqlQuery(
    `SELECT 
      ca.clicked_at,
      ca.ip_address,
      ca.user_agent,
      ca.referer,
      ca.utm_source,
      ca.utm_medium,
      ca.utm_content,
      ca.utm_campaign,
      ca.utm_workflow,
      li.short_url,
      li.long_url
    FROM click_analytics ca
    JOIN link_info li ON ca.link_id = li.id
    WHERE ca.link_id = ?
    ORDER BY ca.clicked_at DESC
    LIMIT ?`,
    [linkId, limit]
  );
  return rows;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const linkId = searchParams.get('linkId');
    const days = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '100');

    try {
      let data;

      switch (type) {
        case 'summary':
          data = await getAnalyticsSummary();
          break;
        case 'utm':
          data = await getUTMAnalytics();
          break;
        case 'daily':
          data = await getDailyAnalytics(days);
          break;
        case 'platform':
          data = await getPlatformPerformance();
          break;
        case 'details':
          if (!linkId) {
            return NextResponse.json({ error: 'linkId is required for details' }, { status: 400 });
          }
          data = await getLinkClickDetails(linkId, limit);
          break;
        default:
          // 默认返回汇总数据
          const uniqueVisitorsResult = await mysqlQuery('SELECT COUNT(DISTINCT ip_address) as count FROM click_analytics');
          data = {
            summary: await getAnalyticsSummary(),
            utm: await getUTMAnalytics(),
            platform: await getPlatformPerformance(),
            uniqueVisitors: (uniqueVisitorsResult as any[])[0]?.count || 0
          };
      }

      return NextResponse.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Analytics API] 查询统计数据失败:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Analytics API] 查询统计数据失败:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { mysqlQuery } from '../../../../lib/mysql-db';

// 获取客户端IP地址
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { linkId, utmSource, utmMedium, utmContent, utmCampaign, utmWorkflow } = body;
    
    if (!linkId) {
      return NextResponse.json({ error: 'linkId is required' }, { status: 400 });
    }
    
    // 获取访问者信息
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    
    // 记录点击统计
    await mysqlQuery(
      `INSERT INTO click_analytics (
        link_id, ip_address, user_agent, referer, 
        utm_source, utm_medium, utm_content, utm_campaign, utm_workflow
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        linkId, ipAddress, userAgent, referer,
        utmSource || null, utmMedium || null, utmContent || null,
        utmCampaign || null, utmWorkflow || null
      ]
    );
    
    return NextResponse.json({
      success: true,
      message: 'Click recorded successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Click API] 记录点击失败:', error);
    return NextResponse.json(
      { error: 'Failed to record click' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('linkId');
    
    if (!linkId) {
      return NextResponse.json({ error: 'linkId is required' }, { status: 400 });
    }
    
    // 获取特定链接的点击统计
    const clickCount = await mysqlQuery(
      'SELECT COUNT(*) as count FROM click_analytics WHERE link_id = ?',
      [linkId]
    );
    
    const uniqueVisitors = await mysqlQuery(
      'SELECT COUNT(DISTINCT ip_address) as count FROM click_analytics WHERE link_id = ?',
      [linkId]
    );
    
    return NextResponse.json({
      success: true,
      data: {
        linkId,
        totalClicks: (clickCount as any[])[0]?.count || 0,
        uniqueVisitors: (uniqueVisitors as any[])[0]?.count || 0
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Click API] 获取点击统计失败:', error);
    return NextResponse.json(
      { error: 'Failed to fetch click statistics' },
      { status: 500 }
    );
  }
} 
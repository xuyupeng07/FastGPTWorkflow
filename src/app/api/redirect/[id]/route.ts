import { NextRequest, NextResponse } from 'next/server';
import { mysqlQuery } from '@/lib/mysql-db';

// 提取UTM参数的辅助函数
function extractUTMParams(url: string) {
  try {
    const urlObj = new URL(url);
    return {
      utm_source: urlObj.searchParams.get('utm_source'),
      utm_medium: urlObj.searchParams.get('utm_medium'),
      utm_content: urlObj.searchParams.get('utm_content'),
      utm_campaign: urlObj.searchParams.get('utm_campaign'),
      utm_workflow: urlObj.searchParams.get('utm_workflow')
    };
  } catch (error) {
    // 如果URL解析失败，返回默认值
    return {
      utm_source: null,
      utm_medium: null,
      utm_content: null,
      utm_campaign: null,
      utm_workflow: null
    };
  }
}

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 查询短链对应的长链接
    const rows = await mysqlQuery(
      'SELECT id, long_url FROM link_info WHERE id = ? LIMIT 1',
      [id]
    ) as any[];
    
    if (rows && rows.length > 0) {
      const linkId = rows[0].id;
      const longUrl = rows[0].long_url;
      
      // 提取UTM参数
      const utmParams = extractUTMParams(longUrl);
      
      // 获取访问者信息
      const ipAddress = getClientIP(request);
      const userAgent = request.headers.get('user-agent') || '';
      const referer = request.headers.get('referer') || '';
      
      // 记录点击统计（异步执行，不阻塞重定向）
      mysqlQuery(
        `INSERT INTO click_analytics (
          link_id, ip_address, user_agent, referer, 
          utm_source, utm_medium, utm_content, utm_campaign, utm_workflow
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          linkId, ipAddress, userAgent, referer,
          utmParams.utm_source, utmParams.utm_medium, utmParams.utm_content,
          utmParams.utm_campaign, utmParams.utm_workflow
        ]
      ).catch((error: any) => {
        console.error('[点击统计] 记录失败:', error);
      });
      
      console.log(`短链重定向: ${id} -> ${longUrl}`);
      // 返回重定向响应
      return NextResponse.redirect(longUrl, { status: 307 });
    } else {
      console.log(`短链不存在: ${id}`);
      // 如果找不到对应的短链，重定向到首页
      return NextResponse.redirect('https://qktyoucivudx.sealoshzh.site/', { status: 307 });
    }
  } catch (error) {
    console.error('短链重定向失败:', error);
    // 出错时重定向到首页
    return NextResponse.redirect('https://qktyoucivudx.sealoshzh.site/', { status: 307 });
  }
}
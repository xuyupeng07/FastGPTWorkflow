import { NextRequest, NextResponse } from 'next/server';

async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  console.log(`[中间件] 处理路径: ${path}`);
  
  // 跳过API路由、静态资源和主页
  if (
    path.startsWith('/api') || 
    path.startsWith('/_next') || 
    path.startsWith('/favicon') || 
    path.startsWith('/public') || 
    path === '/' ||
    path.startsWith('/admin') ||
    path.startsWith('/workflow') ||
    path.startsWith('/socket.io')
  ) {
    console.log(`[中间件] 跳过处理: ${path}`);
    return NextResponse.next();
  }
  
  // 检查是否为短链格式（纯数字）
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 1 && Number.isInteger(parseInt(segments[0]))) {
    const shortLinkId = segments[0];
    
    console.log(`[中间件] 检测到短链格式: ${shortLinkId}`);
    
    // 构建到API路由的URL
    const redirectApiUrl = new URL(`/api/redirect/${encodeURIComponent(shortLinkId)}`, request.url);
    console.log(`[中间件] 重定向到API路由: ${redirectApiUrl.toString()}`);
    
    // 重定向到API路由处理
    return NextResponse.redirect(redirectApiUrl);
  }
  
  console.log('[中间件] 允许继续访问');
  return NextResponse.next();
}

export default middleware;

export const config = {
  matcher: [
    // 匹配所有路径，除了API路由、静态文件等
    '/((?!api|_next|favicon.ico|public).*)',
  ]
};
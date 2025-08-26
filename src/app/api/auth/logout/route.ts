import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 从Authorization header或cookie中获取token
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('auth_token')?.value;
    
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }
    
    // 注意：即使没有token也允许登出，因为可能是清除客户端状态
    console.log('用户注销成功', token ? '(有token)' : '(无token)');
    
    // 创建响应并清除cookie
    const response = NextResponse.json({
      success: true,
      message: '注销成功'
    });
    
    // 清除认证cookie
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0 // 立即过期
    });
    
    return response;
    
  } catch (error: any) {
    console.error('注销API错误:', error);
    
    // 即使出错也返回成功，因为登出主要是清除客户端状态
    const response = NextResponse.json({
      success: true,
      message: '注销成功'
    });
    
    // 确保清除cookie
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    });
    
    return response;
  }
}

// 处理OPTIONS请求（CORS预检）
export async function OPTIONS() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://demo.fastgpt.cn'];
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigins[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
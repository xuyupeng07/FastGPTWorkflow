import { NextRequest, NextResponse } from 'next/server';
import { deleteUserSession } from '@/lib/auth';

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
    
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: '未找到有效的认证令牌'
        },
        { status: 401 }
      );
    }
    
    // 删除用户会话
    await deleteUserSession(token);
    
    console.log('用户注销成功');
    
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
    
    return NextResponse.json(
      {
        success: false,
        message: '注销失败，请稍后重试'
      },
      { status: 500 }
    );
  }
}

// 处理OPTIONS请求（CORS预检）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
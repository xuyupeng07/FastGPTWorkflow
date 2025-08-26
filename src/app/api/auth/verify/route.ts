import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, getUserById } from '@/lib/auth';

export async function GET(request: NextRequest) {
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
          message: '未找到有效的认证令牌',
          authenticated: false
        },
        { status: 401 }
      );
    }
    
    // 验证JWT令牌
    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          message: '认证令牌无效或已过期',
          authenticated: false
        },
        { status: 401 }
      );
    }
    
    // 根据JWT载荷获取用户信息
    const user = await getUserById(payload.userId);
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: '认证令牌无效或已过期',
          authenticated: false
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '认证有效',
      authenticated: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          last_login: user.last_login
        }
      }
    });
    
  } catch (error: any) {
    console.error('验证API错误:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '验证失败，请稍后重试',
        authenticated: false
      },
      { status: 500 }
    );
  }
}

// 处理OPTIONS请求（CORS预检）
export async function OPTIONS() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://demo.fastgpt.cn'];
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigins[0],
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, LoginCredentials } from '@/lib/auth';
import { z } from 'zod';

// 登录请求验证schema
const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空').max(50, '用户名长度不能超过50个字符'),
  password: z.string().min(1, '密码不能为空')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证请求数据
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: '请求数据格式错误',
          errors: validationResult.error.issues
        },
        { status: 400 }
      );
    }
    
    const credentials: LoginCredentials = validationResult.data;
    
    // 获取客户端IP和User-Agent（用于安全日志）
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // 记录登录尝试（不包含敏感信息）
    console.log(`登录尝试来自: ${clientIP}`);
    
    // 验证用户凭据
    const authResult = await authenticateUser(credentials);
    
    if (!authResult) {
      // 不记录具体用户名，避免信息泄露
      console.log(`登录失败来自: ${clientIP}`);
      return NextResponse.json(
        {
          success: false,
          message: '用户名或密码错误'
        },
        { status: 401 }
      );
    }
    
    const { user, token } = authResult;
    
    // 记录成功登录（可以包含用户名，因为已验证）
    console.log(`用户 ${user.username} 登录成功`);
    
    // 创建响应
    const response = NextResponse.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          last_login: user.last_login
        },
        token
      }
    });
    
    // 设置HTTP-only cookie（可选，提供额外的安全性）
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24小时
    });
    
    return response;
    
  } catch (error: any) {
    // 记录错误但不暴露详细信息
    console.error('登录API错误:', {
      message: error.message,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });
    
    // 处理特定的错误类型，统一错误消息格式
    if (error.message.includes('账号已被锁定')) {
      return NextResponse.json(
        {
          success: false,
          message: '账号暂时被锁定，请稍后重试'
        },
        { status: 423 }
      );
    }
    
    if (error.message.includes('密码错误')) {
      return NextResponse.json(
        {
          success: false,
          message: '用户名或密码错误'
        },
        { status: 401 }
      );
    }
    
    if (error.message === '账户已被禁用') {
      return NextResponse.json(
        {
          success: false,
          message: '账号状态异常，请联系管理员'
        },
        { status: 403 }
      );
    }
    
    // 通用错误响应，不暴露内部错误信息
    return NextResponse.json(
      {
        success: false,
        message: '服务暂时不可用，请稍后重试'
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
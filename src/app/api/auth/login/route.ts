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
    
    console.log(`登录尝试: ${credentials.username} from ${clientIP}`);
    
    // 验证用户凭据
    const authResult = await authenticateUser(credentials);
    
    if (!authResult) {
      console.log(`登录失败: ${credentials.username} - 用户名或密码错误`);
      return NextResponse.json(
        {
          success: false,
          message: '用户名或密码错误'
        },
        { status: 401 }
      );
    }
    
    const { user, token } = authResult;
    
    console.log(`登录成功: ${user.username} (${user.role})`);
    
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
    console.error('登录API错误:', error);
    
    // 处理特定的错误类型
    if (error.message === '账号已被禁用，请联系管理员') {
      return NextResponse.json(
        {
          success: false,
          message: '账号已被禁用，请联系管理员'
        },
        { status: 403 }
      );
    }
    
    if (error.message === '账户已被禁用') {
      return NextResponse.json(
        {
          success: false,
          message: '账号已被禁用，请联系管理员'
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        message: '登录失败，请稍后重试'
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
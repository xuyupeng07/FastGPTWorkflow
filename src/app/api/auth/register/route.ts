import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { pool } from '@/lib/db';

// 注册请求验证schema
const registerSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(20, '用户名最多20个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6个字符').max(50, '密码最多50个字符'),
  inviteCode: z.string().min(1, '邀请码不能为空'),
});

// 使用共享的数据库连接池（已配置正确的schema）

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证请求数据
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: '请求数据格式错误',
        errors: validationResult.error.issues.map(issue => issue.message)
      }, { status: 400 });
    }

    const { username, email, password, inviteCode } = validationResult.data;

    // 验证邀请码
    const validInviteCode = process.env.REGISTRATION_INVITE_CODE;
    if (!validInviteCode || inviteCode !== validInviteCode) {
      return NextResponse.json({
        success: false,
        message: '邀请码无效'
      }, { status: 400 });
    }

    // 检查用户名和邮箱是否已存在
    const existingUserQuery = 'SELECT id FROM users WHERE username = $1 OR email = $2';
    const existingUserResult = await pool.query(existingUserQuery, [username, email]);
    
    if (existingUserResult.rows.length > 0) {
      return NextResponse.json({
        success: false,
        message: '用户名或邮箱已存在'
      }, { status: 400 });
    }

    // 加密密码
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 创建新用户
    const insertUserQuery = `
      INSERT INTO users (username, email, password_hash, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, username, email, role, is_active, created_at
    `;
    
    const newUserResult = await pool.query(insertUserQuery, [
      username,
      email,
      hashedPassword,
      'user', // 默认角色为普通用户
      true    // 注册后直接激活
    ]);

    const newUser = newUserResult.rows[0];

    return NextResponse.json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          is_active: newUser.is_active,
          created_at: newUser.created_at
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('注册失败:', error);
    
    // 检查是否是数据库约束错误
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json({
        success: false,
        message: '用户名或邮箱已存在'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: '注册失败，请稍后重试'
    }, { status: 500 });
  }
}
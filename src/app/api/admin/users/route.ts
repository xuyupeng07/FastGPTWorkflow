import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  withTransaction
} from '@/lib/api-utils';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// 用户创建验证schema
const createUserSchema = z.object({
  username: z.string().min(1, '用户名不能为空').max(50, '用户名长度不能超过50个字符'),
  email: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, {
    message: '邮箱格式不正确'
  }),
  password: z.string().min(6, '密码长度至少6个字符'),
  role: z.enum(['admin', 'user']),
  is_active: z.boolean().optional().default(true)
});

// 用户更新验证schema
const updateUserSchema = z.object({
  username: z.string().min(1, '用户名不能为空').max(50, '用户名长度不能超过50个字符').optional(),
  email: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, {
    message: '邮箱格式不正确'
  }),
  password: z.string().min(6, '密码长度至少6个字符').optional(),
  role: z.enum(['admin', 'user']).optional(),
  is_active: z.boolean().optional()
});

// GET /api/admin/users - 获取用户列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const is_active = searchParams.get('is_active');
    
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;
    
    if (search) {
      whereConditions.push(`(username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    if (role) {
      whereConditions.push(`role = $${paramIndex}`);
      queryParams.push(role);
      paramIndex++;
    }
    
    if (is_active !== null && is_active !== '') {
      whereConditions.push(`is_active = $${paramIndex}`);
      queryParams.push(is_active === 'true');
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // 获取用户列表
    const usersQuery = `
      SELECT 
        id, username, email, role, is_active, 
        created_at, updated_at, last_login,
        login_attempts, locked_until
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const usersResult = await pool.query(usersQuery, [...queryParams, limit, offset]);
    
    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);
    
    return createSuccessResponse({
      users: usersResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return createErrorResponse('获取用户列表失败');
  }
}

// POST /api/admin/users - 创建新用户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证请求数据
    const validatedData = createUserSchema.parse(body);
    
    return await withTransaction(async (client) => {
      // 检查用户名是否已存在
      const existingUser = await client.query(
        'SELECT id FROM users WHERE username = $1',
        [validatedData.username]
      );
      
      if (existingUser.rows.length > 0) {
        throw new Error('用户名已存在');
      }
      
      // 检查邮箱是否已存在（如果提供了邮箱）
      if (validatedData.email) {
        const existingEmail = await client.query(
          'SELECT id FROM users WHERE email = $1',
          [validatedData.email]
        );
        
        if (existingEmail.rows.length > 0) {
          throw new Error('邮箱已存在');
        }
      }
      
      // 加密密码
      const hashedPassword = await bcrypt.hash(validatedData.password, 12);
      
      // 创建用户
      const result = await client.query(
        `INSERT INTO users (username, email, password_hash, role, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id, username, email, role, is_active, created_at, updated_at`,
        [
          validatedData.username,
          validatedData.email || null,
          hashedPassword,
          validatedData.role,
          validatedData.is_active
        ]
      );
      
      return createSuccessResponse({
        user: result.rows[0],
        message: '用户创建成功'
      });
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        error.issues.map((e: any) => e.message).join(', '),
        400
      );
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400);
    }
    
    return createErrorResponse('创建用户失败');
  }
}

// PUT /api/admin/users - 批量更新用户状态
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userIds, action } = body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return createErrorResponse('请选择要操作的用户', 400);
    }
    
    return await withTransaction(async (client) => {
      let query = '';
      let params = [];
      
      switch (action) {
        case 'activate':
          query = 'UPDATE users SET is_active = true, updated_at = NOW() WHERE id = ANY($1)';
          params = [userIds];
          break;
        case 'deactivate':
          query = 'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = ANY($1)';
          params = [userIds];
          break;
        case 'unlock':
          query = 'UPDATE users SET login_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE id = ANY($1)';
          params = [userIds];
          break;
        default:
          throw new Error('无效的操作类型');
      }
      
      const result = await client.query(query, params);
      
      return createSuccessResponse({
        message: `成功操作 ${result.rowCount} 个用户`,
        affectedCount: result.rowCount
      });
    });
  } catch (error) {
    console.error('批量更新用户失败:', error);
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400);
    }
    
    return createErrorResponse('批量更新用户失败');
  }
}
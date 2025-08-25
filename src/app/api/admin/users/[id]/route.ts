import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  withTransaction
} from '@/lib/api-utils';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

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

// GET /api/admin/users/[id] - 获取单个用户详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const result = await pool.query(
      `SELECT 
        id, username, email, role, is_active, 
        created_at, updated_at, last_login,
        login_attempts, locked_until
       FROM users 
       WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return createErrorResponse('用户不存在', 404);
    }
    
    return createSuccessResponse({
      user: result.rows[0]
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    return createErrorResponse('获取用户详情失败');
  }
}

// PUT /api/admin/users/[id] - 更新用户信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // 验证请求数据
    const validatedData = updateUserSchema.parse(body);
    
    return await withTransaction(async (client) => {
      // 检查用户是否存在
      const existingUser = await client.query(
        'SELECT id, username, email FROM users WHERE id = $1',
        [id]
      );
      
      if (existingUser.rows.length === 0) {
        throw new Error('用户不存在');
      }
      
      const currentUser = existingUser.rows[0];
      
      // 检查用户名是否已被其他用户使用
      if (validatedData.username && validatedData.username !== currentUser.username) {
        const usernameCheck = await client.query(
          'SELECT id FROM users WHERE username = $1 AND id != $2',
          [validatedData.username, id]
        );
        
        if (usernameCheck.rows.length > 0) {
          throw new Error('用户名已被其他用户使用');
        }
      }
      
      // 检查邮箱是否已被其他用户使用
      if (validatedData.email && validatedData.email !== currentUser.email) {
        const emailCheck = await client.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [validatedData.email, id]
        );
        
        if (emailCheck.rows.length > 0) {
          throw new Error('邮箱已被其他用户使用');
        }
      }
      
      // 构建更新字段
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;
      
      if (validatedData.username !== undefined) {
        updateFields.push(`username = $${paramIndex}`);
        updateValues.push(validatedData.username);
        paramIndex++;
      }
      
      if (validatedData.email !== undefined) {
        updateFields.push(`email = $${paramIndex}`);
        updateValues.push(validatedData.email);
        paramIndex++;
      }
      
      if (validatedData.password !== undefined) {
        const hashedPassword = await bcrypt.hash(validatedData.password, 12);
        updateFields.push(`password_hash = $${paramIndex}`);
        updateValues.push(hashedPassword);
        paramIndex++;
      }
      
      if (validatedData.role !== undefined) {
        updateFields.push(`role = $${paramIndex}`);
        updateValues.push(validatedData.role);
        paramIndex++;
      }
      
      if (validatedData.is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex}`);
        updateValues.push(validatedData.is_active);
        paramIndex++;
      }
      
      if (updateFields.length === 0) {
        throw new Error('没有提供要更新的字段');
      }
      
      // 添加更新时间
      updateFields.push(`updated_at = NOW()`);
      updateValues.push(id);
      
      const updateQuery = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, username, email, role, is_active, created_at, updated_at, last_login
      `;
      
      const result = await client.query(updateQuery, updateValues);
      
      return createSuccessResponse({
        user: result.rows[0],
        message: '用户信息更新成功'
      });
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        error.issues.map((e: any) => e.message).join(', '),
        400
      );
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400);
    }
    
    return createErrorResponse('更新用户失败');
  }
}

// DELETE /api/admin/users/[id] - 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    return await withTransaction(async (client) => {
      // 检查用户是否存在
      const existingUser = await client.query(
        'SELECT id, username, role FROM users WHERE id = $1',
        [id]
      );
      
      if (existingUser.rows.length === 0) {
        throw new Error('用户不存在');
      }
      
      const user = existingUser.rows[0];
      
      // 检查是否是最后一个管理员
      if (user.role === 'admin') {
        const adminCount = await client.query(
          'SELECT COUNT(*) as count FROM users WHERE role = $1 AND is_active = true',
          ['admin']
        );
        
        if (parseInt(adminCount.rows[0].count) <= 1) {
          throw new Error('不能删除最后一个管理员用户');
        }
      }
      
      // 删除用户
      const result = await client.query(
        'DELETE FROM users WHERE id = $1',
        [id]
      );
      
      return createSuccessResponse({
        message: `用户 "${user.username}" 删除成功`,
        deletedUserId: id
      });
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400);
    }
    
    return createErrorResponse('删除用户失败');
  }
}
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { pool } from './db';

// JWT密钥，生产环境应该使用环境变量
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// 用户接口定义
export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

// 登录凭据接口
export interface LoginCredentials {
  username: string;
  password: string;
}

// JWT载荷接口
export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

// 会话接口
export interface UserSession {
  id: number;
  user_id: number;
  session_token: string;
  expires_at: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * 密码哈希
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * 生成JWT令牌
 */
export function generateJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

/**
 * 验证JWT令牌
 */
export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('JWT验证失败:', error);
    return null;
  }
}

/**
 * 根据用户名获取用户
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const dbPool = pool;
  
  try {
    const result = await dbPool.query(
      'SELECT id, username, email, password_hash, role, is_active, created_at, updated_at, last_login FROM users WHERE username = $1 AND is_active = true',
      [username]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login
    };
  } catch (error) {
    console.error('获取用户失败:', error);
    throw error;
  }
}

/**
 * 根据用户ID获取用户
 */
export async function getUserById(userId: number): Promise<User | null> {
  const dbPool = pool;
  
  try {
    const result = await dbPool.query(
      'SELECT id, username, email, role, is_active, created_at, updated_at, last_login FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login
    };
  } catch (error) {
    console.error('获取用户失败:', error);
    throw error;
  }
}

/**
 * 验证用户登录
 */
export async function authenticateUser(credentials: LoginCredentials): Promise<{ user: User; token: string } | null> {
  const dbPool = pool;
  
  try {
    // 获取用户信息（包括密码哈希）
    const result = await dbPool.query(
      'SELECT id, username, email, password_hash, role, is_active, created_at, updated_at, last_login, login_attempts, locked_until FROM users WHERE username = $1',
      [credentials.username]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const userRecord = result.rows[0];
    
    // 检查用户是否被锁定
    if (userRecord.locked_until && new Date(userRecord.locked_until) > new Date()) {
      throw new Error('账户已被锁定，请稍后再试');
    }
    
    // 检查用户是否激活
    if (!userRecord.is_active) {
      throw new Error('账户已被禁用');
    }
    
    // 验证密码
    const isPasswordValid = await verifyPassword(credentials.password, userRecord.password_hash);
    
    if (!isPasswordValid) {
      // 增加登录失败次数
      const newAttempts = (userRecord.login_attempts || 0) + 1;
      let lockedUntil = null;
      
      // 如果失败次数超过5次，锁定账户30分钟
      if (newAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30分钟后
      }
      
      await dbPool.query(
        'UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3',
        [newAttempts, lockedUntil, userRecord.id]
      );
      
      if (lockedUntil) {
        throw new Error('登录失败次数过多，账户已被锁定30分钟');
      }
      
      return null;
    }
    
    // 登录成功，重置登录失败次数并更新最后登录时间
    await dbPool.query(
      'UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [userRecord.id]
    );
    
    // 构建用户对象
    const user: User = {
      id: userRecord.id,
      username: userRecord.username,
      email: userRecord.email,
      role: userRecord.role,
      is_active: userRecord.is_active,
      created_at: userRecord.created_at,
      updated_at: userRecord.updated_at,
      last_login: userRecord.last_login
    };
    
    // 生成JWT令牌
    const token = generateJWT({
      userId: user.id,
      username: user.username,
      role: user.role
    });
    
    return { user, token };
    
  } catch (error) {
    console.error('用户认证失败:', error);
    throw error;
  }
}

/**
 * 创建用户会话
 */
export async function createUserSession(
  userId: number,
  sessionToken: string,
  expiresAt: Date,
  ipAddress?: string,
  userAgent?: string
): Promise<UserSession> {
  const dbPool = pool;
  
  try {
    const result = await dbPool.query(
      'INSERT INTO user_sessions (user_id, session_token, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, sessionToken, expiresAt, ipAddress, userAgent]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('创建用户会话失败:', error);
    throw error;
  }
}

/**
 * 验证用户会话
 */
export async function validateUserSession(sessionToken: string): Promise<User | null> {
  const dbPool = pool;
  
  try {
    const result = await dbPool.query(
      `SELECT u.id, u.username, u.email, u.role, u.is_active, u.created_at, u.updated_at, u.last_login
       FROM user_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.session_token = $1 AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = true`,
      [sessionToken]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('验证用户会话失败:', error);
    throw error;
  }
}

/**
 * 删除用户会话
 */
export async function deleteUserSession(sessionToken: string): Promise<void> {
  const dbPool = pool;
  
  try {
    await dbPool.query('DELETE FROM user_sessions WHERE session_token = $1', [sessionToken]);
  } catch (error) {
    console.error('删除用户会话失败:', error);
    throw error;
  }
}

/**
 * 清理过期会话
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const dbPool = pool;
  
  try {
    const result = await dbPool.query('DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP');
    return result.rowCount || 0;
  } catch (error) {
    console.error('清理过期会话失败:', error);
    throw error;
  }
}

/**
 * 检查用户是否为管理员
 */
export function isAdmin(user: User): boolean {
  return user.role === 'admin';
}

/**
 * 从请求头中提取JWT令牌
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // 移除 "Bearer " 前缀
}

/**
 * 验证管理员权限
 */
export async function requireAdmin(token: string): Promise<User> {
  const payload = verifyJWT(token);
  if (!payload) {
    throw new Error('无效的认证令牌');
  }
  
  const user = await getUserById(payload.userId);
  if (!user) {
    throw new Error('用户不存在');
  }
  
  if (!isAdmin(user)) {
    throw new Error('需要管理员权限');
  }
  
  return user;
}
import { NextResponse } from 'next/server';
import { pool } from './db';

/**
 * 标准化的API响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T | undefined;
  error?: string | undefined;
  message?: string | undefined;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | undefined;
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  pagination?: ApiResponse['pagination']
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
    pagination
  });
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  error: string,
  status: number = 500
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error
    },
    { status }
  );
}

/**
 * 处理数据库事务
 */
export async function withTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 验证必需参数
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): string | null {
  for (const field of requiredFields) {
    if (!data[field] && data[field] !== 0 && data[field] !== false) {
      return `缺少必需字段: ${field}`;
    }
  }
  return null;
}

/**
 * 安全的JSON解析
 */
export function safeJsonParse(jsonString: string, defaultValue: any = null) {
  try {
    return JSON.parse(jsonString);
  } catch {
    return defaultValue;
  }
}

/**
 * 构建分页查询
 */
export function buildPaginationQuery(
  baseQuery: string,
  page: number,
  limit: number
): string {
  const offset = (page - 1) * limit;
  return `${baseQuery} LIMIT ${limit} OFFSET ${offset}`;
}

/**
 * 构建搜索条件
 */
export function buildSearchCondition(
  searchTerm: string,
  searchFields: string[]
): { condition: string; params: string[] } {
  if (!searchTerm || searchFields.length === 0) {
    return { condition: '', params: [] };
  }
  
  const conditions = searchFields.map(field => `${field} ILIKE $1`);
  return {
    condition: `(${conditions.join(' OR ')})`,
    params: [`%${searchTerm}%`]
  };
}

/**
 * 记录API调用日志
 */
export function logApiCall(
  method: string,
  endpoint: string,
  duration: number,
  success: boolean
) {
  console.log(`[API] ${method} ${endpoint} - ${duration}ms - ${success ? 'SUCCESS' : 'ERROR'}`);
}

/**
 * API路由包装器，提供统一的错误处理和日志记录
 */
export function withApiHandler(
  handler: (request: Request, context?: any) => Promise<NextResponse>
) {
  return async (request: Request, context?: any) => {
    const start = Date.now();
    const method = request.method;
    const url = new URL(request.url);
    const endpoint = url.pathname;
    
    try {
      const response = await handler(request, context);
      const duration = Date.now() - start;
      logApiCall(method, endpoint, duration, true);
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      logApiCall(method, endpoint, duration, false);
      console.error(`[API Error] ${method} ${endpoint}:`, error);
      
      return createErrorResponse(
        error instanceof Error ? error.message : '服务器内部错误'
      );
    }
  };
}
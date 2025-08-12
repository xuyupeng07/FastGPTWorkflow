import { NextRequest, NextResponse } from 'next/server';
import { mysqlQuery } from '@/lib/mysql-db';

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sourceType = searchParams.get('sourceType');
    const platform = searchParams.get('platform');
    const projectCode = searchParams.get('projectCode');
    
    // 构建查询条件
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;
    
    if (sourceType) {
      whereConditions.push(`source_type = ?`);
      queryParams.push(sourceType);
    }
    
    if (platform) {
      whereConditions.push(`platform = ?`);
      queryParams.push(platform);
    }
    
    if (projectCode) {
      whereConditions.push(`project_code = ?`);
      queryParams.push(projectCode);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    // 查询链接信息
    const linkQuery = `
      SELECT 
        id,
        short_url as shortUrl,
        long_url as longUrl,
        source_type as sourceType,
        platform,
        project_code as projectCode,
        created_at as createdAt
      FROM link_info 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    const result = await mysqlQuery(linkQuery, queryParams) as any[];
    const rows = result;
    
    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM link_info 
      ${whereClause}
    `;
    
    const countResult = await mysqlQuery(countQuery, queryParams) as any[];
    const total = countResult[0].total;
    
    return NextResponse.json(rows);
    
  } catch (error) {
    console.error('获取链接列表失败:', error);
    return NextResponse.json(
      { error: '获取链接列表失败' },
      { status: 500 }
    );
  }
}
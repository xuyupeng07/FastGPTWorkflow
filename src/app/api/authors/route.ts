import { NextRequest } from 'next/server';
import { pool } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

// GET /api/authors - 获取所有作者
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT a.*,
        (SELECT COUNT(*) FROM workflows w WHERE w.author_id = a.id) as workflow_count
      FROM authors a
      ORDER BY a.name
    `);
    
    return createSuccessResponse(result.rows);
  } catch (error) {
    console.error('获取作者列表失败:', error);
    return createErrorResponse('获取作者列表失败');
  }
}

// POST /api/authors - 创建新作者
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, avatar_url, bio } = body;

    // 验证必填字段
    if (!name) {
      return createErrorResponse('作者名称不能为空', 400);
    }

    // 检查作者名称是否已存在
    const existingAuthor = await pool.query(
      'SELECT id FROM authors WHERE name = $1',
      [name]
    );

    if (existingAuthor.rows.length > 0) {
      return createErrorResponse('作者名称已存在', 400);
    }

    const result = await pool.query(`
      INSERT INTO authors (name, avatar_url, bio)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name, avatar_url, bio]);

    return createSuccessResponse(result.rows[0], '作者创建成功');
  } catch (error) {
    console.error('创建作者失败:', error);
    return createErrorResponse('创建作者失败');
  }
}
import { pool } from '@/lib/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

export async function GET() {
  try {
    // 查询workflows表结构
    const result = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'workflows' 
      ORDER BY ordinal_position;
    `);
    
    // 查询约束信息
    const constraintResult = await pool.query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'workflows'
      ORDER BY tc.constraint_type, kcu.column_name;
    `);
    
    return createSuccessResponse({
      columns: result.rows,
      constraints: constraintResult.rows
    });
  } catch (error) {
    console.error('查询表结构失败:', error);
    return createErrorResponse('查询表结构失败');
  }
}
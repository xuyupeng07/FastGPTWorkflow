/**
 * 确保数据库表结构完整性
 * 在应用启动时自动检查并添加缺失的字段
 */

import { pool } from './db';

/**
 * 检查并添加 thumbnail_url 字段到 workflows 表
 */
export async function ensureThumbnailUrlField(): Promise<void> {
  try {
    // 检查字段是否存在
    const checkField = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'workflows' AND column_name = 'thumbnail_url';
    `);

    if (checkField.rows.length === 0) {
      console.log('🔧 检测到 thumbnail_url 字段缺失，正在添加...');
      
      // 添加字段
      await pool.query(`
        ALTER TABLE workflows 
        ADD COLUMN thumbnail_url TEXT DEFAULT '/placeholder.svg';
      `);
      
      console.log('✅ thumbnail_url 字段添加成功');
    } else {
      console.log('✅ thumbnail_url 字段已存在');
    }
  } catch (error) {
    console.error('❌ 检查/添加 thumbnail_url 字段失败:', error);
    // 不抛出错误，避免影响应用启动
  }
}

/**
 * 确保所有必需的数据库字段存在
 */
export async function ensureSchemaIntegrity(): Promise<void> {
  console.log('🔍 检查数据库表结构完整性...');
  
  try {
    await ensureThumbnailUrlField();
    console.log('✅ 数据库表结构检查完成');
  } catch (error) {
    console.error('❌ 数据库表结构检查失败:', error);
  }
}
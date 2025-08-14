import { NextRequest } from 'next/server';
import { pool } from '@/lib/db';
import imageStorage from '@/lib/imageStorage';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

// POST /api/images/cleanup - 清理过期的临时图片
export async function POST(request: NextRequest) {
  try {
    // 查找所有过期的临时图片
    const expiredImagesResult = await pool.query(`
      SELECT id, file_name, metadata
      FROM images 
      WHERE 
        metadata->>'temporary' = 'true' 
        AND (metadata->>'expires_at')::timestamp < NOW()
    `);

    const expiredImages = expiredImagesResult.rows;
    let deletedCount = 0;
    const errors: string[] = [];

    // 删除过期的临时图片
    for (const image of expiredImages) {
      try {
        await imageStorage.deleteImage(image.id);
        deletedCount++;
        console.log(`已删除过期临时图片: ${image.file_name} (ID: ${image.id})`);
      } catch (error) {
        const errorMsg = `删除图片 ${image.id} 失败: ${error instanceof Error ? error.message : '未知错误'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return createSuccessResponse({
      totalExpired: expiredImages.length,
      deletedCount,
      errors
    }, `清理完成，删除了 ${deletedCount} 个过期临时图片`);

  } catch (error) {
    console.error('清理临时图片失败:', error);
    return createErrorResponse('清理临时图片失败');
  }
}

// GET /api/images/cleanup - 获取临时图片统计信息
export async function GET() {
  try {
    // 统计临时图片数量
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_temp_images,
        COUNT(CASE WHEN (metadata->>'expires_at')::timestamp < NOW() THEN 1 END) as expired_count,
        COUNT(CASE WHEN (metadata->>'expires_at')::timestamp >= NOW() THEN 1 END) as active_count
      FROM images 
      WHERE metadata->>'temporary' = 'true'
    `);

    const stats = statsResult.rows[0];

    // 获取即将过期的图片（1小时内过期）
    const soonExpiredResult = await pool.query(`
      SELECT id, file_name, metadata->>'expires_at' as expires_at
      FROM images 
      WHERE 
        metadata->>'temporary' = 'true' 
        AND (metadata->>'expires_at')::timestamp BETWEEN NOW() AND NOW() + INTERVAL '1 hour'
      ORDER BY (metadata->>'expires_at')::timestamp
    `);

    return createSuccessResponse({
      totalTempImages: parseInt(stats.total_temp_images),
      expiredCount: parseInt(stats.expired_count),
      activeCount: parseInt(stats.active_count),
      soonExpired: soonExpiredResult.rows
    });

  } catch (error) {
    console.error('获取临时图片统计失败:', error);
    return createErrorResponse('获取临时图片统计失败');
  }
}
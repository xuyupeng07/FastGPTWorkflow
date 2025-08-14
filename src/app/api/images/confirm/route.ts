import { NextRequest } from 'next/server';
import { pool } from '@/lib/db';
import imageStorage from '@/lib/imageStorage';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

// POST /api/images/confirm - 确认临时图片，建立与实体的关联
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageId, entityType, entityId, usageType = 'thumbnail', isPrimary = true } = body;
    
    if (!imageId || !entityType || !entityId) {
      return createErrorResponse('缺少必填参数', 400);
    }

    // 检查图片是否存在且为临时图片
    const imageResult = await pool.query(`
      SELECT id, metadata 
      FROM images 
      WHERE id = $1
    `, [imageId]);

    if (imageResult.rows.length === 0) {
      return createErrorResponse('图片不存在', 404);
    }

    const image = imageResult.rows[0];
    const metadata = image.metadata || {};
    
    if (!metadata.temporary) {
      return createErrorResponse('该图片不是临时图片', 400);
    }

    // 检查图片是否已过期
    if (metadata.expires_at) {
      const expiresAt = new Date(metadata.expires_at);
      if (expiresAt < new Date()) {
        return createErrorResponse('临时图片已过期', 400);
      }
    }

    // 开始事务
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 如果该实体已有相同用途的图片，先解除关联
      if (isPrimary) {
        await imageStorage.unlinkImageFromEntity(entityType, entityId, usageType);
      }

      // 建立图片与实体的关联
      await imageStorage.linkImageToEntity(imageId, entityType, entityId, {
        usageType,
        isPrimary
      });

      // 移除临时标记
      const updatedMetadata = { ...metadata };
      delete updatedMetadata.temporary;
      delete updatedMetadata.expires_at;
      
      await client.query(`
        UPDATE images 
        SET metadata = $1
        WHERE id = $2
      `, [JSON.stringify(updatedMetadata), imageId]);

      await client.query('COMMIT');

      return createSuccessResponse({
        imageId,
        entityType,
        entityId,
        usageType,
        isPrimary
      }, '图片确认成功');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('确认图片失败:', error);
    return createErrorResponse('确认图片失败');
  }
}
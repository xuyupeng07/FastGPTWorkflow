import { NextRequest } from 'next/server';
import { pool } from '@/lib/db';
import imageStorage from '@/lib/imageStorage';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

// POST /api/images/temp-upload - 临时图片上传
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return createErrorResponse('未提供图片文件', 400);
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(image.type)) {
      return createErrorResponse('不支持的文件类型', 400);
    }

    // 验证文件大小（5MB限制）
    if (image.size > 5 * 1024 * 1024) {
      return createErrorResponse('文件大小不能超过5MB', 400);
    }

    // 保存临时图片到数据库，但不建立关联
    const buffer = Buffer.from(await image.arrayBuffer());
    const imageId = await imageStorage.saveImage(buffer, {
      fileName: image.name,
      mimeType: image.type
    });
    
    // 将图片标记为临时状态，设置过期时间（24小时后）
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期
    
    await pool.query(`
      UPDATE images 
      SET 
        metadata = COALESCE(metadata, '{}')::jsonb || $2::jsonb
      WHERE id = $1
    `, [imageId, JSON.stringify({ temporary: true, expires_at: expiresAt.toISOString() })]);

    // 异步创建图片变体
    imageStorage.createImageVariant(imageId, 'thumbnail', { width: 200, height: 200 }).catch((error: any) => {
      console.error('创建缩略图失败:', error);
    });
    imageStorage.createImageVariant(imageId, 'medium', { width: 800, height: 600 }).catch((error: any) => {
      console.error('创建中等尺寸图片失败:', error);
    });

    return createSuccessResponse({
      imageId,
      fileSize: image.size,
      fileName: image.name,
      mimeType: image.type,
      expiresAt: expiresAt.toISOString()
    }, '临时图片上传成功');

  } catch (error) {
    console.error('临时图片上传失败 - 详细错误:', error);
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'Unknown error');
    return createErrorResponse(`临时图片上传失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// DELETE /api/images/temp-upload - 清理临时图片
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');
    
    if (!imageId) {
      return createErrorResponse('未提供图片ID', 400);
    }

    // 检查图片是否为临时图片
    const result = await pool.query(`
      SELECT metadata 
      FROM images 
      WHERE id = $1
    `, [imageId]);

    if (result.rows.length === 0) {
      return createErrorResponse('图片不存在', 404);
    }

    const metadata = result.rows[0].metadata || {};
    if (!metadata.temporary) {
      return createErrorResponse('该图片不是临时图片', 400);
    }

    // 删除临时图片
    await imageStorage.deleteImage(imageId);

    return createSuccessResponse(null, '临时图片删除成功');

  } catch (error) {
    console.error('删除临时图片失败:', error);
    return createErrorResponse('删除临时图片失败');
  }
}
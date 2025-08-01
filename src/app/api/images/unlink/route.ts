import { NextRequest, NextResponse } from 'next/server';
import { imageStorage } from '@/lib/imageStorage';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, entityId, usageType = 'main' } = body;

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType 和 entityId 是必需的' },
        { status: 400 }
      );
    }

    // 获取当前关联的图片ID并直接删除
    const client = await imageStorage.getClient();
    try {
      const currentImage = await client.query(
        'SELECT image_id FROM image_usages WHERE entity_type = $1 AND entity_id = $2 AND usage_type = $3',
        [entityType, entityId, usageType]
      );

      if (currentImage.rows.length === 0) {
        return NextResponse.json({
          success: true,
          message: '没有需要删除的图片'
        });
      }

      const imageId = currentImage.rows[0].image_id;

      // 解绑图片与实体的关联
      await imageStorage.unlinkImageFromEntity(entityType, entityId, usageType);

      // 检查图片是否还被使用，如果没有则删除
      const usageResult = await client.query(
        'SELECT COUNT(*) as count FROM image_usages WHERE image_id = $1',
        [imageId]
      );
      const usageCount = parseInt(usageResult.rows[0].count);
      
      if (usageCount === 0) {
        await imageStorage.deleteImage(imageId);
      }

      return NextResponse.json({
        success: true,
        message: '图片删除成功',
        deleted: usageCount === 0
      });

    } finally {
      await client.release();
    }

  } catch (error) {
    console.error('删除图片失败:', error);
    return NextResponse.json(
      { error: '删除图片失败' },
      { status: 500 }
    );
  }
}
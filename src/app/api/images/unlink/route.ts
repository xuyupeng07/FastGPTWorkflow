import { NextRequest, NextResponse } from 'next/server';
import { imageStorage } from '@/lib/imageStorage';

// 处理图片解绑的通用逻辑
async function handleUnlinkImage(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, entityId, usageType } = body;

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType 和 entityId 是必需的' },
        { status: 400 }
      );
    }

    const client = await imageStorage.getClient();
    try {
      let deletedImages = [];
      let totalDeleted = 0;

      if (usageType) {
        // 如果指定了usageType，只删除该类型的关联
        const currentImage = await client.query(
          'SELECT image_id FROM image_usages WHERE entity_type = $1 AND entity_id = $2 AND usage_type = $3',
          [entityType, entityId, usageType]
        );

        if (currentImage.rows.length > 0) {
          const imageId = currentImage.rows[0].image_id;
          await imageStorage.unlinkImageFromEntity(entityType, entityId, usageType);
          
          // 检查图片是否还被使用
          const usageResult = await client.query(
            'SELECT COUNT(*) as count FROM image_usages WHERE image_id = $1',
            [imageId]
          );
          const usageCount = parseInt(usageResult.rows[0].count);
          
          // 检查workflows表中是否还有引用
          const workflowUsage = await client.query(
            'SELECT COUNT(*) as count FROM workflows WHERE thumbnail_image_id = $1',
            [imageId]
          );
          const workflowCount = parseInt(workflowUsage.rows[0].count);
          
          if (usageCount === 0 && workflowCount === 0) {
            await imageStorage.deleteImage(imageId);
            deletedImages.push(imageId);
            totalDeleted++;
          }
        }
      } else {
        // 如果没有指定usageType，删除该实体的所有图片关联
        const allImages = await client.query(
          'SELECT DISTINCT image_id FROM image_usages WHERE entity_type = $1 AND entity_id = $2',
          [entityType, entityId]
        );

        for (const row of allImages.rows) {
          const imageId = row.image_id;
          
          // 删除该实体的所有图片关联
          await client.query(
            'DELETE FROM image_usages WHERE entity_type = $1 AND entity_id = $2 AND image_id = $3',
            [entityType, entityId, imageId]
          );
          
          // 检查图片是否还被使用
          const usageResult = await client.query(
            'SELECT COUNT(*) as count FROM image_usages WHERE image_id = $1',
            [imageId]
          );
          const usageCount = parseInt(usageResult.rows[0].count);
          
          // 检查workflows表中是否还有引用
          const workflowUsage = await client.query(
            'SELECT COUNT(*) as count FROM workflows WHERE thumbnail_image_id = $1',
            [imageId]
          );
          const workflowCount = parseInt(workflowUsage.rows[0].count);
          
          if (usageCount === 0 && workflowCount === 0) {
            await imageStorage.deleteImage(imageId);
            deletedImages.push(imageId);
            totalDeleted++;
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: totalDeleted > 0 ? `成功删除 ${totalDeleted} 个图片` : '图片关联已解除',
        deleted: totalDeleted > 0,
        deletedImages: deletedImages
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

// 支持POST方法（前端调用的方法）
export async function POST(request: NextRequest) {
  return handleUnlinkImage(request);
}

// 支持DELETE方法（RESTful API标准）
export async function DELETE(request: NextRequest) {
  return handleUnlinkImage(request);
}
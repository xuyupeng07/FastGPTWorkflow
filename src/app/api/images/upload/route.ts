import { NextRequest, NextResponse } from 'next/server';
import { imageStorage } from '@/lib/imageStorage';

export async function POST(request: NextRequest) {
  try {
    // 设置超时处理
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('请求超时')), 30000);
    });

    const uploadPromise = (async () => {
      const formData = await request.formData();
      const file = formData.get('image') as File;
      const entityType = formData.get('entityType') as string;
      const entityId = formData.get('entityId') as string;
      const usageType = formData.get('usageType') as string || 'main';
      const isPrimary = formData.get('isPrimary') === 'true';

      if (!file) {
        return NextResponse.json(
          { error: '未提供图片文件' },
          { status: 400 }
        );
      }

      if (!entityType || !entityId) {
        return NextResponse.json(
          { error: 'entityType 和 entityId 是必需的' },
          { status: 400 }
        );
      }

      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `不支持的文件类型: ${file.type}。支持的格式: JPG、PNG、GIF、WebP、SVG` },
          { status: 400 }
        );
      }

      // 验证文件大小 (最大 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `文件大小超过限制 (${(file.size / 1024 / 1024).toFixed(2)}MB > 5MB)` },
          { status: 400 }
        );
      }

      // 读取文件内容
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // 验证图片完整性
      if (buffer.length === 0) {
        return NextResponse.json(
          { error: '图片文件为空或损坏' },
          { status: 400 }
        );
      }

      let imageId: string;
      // 创建数据库客户端
      const client = await imageStorage.getClient();
      try {
        // 检查是否有旧图片
        const oldImageQuery = await client.query(`
          SELECT i.id, iu.image_id as image_id
          FROM images i
          INNER JOIN image_usages iu ON i.id = iu.image_id
          WHERE iu.entity_type = $1 AND iu.entity_id = $2 AND iu.usage_type = $3
          LIMIT 1
        `, [entityType, entityId, usageType]);

        if (oldImageQuery.rows.length > 0) {
          const oldImageId = oldImageQuery.rows[0].image_id;
          
          // 解绑旧图片
          await imageStorage.unlinkImageFromEntity(entityType, entityId, usageType);
          
          // 检查旧图片是否还被使用
          const usageResult = await client.query(
            'SELECT COUNT(*) as count FROM image_usages WHERE image_id = $1',
            [oldImageId]
          );
          const usageCount = parseInt(usageResult.rows[0].count);
          
          if (usageCount === 0) {
            // 如果旧图片没有被使用，删除它
            await imageStorage.deleteImage(oldImageId);
          }
        }

        // 保存新图片到数据库
        imageId = await imageStorage.saveImage(buffer, {
          fileName: file.name,
          mimeType: file.type,
          metadata: {
            originalName: file.name,
            size: file.size,
            uploadTime: new Date().toISOString()
          }
        });

        // 关联新图片到实体
        await imageStorage.linkImageToEntity(imageId, entityType, entityId, {
          usageType,
          isPrimary
        });

        // 创建缩略图变体（异步执行，不阻塞主流程）
        setImmediate(async () => {
          try {
            // 使用Promise.allSettled确保即使某个变体失败也不影响其他变体
            const variantPromises = [
              imageStorage.createImageVariant(imageId, 'thumbnail', {
                width: 200,
                height: 200,
                quality: 85
              }),
              imageStorage.createImageVariant(imageId, 'medium', {
                width: 400,
                height: 400,
                quality: 80
              })
            ];
            
            const results = await Promise.allSettled(variantPromises);
            results.forEach((result, index) => {
              if (result.status === 'rejected') {
                console.warn(`创建图片变体${index === 0 ? 'thumbnail' : 'medium'}失败:`, result.reason);
              }
            });
          } catch (error) {
            console.warn('创建图片变体过程出错:', error);
          }
        });
      } finally {
        await client.release();
      }

      return NextResponse.json({
        success: true,
        imageId,
        fileName: file.name,
        fileSize: file.size,
        message: '图片上传成功'
      });
    })();

    return Promise.race([uploadPromise, timeoutPromise]);

  } catch (error) {
    console.error('图片上传失败:', error);
    
    let errorMessage = '图片上传失败';
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = '上传超时，请检查网络连接后重试';
      } else if (error.message.includes('database')) {
        errorMessage = '数据库错误，请稍后重试';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
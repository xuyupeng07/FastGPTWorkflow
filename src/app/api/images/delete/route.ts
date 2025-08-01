import { NextRequest, NextResponse } from 'next/server';
import { imageStorage } from '@/lib/imageStorage';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageId } = body;

    if (!imageId) {
      return NextResponse.json(
        { error: 'imageId 是必需的' },
        { status: 400 }
      );
    }

    // 检查图片是否被使用
    const client = await imageStorage.getClient();
    try {
      const usageResult = await client.query(
        'SELECT COUNT(*) as count FROM image_usages WHERE image_id = $1',
        [imageId]
      );
      const usageCount = parseInt(usageResult.rows[0].count);
      
      if (usageCount > 0) {
        return NextResponse.json(
          { error: '图片正在被使用，无法删除' },
          { status: 400 }
        );
      }

      // 删除图片
      const deleted = await imageStorage.deleteImage(imageId);
      
      if (deleted) {
        return NextResponse.json({
          success: true,
          message: '图片删除成功'
        });
      } else {
        return NextResponse.json(
          { error: '图片不存在' },
          { status: 404 }
        );
      }
    } catch (error) {
      console.error('查询图片使用情况失败:', error);
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
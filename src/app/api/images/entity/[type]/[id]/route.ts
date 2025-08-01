import { NextRequest, NextResponse } from 'next/server';
import { imageStorage } from '@/lib/imageStorage';

interface ImageRecord {
  id: string;
  entity_type: string;
  entity_id: string;
  usage_type: string;
  is_primary: boolean;
  file_name: string;
  file_size: number;
  mime_type: string;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const usageType = searchParams.get('usageType');

    if (!type || !id) {
      return NextResponse.json(
        { error: '实体类型和ID是必需的' },
        { status: 400 }
      );
    }

    // 使用imageStorage获取实体图片
    const images = await imageStorage.getEntityImages(type, id);
    
    // 过滤特定用途类型的图片
    let filteredImages: ImageRecord[] = images;
    if (usageType) {
      filteredImages = images.filter((img: ImageRecord) => img.usage_type === usageType);
    }

    // 格式化图片数据
    const formattedImages = filteredImages.map((img: ImageRecord) => ({
      id: img.id,
      fileName: img.file_name,
      mimeType: img.mime_type,
      fileSize: img.file_size,
      width: img.width,
      height: img.height,
      createdAt: img.created_at,
      usageType: img.usage_type,
      isPrimary: img.is_primary,
      url: `/api/images/${img.id}`,
      thumbnailUrl: `/api/images/${img.id}?variant=thumbnail`
    }));

    return NextResponse.json({
      success: true,
      images: formattedImages,
      count: formattedImages.length
    });

  } catch (error) {
    console.error('获取实体图片失败:', error);
    return NextResponse.json(
      { error: '获取实体图片失败' },
      { status: 500 }
    );
  }
}
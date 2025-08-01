import { NextRequest, NextResponse } from 'next/server';
import { imageStorage } from '@/lib/imageStorage';

interface ImageData {
  mime_type: string;
  file_size: number;
  file_name: string;
  image_data: Buffer;
  [key: string]: any;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
    try {
    const searchParams = request.nextUrl.searchParams;
    const variant = searchParams.get('variant');
    const download = searchParams.get('download') === 'true';

    if (!id) {
      return NextResponse.json(
        { error: '图片ID是必需的' },
        { status: 400 }
      );
    }

    let imageData: any;

    // 获取图片变体或原始图片
    if (variant && variant !== 'original') {
      imageData = await imageStorage.getImageVariant(id, variant);
      if (!imageData) {
        return NextResponse.json(
          { error: '图片变体不存在' },
          { status: 404 }
        );
      }
    } else {
      imageData = await imageStorage.getImage(id);
      if (!imageData) {
        return NextResponse.json(
          { error: '图片不存在' },
          { status: 404 }
        );
      }
    }

    // 设置响应头
    const headers = new Headers();
    const fileName = (imageData as any).file_name || 'image';
    const encodedFileName = encodeURIComponent(fileName).replace(/['()]/g, escape);
    
    headers.set('Content-Type', (imageData as any).mime_type || 'image/jpeg');
    headers.set('Content-Length', (imageData as any).file_size?.toString() || '0');
    headers.set('Cache-Control', 'public, max-age=31536000');

    if (download) {
      headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
    } else {
      headers.set('Content-Disposition', `inline; filename*=UTF-8''${encodedFileName}`);
    }

    // 记录访问日志 - 暂时禁用，因为image_access_log表不存在
    // try {
    //   const client = await imageStorage.getClient();
    //   await client.query(
    //     `INSERT INTO image_access_log (image_id, access_type, user_ip, user_agent) 
    //      VALUES ($1, $2, $3, $4)`,
    //     [id, download ? 'download' : 'view', request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '', request.headers.get('user-agent') || '']
    //   );
    //   client.release();
    // } catch (error) {
    //   console.warn('记录访问日志失败:', error);
    // }

    return new NextResponse(imageData.imageData || imageData.image_data, {
      headers,
      status: 200
    });

  } catch (error) {
    console.error('获取图片失败:', error);
    return NextResponse.json(
      { error: '获取图片失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
    try {

    if (!id) {
      return NextResponse.json(
        { error: '图片ID是必需的' },
        { status: 400 }
      );
    }

    const success = await imageStorage.deleteImage(id);

    if (!success) {
      return NextResponse.json(
        { error: '图片不存在或无法删除' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '图片删除成功'
    });

  } catch (error) {
    console.error('删除图片失败:', error);
    return NextResponse.json(
      { error: '删除图片失败' },
      { status: 500 }
    );
  }
}
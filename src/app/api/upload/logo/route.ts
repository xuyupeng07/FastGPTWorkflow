import { NextRequest } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

// POST /api/upload/logo - 上传工作流Logo
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File;
    
    if (!file) {
      return createErrorResponse('没有上传文件', 400);
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return createErrorResponse('只允许上传图片文件', 400);
    }

    // 验证文件大小（默认5MB）
    const maxSize = parseInt(process.env.UPLOAD_MAX_SIZE || '5242880');
    if (file.size > maxSize) {
      return createErrorResponse(`文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`, 400);
    }

    // 确保uploads目录存在
    const uploadsDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'public/uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.name);
    const filename = 'workflow-logo-' + uniqueSuffix + ext;
    const filepath = path.join(uploadsDir, filename);

    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // 返回文件的URL路径
    const fileUrl = `/uploads/${filename}`;
    
    return createSuccessResponse({
      filename: filename,
      originalname: file.name,
      url: fileUrl,
      size: file.size
    }, '文件上传成功');
  } catch (error) {
    console.error('文件上传失败:', error);
    return createErrorResponse('文件上传失败');
  }
}

// DELETE /api/upload/logo - 删除工作流Logo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    
    if (!fileUrl) {
      return createErrorResponse('缺少文件URL参数', 400);
    }

    // 验证URL格式，确保是uploads目录下的文件
    if (!fileUrl.startsWith('/uploads/')) {
      return createErrorResponse('无效的文件URL', 400);
    }

    // 构建文件路径
    const uploadsDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'public/uploads');
    const filename = path.basename(fileUrl);
    const filepath = path.join(uploadsDir, filename);

    // 检查文件是否存在
    if (!existsSync(filepath)) {
      return createErrorResponse('文件不存在', 404);
    }

    // 删除文件
    await unlink(filepath);
    
    return createSuccessResponse({
      deleted_file: fileUrl
    }, '文件删除成功');
  } catch (error) {
    console.error('文件删除失败:', error);
    return createErrorResponse('文件删除失败');
  }
}
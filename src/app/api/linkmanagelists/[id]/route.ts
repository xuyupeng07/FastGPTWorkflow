import { NextRequest, NextResponse } from 'next/server';
import { mysqlQuery } from '@/lib/mysql-db';

// DELETE /api/linkmanagelists/[id] - 删除链接
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 检查链接是否存在
    const checkResult = await mysqlQuery(
      'SELECT id FROM link_info WHERE id = ?',
      [id]
    ) as any[];

    if (checkResult.length === 0) {
      return NextResponse.json(
        { error: '链接不存在' },
        { status: 404 }
      );
    }

    // 删除链接
    const deleteResult = await mysqlQuery(
      'DELETE FROM link_info WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      message: '链接删除成功'
    });

  } catch (error) {
    console.error('删除链接失败:', error);
    return NextResponse.json(
      { error: '删除链接失败' },
      { status: 500 }
    );
  }
}
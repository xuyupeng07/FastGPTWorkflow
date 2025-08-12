import { NextResponse } from 'next/server';
import { mysqlQuery } from '../../../lib/mysql-db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // 查询平台列表
    const platformsResult = await mysqlQuery('SELECT * FROM platform ORDER BY id ASC') as any[];
    
    // 转换字段名以匹配FastGPTWorkflow的期望格式
    const platforms = platformsResult.map((item: any) => ({
      id: item.id,
      name: item.platform,
      abbreviation: item.abbreviation
    }));
    
    return NextResponse.json({
      success: true,
      platforms: platforms
    });
  } catch (error) {
    console.error('获取平台列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取平台列表失败' },
      { status: 500 }
    );
  }
}

// 添加新平台的API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, abbreviation } = body;

    // 验证参数
    if (!platform || !abbreviation) {
      return NextResponse.json(
        { error: '平台名称和缩写不能为空' },
        { status: 400 }
      );
    }

    // 检查平台是否已存在
    const existingPlatforms = await mysqlQuery(
      'SELECT * FROM platform WHERE platform = ? OR abbreviation = ?',
      [platform, abbreviation]
    ) as any[];

    if (existingPlatforms && existingPlatforms.length > 0) {
      return NextResponse.json(
        { error: '平台名称或缩写已存在' },
        { status: 409 }
      );
    }

    // 插入新平台
    await mysqlQuery(
      'INSERT INTO platform (platform, abbreviation) VALUES (?, ?)',
      [platform, abbreviation]
    );

    // 获取新插入的平台ID
    const [result] = await mysqlQuery('SELECT LAST_INSERT_ID() as id') as any[];
    const insertId = result.id;

    // 返回新创建的平台
    return NextResponse.json({
      id: insertId,
      platform,
      abbreviation
    });
  } catch (error) {
    console.error('添加平台失败:', error);
    return NextResponse.json(
      { error: '添加平台失败' },
      { status: 500 }
    );
  }
}

// 删除平台的API
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    // 验证参数
    if (!id) {
      return NextResponse.json(
        { error: '平台ID不能为空' },
        { status: 400 }
      );
    }

    // 检查是否有链接使用此平台
    const linkCount = await mysqlQuery(
      'SELECT COUNT(*) as count FROM link_info WHERE platform = (SELECT platform FROM platform WHERE id = ?)',
      [id]
    ) as any[];

    if (linkCount[0].count > 0) {
      return NextResponse.json(
        { error: '无法删除：该平台下还有链接' },
        { status: 400 }
      );
    }

    // 删除平台
    const result = await mysqlQuery(
      'DELETE FROM platform WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      message: '平台删除成功'
    });
  } catch (error) {
    console.error('删除平台失败:', error);
    return NextResponse.json(
      { error: '删除平台失败' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const connection = mysql.createConnection({
  host: 'dbconn.sealoshzh.site',
  port: 35853,
  user: 'root',
  password: 'bqsqcpp9',
  database: 'urlgeneration'
});

export async function PUT(request: NextRequest) {
  try {
    const { projectCode, projectDescription, workflow } = await request.json();
    
    if (!projectCode || !workflow) {
      return NextResponse.json({
        success: false,
        message: '项目代码和工作流数据不能为空'
      }, { status: 400 });
    }

    // 验证workflow是否为有效的JSON对象
    if (typeof workflow !== 'object') {
      return NextResponse.json({
        success: false,
        message: 'workflow必须是有效的JSON对象'
      }, { status: 400 });
    }

    const conn = await connection;
    
    // 获取请求的host来生成URL
    const host = request.headers.get('host') || 'qktyoucivudx.sealoshzh.site';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const url = `${protocol}://${host}/api/json/${projectCode}`;
    
    // 更新现有项目
    const [updateResult] = await conn.execute(
      'UPDATE workflow SET description = ?, url = ?, workflow = ? WHERE project_code = ?',
      [projectDescription || '', url, JSON.stringify(workflow), projectCode]
    );
    
    // 检查是否有行被更新
    const updateInfo = updateResult as any;
    if (updateInfo.affectedRows === 0) {
      return NextResponse.json({
        success: false,
        message: '项目不存在或更新失败'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: '项目更新成功',
      url: url
    });
    
  } catch (error) {
    console.error('更新项目失败:', error);
    return NextResponse.json({
      success: false,
      message: '更新项目失败: ' + (error as Error).message
    }, { status: 500 });
  }
}
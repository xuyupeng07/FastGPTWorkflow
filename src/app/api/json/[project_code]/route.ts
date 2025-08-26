import { NextRequest, NextResponse } from 'next/server';
import { mysqlQuery } from '../../../../lib/mysql-db';

interface Params {
  project_code: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { project_code } = await params;
    console.log(`[JSON API] 请求项目: ${project_code}`);

    const results = await mysqlQuery(
      'SELECT workflow FROM workflow WHERE project_code = ?',
      [project_code]
    ) as any[];

    if (!results || results.length === 0) {
      console.log(`[JSON API] 未找到项目: ${project_code}`);
      return NextResponse.json(
        { error: '未找到', message: '未找到请求的项目' },
        { status: 404 }
      );
    }

    const workflow = results[0].workflow;

    // 如果workflow是字符串，尝试解析为JSON
    let workflowData;
    if (typeof workflow === 'string') {
      try {
        workflowData = JSON.parse(workflow);
      } catch (error) {
        console.error('[JSON API] JSON解析错误:', error);
        return NextResponse.json(
          { error: '数据格式错误', message: 'workflow数据不是有效的JSON格式' },
          { status: 500 }
        );
      }
    } else {
      workflowData = workflow;
    }

    const allowedOrigins = process.env.ALLOWED_ORIGINS || 'https://demo.fastgpt.cn';
    
    return NextResponse.json(workflowData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigins,
        'Access-Control-Allow-Credentials': 'true'
      }
    });
  } catch (error: any) {
    console.error('[JSON API] 错误:', error);
    return NextResponse.json(
      { error: '服务器错误', message: error.message },
      { status: 500 }
    );
  }
}
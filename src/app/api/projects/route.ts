import { NextResponse } from 'next/server';
import { mysqlQuery } from '../../../lib/mysql-db';
import { NextRequest } from 'next/server';

// 处理POST请求 - 创建新项目
export const POST = async (req: NextRequest) => {
    try {
      const { projectCode, projectDescription, workflow } = await req.json();

      // 验证数据
      if (!projectCode) {
        return NextResponse.json(
          { success: false, message: '工作流名称是必需的' },
          { status: 400 }
        );
      }

      // 检查projectCode是否已存在
      const existingProjects = await mysqlQuery(
        'SELECT * FROM workflow WHERE project_code = ?',
        [projectCode]
      ) as any[];

      if (existingProjects && existingProjects.length > 0) {
        return NextResponse.json(
          { success: false, message: '该工作流名称已存在' },
          { status: 400 }
        );
      }

      // 验证workflow是有效的JSON（无论如何都验证，只要不是null或undefined）
      let validatedWorkflow = null;
      
      if (workflow !== null && workflow !== undefined) {
        // 如果是字符串，则尝试解析确认是有效的JSON
        if (typeof workflow === 'string') {
          // 空字符串也要验证
          if (workflow.trim() === '') {
            return NextResponse.json(
              { success: false, message: 'Workflow不能为空字符串' },
              { status: 400 }
            );
          }
          
          try {
            validatedWorkflow = JSON.parse(workflow);
          } catch (e) {
            return NextResponse.json(
              { success: false, message: 'Workflow必须是有效的JSON格式' },
              { status: 400 }
            );
          }
        } else if (typeof workflow === 'object') {
          // 如果是对象，检查是否为空对象
          if (Object.keys(workflow).length === 0) {
            return NextResponse.json(
              { success: false, message: 'Workflow不能为空对象' },
              { status: 400 }
            );
          }
          validatedWorkflow = workflow;
        } else {
          // 既不是字符串也不是对象，则不是有效的JSON
          return NextResponse.json(
            { success: false, message: 'Workflow必须是有效的JSON格式或对象' },
            { status: 400 }
          );
        }
      }

      // 生成URL - 使用新的公网地址
      const host = req.headers.get('host') || 'qktyoucivudx.sealoshzh.site';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const url = validatedWorkflow ? `${protocol}://${host}/api/json/${projectCode}` : null;

      // description可为空，转换为null避免空字符串问题
      const finalDescription = projectDescription && projectDescription.trim() ? projectDescription : null;

      // 保存到数据库
      await mysqlQuery(
        'INSERT INTO workflow (project_code, description, url, workflow) VALUES (?, ?, ?, ?)',
        [projectCode, finalDescription, url, validatedWorkflow ? JSON.stringify(validatedWorkflow) : null]
      );

      return NextResponse.json({
        success: true,
        message: '项目创建成功',
        url,
        projectCode,
      });
    } catch (error: any) {
      console.error('创建项目失败:', error);
      return NextResponse.json(
        { success: false, message: `创建项目时出错: ${error.message}` },
        { status: 500 }
      );
    }
};

// 处理GET请求 - 获取所有项目
export const GET = async (req: NextRequest) => {
  try {
    const projects = await mysqlQuery(
      'SELECT id, project_code, url FROM workflow ORDER BY id DESC',
      []
    ) as any[];

    return NextResponse.json({
      success: true,
      projects,
    });
  } catch (error: any) {
    console.error('获取项目列表失败:', error);
    return NextResponse.json(
      { success: false, message: `获取项目列表时出错: ${error.message}` },
      { status: 500 }
    );
  }
};

// 删除项目的API
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    // 验证参数
    if (!id) {
      return NextResponse.json(
        { error: '项目ID不能为空' },
        { status: 400 }
      );
    }

    // 检查是否有链接使用此项目
    const linkCount = await mysqlQuery(
      'SELECT COUNT(*) as count FROM link_info WHERE project_code = (SELECT project_code FROM workflow WHERE id = ?)',
      [id]
    ) as any[];

    if (linkCount[0].count > 0) {
      return NextResponse.json(
        { error: '无法删除：该项目下还有链接' },
        { status: 400 }
      );
    }

    // 删除项目
    const result = await mysqlQuery(
      'DELETE FROM workflow WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      message: '项目删除成功'
    });
  } catch (error) {
    console.error('删除项目失败:', error);
    return NextResponse.json(
      { error: '删除项目失败' },
      { status: 500 }
    );
  }
}
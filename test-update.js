#!/usr/bin/env node

// 使用内置的fetch API (Node.js 18+)

async function testUpdate() {
  try {
    // 首先获取一个工作流
    console.log('获取工作流列表...');
    const listResponse = await fetch('http://localhost:3001/api/workflows');
    const listResult = await listResponse.json();
    
    if (!listResult.success || !listResult.data || listResult.data.length === 0) {
      console.log('没有找到工作流数据');
      return;
    }
    
    const workflow = listResult.data[0];
    console.log('找到工作流:', workflow.id, workflow.title);
    
    // 准备更新数据
    const updateData = {
      title: workflow.title + ' (已更新)',
      description: workflow.description,
      long_description: workflow.long_description || '',
      category_id: workflow.category_id,
      author_id: workflow.author_id,
      thumbnail_url: workflow.thumbnail_url,
      estimated_time: workflow.estimated_time,
      demo_url: workflow.demo_url || '',
      share_id: workflow.share_id || '',
      is_featured: workflow.is_featured,
      is_published: workflow.is_published,
      version: workflow.version,
      json_source: workflow.json_source || ''
    };
    
    console.log('发送更新请求...');
    console.log('更新数据:', JSON.stringify(updateData, null, 2));
    
    // 发送更新请求
    const updateResponse = await fetch(`http://localhost:3001/api/admin/workflows/${workflow.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    const updateResult = await updateResponse.json();
    console.log('更新结果:', JSON.stringify(updateResult, null, 2));
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testUpdate();
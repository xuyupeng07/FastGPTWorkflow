#!/usr/bin/env node

/**
 * API接口测试脚本
 */

const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testAPI() {
  try {
    console.log('🧪 开始测试API接口...');
    
    // 测试健康检查
    console.log('\n💚 测试健康检查接口...');
    const healthResponse = await makeRequest('/health');
    console.log(`状态码: ${healthResponse.status}`);
    console.log('响应:', JSON.stringify(healthResponse.data, null, 2));
    
    // 测试获取分类
    console.log('\n📂 测试获取分类接口...');
    const categoriesResponse = await makeRequest('/api/categories');
    console.log(`状态码: ${categoriesResponse.status}`);
    if (categoriesResponse.data.success) {
      console.log(`✅ 成功获取 ${categoriesResponse.data.data.length} 个分类`);
      categoriesResponse.data.data.forEach((category, index) => {
        console.log(`  ${index + 1}. ${category.name} (${category.id})`);
      });
    } else {
      console.log('❌ 获取分类失败:', categoriesResponse.data.error);
    }
    
    // 测试获取工作流列表
    console.log('\n📋 测试获取工作流列表接口...');
    const workflowsResponse = await makeRequest('/api/workflows');
    console.log(`状态码: ${workflowsResponse.status}`);
    if (workflowsResponse.data.success) {
      console.log(`✅ 成功获取 ${workflowsResponse.data.data.length} 个工作流`);
      workflowsResponse.data.data.forEach((workflow, index) => {
        console.log(`  ${index + 1}. ${workflow.title} - ${workflow.description}`);
        console.log(`     分类: ${workflow.category_name}, 作者: ${workflow.author_name}`);
        console.log(`     标签: ${workflow.tags.join(', ')}`);
      });
      console.log('分页信息:', workflowsResponse.data.pagination);
    } else {
      console.log('❌ 获取工作流列表失败:', workflowsResponse.data.error);
    }
    
    // 测试获取工作流详情
    if (workflowsResponse.data.success && workflowsResponse.data.data.length > 0) {
      const firstWorkflowId = workflowsResponse.data.data[0].id;
      console.log(`\n📄 测试获取工作流详情接口 (${firstWorkflowId})...`);
      const workflowDetailResponse = await makeRequest(`/api/workflows/${firstWorkflowId}`);
      console.log(`状态码: ${workflowDetailResponse.status}`);
      if (workflowDetailResponse.data.success) {
        const workflow = workflowDetailResponse.data.data;
        console.log(`✅ 成功获取工作流详情: ${workflow.title}`);
        console.log(`   描述: ${workflow.description}`);
        console.log(`   长描述: ${workflow.long_description?.substring(0, 100)}...`);
        console.log(`   配置节点数: ${workflow.nodes_count}`);
        console.log(`   配置连接数: ${workflow.edges_count}`);
        console.log(`   配置变量数: ${workflow.variables_count}`);
        console.log(`   说明步骤: ${workflow.instructions.length} 条`);
        console.log(`   需求: ${workflow.requirements.length} 条`);
      } else {
        console.log('❌ 获取工作流详情失败:', workflowDetailResponse.data.error);
      }
    }
    
    // 测试获取标签
    console.log('\n🏷️  测试获取标签接口...');
    const tagsResponse = await makeRequest('/api/tags');
    console.log(`状态码: ${tagsResponse.status}`);
    if (tagsResponse.data.success) {
      console.log(`✅ 成功获取 ${tagsResponse.data.data.length} 个标签`);
      tagsResponse.data.data.slice(0, 5).forEach((tag, index) => {
        console.log(`  ${index + 1}. ${tag.name} (使用次数: ${tag.usage_count || 0})`);
      });
    } else {
      console.log('❌ 获取标签失败:', tagsResponse.data.error);
    }
    
    // 测试获取统计信息
    console.log('\n📊 测试获取统计信息接口...');
    const statsResponse = await makeRequest('/api/stats');
    console.log(`状态码: ${statsResponse.status}`);
    if (statsResponse.data.success) {
      const stats = statsResponse.data.data;
      console.log(`✅ 成功获取统计信息:`);
      console.log(`   总工作流数: ${stats.totalWorkflows}`);
      console.log(`   分类统计: ${stats.categoryStats.length} 个分类`);
      console.log(`   热门标签: ${stats.popularTags.length} 个`);
      console.log(`   最近活动: ${stats.recentActions.length} 种类型`);
    } else {
      console.log('❌ 获取统计信息失败:', statsResponse.data.error);
    }
    
    console.log('\n🎉 API测试完成！');
    
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }
}

// 执行测试
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };
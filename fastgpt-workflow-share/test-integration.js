// 集成测试 - 验证前端和API的完整集成

const axios = require('axios');

// 测试配置
const API_BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 等待服务启动
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 测试API连接
async function testApiConnection() {
  try {
    log('🔍 测试API连接...', 'blue');
    const response = await axios.get(`${API_BASE_URL}/health`);
    
    if (response.status === 200 && response.data.status === 'ok') {
      log('✅ API服务连接正常', 'green');
      return true;
    } else {
      log('❌ API服务响应异常', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ API服务连接失败: ${error.message}`, 'red');
    return false;
  }
}

// 测试前端连接
async function testFrontendConnection() {
  try {
    log('🔍 测试前端连接...', 'blue');
    const response = await axios.get(FRONTEND_URL);
    
    if (response.status === 200) {
      log('✅ 前端服务连接正常', 'green');
      return true;
    } else {
      log('❌ 前端服务响应异常', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ 前端服务连接失败: ${error.message}`, 'red');
    return false;
  }
}

// 测试API数据获取
async function testApiData() {
  try {
    log('🔍 测试API数据获取...', 'blue');
    
    // 测试分类接口
    const categoriesResponse = await axios.get(`${API_BASE_URL}/api/categories`);
    if (categoriesResponse.data.success && categoriesResponse.data.data.length > 0) {
      log(`✅ 分类数据获取成功 (${categoriesResponse.data.data.length} 个分类)`, 'green');
    } else {
      log('❌ 分类数据获取失败', 'red');
      return false;
    }
    
    // 测试工作流接口
    const workflowsResponse = await axios.get(`${API_BASE_URL}/api/workflows`);
    if (workflowsResponse.data.success && workflowsResponse.data.data.length > 0) {
      log(`✅ 工作流数据获取成功 (${workflowsResponse.data.data.length} 个工作流)`, 'green');
      
      // 测试工作流详情
      const firstWorkflow = workflowsResponse.data.data[0];
      const detailResponse = await axios.get(`${API_BASE_URL}/api/workflows/${firstWorkflow.id}`);
      if (detailResponse.data.success) {
        log(`✅ 工作流详情获取成功 (${firstWorkflow.title})`, 'green');
      } else {
        log('❌ 工作流详情获取失败', 'red');
        return false;
      }
    } else {
      log('❌ 工作流数据获取失败', 'red');
      return false;
    }
    
    // 测试标签接口
    const tagsResponse = await axios.get(`${API_BASE_URL}/api/tags`);
    if (tagsResponse.data.success) {
      log(`✅ 标签数据获取成功 (${tagsResponse.data.data.length} 个标签)`, 'green');
    } else {
      log('❌ 标签数据获取失败', 'red');
      return false;
    }
    
    // 测试统计接口
    const statsResponse = await axios.get(`${API_BASE_URL}/api/stats`);
    if (statsResponse.data.success) {
      log(`✅ 统计数据获取成功`, 'green');
    } else {
      log('❌ 统计数据获取失败', 'red');
      return false;
    }
    
    return true;
  } catch (error) {
    log(`❌ API数据测试失败: ${error.message}`, 'red');
    return false;
  }
}

// 测试用户行为记录
async function testUserActions() {
  try {
    log('🔍 测试用户行为记录...', 'blue');
    
    // 获取第一个工作流ID
    const workflowsResponse = await axios.get(`${API_BASE_URL}/api/workflows`);
    if (!workflowsResponse.data.success || workflowsResponse.data.data.length === 0) {
      log('❌ 无法获取工作流数据进行行为测试', 'red');
      return false;
    }
    
    const workflowId = workflowsResponse.data.data[0].id;
    
    // 测试各种用户行为
    const actions = ['view', 'like', 'copy', 'download', 'try'];
    
    for (const action of actions) {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/workflows/${workflowId}/actions`, {
          action_type: action
        });
        
        if (response.data.success) {
          log(`✅ ${action} 行为记录成功`, 'green');
        } else {
          log(`❌ ${action} 行为记录失败`, 'red');
        }
      } catch (error) {
        log(`❌ ${action} 行为记录异常: ${error.message}`, 'red');
      }
    }
    
    return true;
  } catch (error) {
    log(`❌ 用户行为测试失败: ${error.message}`, 'red');
    return false;
  }
}

// 测试搜索功能
async function testSearchFunction() {
  try {
    log('🔍 测试搜索功能...', 'blue');
    
    // 测试关键词搜索
    const searchResponse = await axios.get(`${API_BASE_URL}/api/workflows?search=客服`);
    if (searchResponse.data.success) {
      log(`✅ 搜索功能正常 (找到 ${searchResponse.data.data.length} 个结果)`, 'green');
    } else {
      log('❌ 搜索功能异常', 'red');
      return false;
    }
    
    // 测试分类过滤
    const categoryResponse = await axios.get(`${API_BASE_URL}/api/workflows?category=customer-service`);
    if (categoryResponse.data.success) {
      log(`✅ 分类过滤正常 (找到 ${categoryResponse.data.data.length} 个结果)`, 'green');
    } else {
      log('❌ 分类过滤异常', 'red');
      return false;
    }
    
    return true;
  } catch (error) {
    log(`❌ 搜索功能测试失败: ${error.message}`, 'red');
    return false;
  }
}

// 测试分页功能
async function testPagination() {
  try {
    log('🔍 测试分页功能...', 'blue');
    
    const response = await axios.get(`${API_BASE_URL}/api/workflows?page=1&limit=1`);
    if (response.data.success && response.data.pagination) {
      const { page, limit, total, pages } = response.data.pagination;
      log(`✅ 分页功能正常 (第${page}页，每页${limit}条，共${total}条，${pages}页)`, 'green');
      return true;
    } else {
      log('❌ 分页功能异常', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ 分页功能测试失败: ${error.message}`, 'red');
    return false;
  }
}

// 主测试函数
async function runIntegrationTests() {
  log('🚀 开始集成测试...', 'bold');
  log('=' * 50, 'blue');
  
  // 等待服务启动
  log('⏳ 等待服务启动...', 'yellow');
  await delay(3000);
  
  const tests = [
    { name: 'API连接', fn: testApiConnection },
    { name: '前端连接', fn: testFrontendConnection },
    { name: 'API数据获取', fn: testApiData },
    { name: '用户行为记录', fn: testUserActions },
    { name: '搜索功能', fn: testSearchFunction },
    { name: '分页功能', fn: testPagination }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    log(`\n📋 执行测试: ${test.name}`, 'yellow');
    const result = await test.fn();
    if (result) {
      passedTests++;
    }
    await delay(1000); // 测试间隔
  }
  
  log('\n' + '=' * 50, 'blue');
  log(`🎯 测试完成: ${passedTests}/${totalTests} 通过`, passedTests === totalTests ? 'green' : 'red');
  
  if (passedTests === totalTests) {
    log('🎉 所有集成测试通过！系统运行正常。', 'green');
    log('\n📱 前端地址: http://localhost:3000', 'blue');
    log('🔗 API地址: http://localhost:3001', 'blue');
    log('📚 API文档: http://localhost:3001/api', 'blue');
  } else {
    log('⚠️  部分测试失败，请检查系统配置。', 'red');
  }
  
  return passedTests === totalTests;
}

// 如果直接运行此脚本
if (require.main === module) {
  runIntegrationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`💥 测试执行异常: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = {
  runIntegrationTests,
  testApiConnection,
  testFrontendConnection,
  testApiData,
  testUserActions,
  testSearchFunction,
  testPagination
};
// 测试工作流配置数据
const axios = require('axios');

async function testWorkflowConfig() {
  try {
    console.log('🔍 测试工作流配置数据...');
    
    // 测试API响应
    const response = await axios.get('http://localhost:3001/api/workflows/claude4-assistant');
    
    console.log('✅ API响应状态:', response.status);
    console.log('📊 响应数据结构:');
    console.log('- success:', response.data.success);
    console.log('- message:', response.data.message);
    
    if (response.data.data) {
      const workflow = response.data.data;
      console.log('\n📋 工作流基本信息:');
      console.log('- ID:', workflow.id);
      console.log('- 标题:', workflow.title);
      console.log('- 描述:', workflow.description);
      
      console.log('\n⚙️ 配置信息:');
      console.log('- config存在:', !!workflow.config);
      console.log('- config类型:', typeof workflow.config);
      
      if (workflow.config) {
        console.log('- config内容:');
        console.log(JSON.stringify(workflow.config, null, 2));
        
        // 测试JSON序列化
        try {
          const jsonString = JSON.stringify(workflow.config, null, 2);
          console.log('\n✅ JSON序列化成功，长度:', jsonString.length);
          console.log('前100个字符:', jsonString.substring(0, 100));
        } catch (err) {
          console.log('❌ JSON序列化失败:', err.message);
        }
      } else {
        console.log('❌ config字段为空或不存在');
      }
    } else {
      console.log('❌ 响应数据为空');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testWorkflowConfig();
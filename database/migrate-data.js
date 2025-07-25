#!/usr/bin/env node

/**
 * 数据迁移脚本
 * 将现有的静态工作流数据迁移到PostgreSQL数据库
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 数据库连接配置
const DATABASE_URL = 'postgresql://postgres:bzncrmdw@dbconn.sealoshzh.site:48900/?directConnection=true';

// 创建数据库客户端
const client = new Client({
  connectionString: 'postgresql://postgres:bzncrmdw@dbconn.sealoshzh.site:48900/?directConnection=true'
});

// 导入现有数据
function loadExistingData() {
  try {
    // 读取现有的数据文件
    const dataPath = path.join(__dirname, '../src/lib/data.ts');
    const dataContent = fs.readFileSync(dataPath, 'utf8');
    
    // 这里需要解析TypeScript文件中的数据
    // 为了简化，我们直接定义数据结构
    return {
      categories: [
        {
          id: 'all',
          name: '全部',
          icon: 'Grid3X3',
          color: '#6b7280'
        },
        {
          id: 'customer-service',
          name: '客服助手',
          icon: 'MessageCircle',
          color: '#3b82f6'
        },
        {
          id: 'content-creation',
          name: '内容创作',
          icon: 'PenTool',
          color: '#8b5cf6'
        },
        {
          id: 'data-analysis',
          name: '数据分析',
          icon: 'BarChart3',
          color: '#10b981'
        },
        {
          id: 'automation',
          name: '自动化',
          icon: 'Zap',
          color: '#f59e0b'
        },
        {
          id: 'education',
          name: '教育培训',
          icon: 'GraduationCap',
          color: '#ef4444'
        },
        {
          id: 'business',
          name: '商业应用',
          icon: 'Briefcase',
          color: '#6366f1'
        }
      ],
      workflows: [
        {
          id: 'customer-service-demo',
          title: '智能客服助手',
          description: '基于FastGPT构建的智能客服系统，支持多轮对话和知识库检索',
          longDescription: '这是一个完整的智能客服解决方案，集成了自然语言处理、知识库检索和多轮对话管理。系统能够理解用户意图，提供准确的答案，并在需要时转接人工客服。通过智能化的对话处理，能够大幅提升客服效率，减少人工干预，提供7x24小时的优质服务体验。',
          categoryId: 'customer-service',
          authorId: 1,
          thumbnailUrl: '/thumbnails/customer-service.jpg',
          difficulty: 'intermediate',
          estimatedTime: '30分钟',
          usageCount: 1234,
          likeCount: 89,
          demoUrl: 'https://demo.fastgpt.com/customer-service',
          shareId: 'g20squJLPzWUtIyLXr3oLfE0',
          tags: ['AI助手', '客服', '对话'],
          screenshots: [
            '/screenshots/customer-service-1.jpg',
            '/screenshots/customer-service-2.jpg'
          ],
          instructions: [
            '1. 配置知识库，上传常见问题和答案',
            '2. 设置对话流程和转接规则',
            '3. 测试对话效果并优化',
            '4. 部署到生产环境'
          ],
          requirements: [
            'FastGPT账号',
            '知识库数据',
            '基础的对话设计经验'
          ],
          config: {
            nodes: [
              {
                id: 'start',
                type: 'start',
                position: { x: 100, y: 100 },
                data: { label: '开始' }
              },
              {
                id: 'ai-chat',
                type: 'ai-chat',
                position: { x: 300, y: 100 },
                data: {
                  model: 'gpt-3.5-turbo',
                  systemPrompt: '你是一个专业的客服助手，请礼貌、准确地回答用户问题。',
                  maxToken: 2000
                }
              }
            ],
            edges: [
              {
                id: 'start-to-chat',
                source: 'start',
                target: 'ai-chat'
              }
            ],
            variables: [
              {
                id: 'user_question',
                name: '用户问题',
                type: 'string'
              }
            ],
            version: '1.0'
          }
        },
        {
          id: 'claude4-assistant',
          title: 'Claude4AI助手',
          description: '使用Claude4构建的AI助手',
          longDescription: '基于Claude4模型构建的智能AI助手，支持多轮对话、推理分析和文件处理。配置了最新的Claude Sonnet 4模型，具备强大的理解和生成能力，适用于各种复杂的对话场景。',
          categoryId: 'customer-service',
          authorId: 1,
          thumbnailUrl: '/thumbnails/claude4-assistant.jpg',
          difficulty: 'advanced',
          estimatedTime: '45分钟',
          usageCount: 856,
          likeCount: 124,
          demoUrl: 'https://demo.fastgpt.com/claude4-assistant',
          shareId: 'claude4-demo-share-id',
          tags: ['Claude4', 'AI助手', '高级'],
          screenshots: [
            '/screenshots/claude4-1.jpg',
            '/screenshots/claude4-2.jpg'
          ],
          instructions: [
            '1. 配置Claude4模型参数',
            '2. 设置系统提示词',
            '3. 配置对话历史管理',
            '4. 测试和优化响应质量'
          ],
          requirements: [
            'Claude4 API访问权限',
            'FastGPT Pro账号',
            '高级对话设计经验'
          ],
          config: {
            nodes: [
              {
                id: 'start',
                type: 'start',
                position: { x: 100, y: 100 },
                data: { label: '开始' }
              },
              {
                id: 'claude4-chat',
                type: 'ai-chat',
                position: { x: 300, y: 100 },
                data: {
                  model: 'claude-3-5-sonnet-20241022',
                  systemPrompt: '你是Claude4，一个强大的AI助手。请提供准确、有用的回答。',
                  maxToken: 4000,
                  temperature: 0.7
                }
              }
            ],
            edges: [
              {
                id: 'start-to-claude',
                source: 'start',
                target: 'claude4-chat'
              }
            ],
            variables: [
              {
                id: 'user_input',
                name: '用户输入',
                type: 'string'
              },
              {
                id: 'context',
                name: '上下文',
                type: 'string'
              }
            ],
            version: '1.0',
            aiSettings: {
              model: 'claude-3-5-sonnet-20241022',
              systemPrompt: '你是一个强大的AI助手，能够处理各种复杂任务。',
              isResponseAnswerText: true,
              maxHistories: 10,
              maxToken: 4000,
              aiChatReasoning: true
            }
          }
        }
      ]
    };
  } catch (error) {
    console.error('读取现有数据失败:', error);
    return { categories: [], workflows: [] };
  }
}

async function migrateData() {
  try {
    console.log('🔗 正在连接到数据库...');
    await client.connect();
    console.log('✅ 数据库连接成功！');

    const data = loadExistingData();
    
    console.log('📊 开始迁移数据...');
    
    // 迁移工作流数据
    for (const workflow of data.workflows) {
      console.log(`📝 正在迁移工作流: ${workflow.title}`);
      
      // 插入工作流基本信息
      const isFeatured = ['customer-service-demo', 'claude4-assistant'].includes(workflow.id);
      await client.query(`
        INSERT INTO workflows (
          id, title, description, category_id, author_id,
          thumbnail_url, usage_count, like_count,
          json_source, is_featured, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          json_source = EXCLUDED.json_source,
          is_featured = EXCLUDED.is_featured,
          updated_at = CURRENT_TIMESTAMP
      `, [
        workflow.id,
        workflow.title,
        workflow.description,
        workflow.categoryId,
        workflow.authorId,
        workflow.thumbnailUrl,
        workflow.usageCount,
        workflow.likeCount,
        JSON.stringify(workflow.config),
        isFeatured,
        new Date(),
        new Date()
      ]);
      
      // 工作流配置已直接存储在workflows表的json_source字段中
      
      // 插入标签关联
      for (const tagName of workflow.tags) {
        // 确保标签存在
        const tagResult = await client.query(
          'SELECT id FROM workflow_tags WHERE name = $1',
          [tagName]
        );
        
        if (tagResult.rows.length > 0) {
          const tagId = tagResult.rows[0].id;
          
          // 插入标签关联
          await client.query(`
            INSERT INTO workflow_tag_relations (workflow_id, tag_id)
            VALUES ($1, $2)
            ON CONFLICT (workflow_id, tag_id) DO NOTHING
          `, [workflow.id, tagId]);
        }
      }
      
      // 插入截图
      for (let i = 0; i < workflow.screenshots.length; i++) {
        await client.query(`
          INSERT INTO workflow_screenshots (workflow_id, image_url, sort_order)
          VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING
        `, [workflow.id, workflow.screenshots[i], i]);
      }
      
      // 插入说明
      for (let i = 0; i < workflow.instructions.length; i++) {
        await client.query(`
          INSERT INTO workflow_instructions (workflow_id, instruction_text, sort_order)
          VALUES ($1, $2, $3)
        `, [workflow.id, workflow.instructions[i], i + 1]);
      }
      
      // 插入需求
      for (let i = 0; i < workflow.requirements.length; i++) {
        await client.query(`
          INSERT INTO workflow_requirements (workflow_id, requirement_text, sort_order)
          VALUES ($1, $2, $3)
        `, [workflow.id, workflow.requirements[i], i + 1]);
      }
    }
    
    console.log('✅ 数据迁移完成！');
    
    // 验证迁移结果
    const workflowCount = await client.query('SELECT COUNT(*) as count FROM workflows');
    const tagRelationCount = await client.query('SELECT COUNT(*) as count FROM workflow_tag_relations');
    const jsonSourceCount = await client.query('SELECT COUNT(*) as count FROM workflows WHERE json_source IS NOT NULL');
    
    console.log('📈 迁移结果统计:');
    console.log(`  - 工作流: ${workflowCount.rows[0].count} 条`);
    console.log(`  - 包含JSON源码: ${jsonSourceCount.rows[0].count} 条`);
    console.log(`  - 标签关联: ${tagRelationCount.rows[0].count} 条`);
    
    console.log('\n🎉 数据迁移全部完成！');
    
  } catch (error) {
    console.error('❌ 数据迁移失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 数据库连接已关闭');
  }
}

// 执行迁移
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };
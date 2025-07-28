const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 数据库连接配置
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:mjns8kr8@dbconn.sealoshzh.site:47291/?directConnection=true';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: false
});

// 测试工作流数据
const testWorkflows = [
  {
    title: "智能客服助手",
    description: "一个功能完善的智能客服系统，能够自动回答常见问题，处理用户咨询，并在需要时转接人工客服。支持多轮对话和上下文理解。",
    category_id: "customer-service",
    json_source: JSON.stringify({
      nodes: [
        { id: "start", type: "userGuide", label: "用户引导" },
        { id: "classify", type: "classifyQuestion", label: "问题分类" },
        { id: "answer", type: "answerQuestion", label: "智能回答" }
      ],
      edges: [
        { source: "start", target: "classify" },
        { source: "classify", target: "answer" }
      ]
    }),
    demo_url: "https://fastgpt.cn/chat/share?shareId=customer-service-demo",
    is_featured: true
  },
  {
    title: "文章写作助手",
    description: "专业的文章写作工具，支持多种文体创作，包括新闻稿、博客文章、学术论文等。具备大纲生成、内容扩展、语法检查等功能。",
    category_id: "writing",
    json_source: JSON.stringify({
      nodes: [
        { id: "topic", type: "topicInput", label: "主题输入" },
        { id: "outline", type: "generateOutline", label: "生成大纲" },
        { id: "content", type: "writeContent", label: "内容创作" }
      ],
      edges: [
        { source: "topic", target: "outline" },
        { source: "outline", target: "content" }
      ]
    }),
    demo_url: "https://fastgpt.cn/chat/share?shareId=writing-assistant-demo"
  },
  {
    title: "数据分析报告生成器",
    description: "自动化数据分析工具，能够处理Excel、CSV等格式的数据文件，生成专业的分析报告和可视化图表。",
    category_id: "data-analysis",
    json_source: JSON.stringify({
      nodes: [
        { id: "upload", type: "fileUpload", label: "数据上传" },
        { id: "analyze", type: "dataAnalysis", label: "数据分析" },
        { id: "report", type: "generateReport", label: "生成报告" }
      ],
      edges: [
        { source: "upload", target: "analyze" },
        { source: "analyze", target: "report" }
      ]
    }),
    demo_url: "https://fastgpt.cn/chat/share?shareId=data-analysis-demo",
    is_featured: true
  },
  {
    title: "代码审查助手",
    description: "智能代码审查工具，支持多种编程语言，能够检测代码质量问题、安全漏洞、性能优化建议等。",
    category_id: "development",
    json_source: JSON.stringify({
      nodes: [
        { id: "code", type: "codeInput", label: "代码输入" },
        { id: "review", type: "codeReview", label: "代码审查" },
        { id: "suggestions", type: "generateSuggestions", label: "优化建议" }
      ],
      edges: [
        { source: "code", target: "review" },
        { source: "review", target: "suggestions" }
      ]
    }),
    demo_url: "https://fastgpt.cn/chat/share?shareId=code-review-demo"
  },
  {
    title: "营销文案生成器",
    description: "专业的营销文案创作工具，支持广告语、产品描述、邮件营销、社交媒体文案等多种营销内容的生成。",
    category_id: "marketing",
    json_source: JSON.stringify({
      nodes: [
        { id: "product", type: "productInfo", label: "产品信息" },
        { id: "target", type: "targetAudience", label: "目标受众" },
        { id: "copy", type: "generateCopy", label: "生成文案" }
      ],
      edges: [
        { source: "product", target: "target" },
        { source: "target", target: "copy" }
      ]
    }),
    demo_url: "https://fastgpt.cn/chat/share?shareId=marketing-copy-demo"
  },
  {
    title: "学习计划制定器",
    description: "个性化学习计划生成工具，根据用户的学习目标、时间安排和能力水平，制定科学合理的学习计划。",
    category_id: "education",
    json_source: JSON.stringify({
      nodes: [
        { id: "goal", type: "learningGoal", label: "学习目标" },
        { id: "assessment", type: "skillAssessment", label: "能力评估" },
        { id: "plan", type: "generatePlan", label: "制定计划" }
      ],
      edges: [
        { source: "goal", target: "assessment" },
        { source: "assessment", target: "plan" }
      ]
    }),
    demo_url: "https://fastgpt.cn/chat/share?shareId=learning-plan-demo"
  },
  {
    title: "简历优化助手",
    description: "专业的简历优化工具，能够分析简历内容，提供针对性的改进建议，提高求职成功率。",
    category_id: "career",
    json_source: JSON.stringify({
      nodes: [
        { id: "resume", type: "resumeUpload", label: "简历上传" },
        { id: "analyze", type: "resumeAnalysis", label: "简历分析" },
        { id: "optimize", type: "generateOptimization", label: "优化建议" }
      ],
      edges: [
        { source: "resume", target: "analyze" },
        { source: "analyze", target: "optimize" }
      ]
    }),
    demo_url: "https://fastgpt.cn/chat/share?shareId=resume-optimizer-demo"
  },
  {
    title: "健康饮食规划师",
    description: "个性化饮食计划生成工具，根据用户的健康状况、饮食偏好和营养需求，制定科学的饮食方案。",
    category_id: "health",
    json_source: JSON.stringify({
      nodes: [
        { id: "profile", type: "healthProfile", label: "健康档案" },
        { id: "nutrition", type: "nutritionAnalysis", label: "营养分析" },
        { id: "plan", type: "dietPlan", label: "饮食计划" }
      ],
      edges: [
        { source: "profile", target: "nutrition" },
        { source: "nutrition", target: "plan" }
      ]
    }),
    demo_url: "https://fastgpt.cn/chat/share?shareId=diet-planner-demo"
  },
  {
    title: "旅行规划助手",
    description: "智能旅行规划工具，根据预算、时间、兴趣爱好等因素，生成详细的旅行攻略和行程安排。",
    category_id: "travel",
    json_source: JSON.stringify({
      nodes: [
        { id: "destination", type: "destinationInput", label: "目的地选择" },
        { id: "preferences", type: "travelPreferences", label: "旅行偏好" },
        { id: "itinerary", type: "generateItinerary", label: "生成行程" }
      ],
      edges: [
        { source: "destination", target: "preferences" },
        { source: "preferences", target: "itinerary" }
      ]
    }),
    demo_url: "https://fastgpt.cn/chat/share?shareId=travel-planner-demo"
  },
  {
    title: "财务分析顾问",
    description: "个人财务分析工具，帮助用户分析收支状况，制定理财计划，提供投资建议。",
    category_id: "finance",
    json_source: JSON.stringify({
      nodes: [
        { id: "income", type: "incomeInput", label: "收入分析" },
        { id: "expenses", type: "expenseAnalysis", label: "支出分析" },
        { id: "advice", type: "financialAdvice", label: "理财建议" }
      ],
      edges: [
        { source: "income", target: "expenses" },
        { source: "expenses", target: "advice" }
      ]
    }),
    demo_url: "https://fastgpt.cn/chat/share?shareId=financial-advisor-demo"
  },
  {
    title: "产品需求分析器",
    description: "产品经理专用工具，帮助分析用户需求，生成产品需求文档，制定产品规划。",
    category_id: "product",
    json_source: JSON.stringify({
      nodes: [
        { id: "research", type: "userResearch", label: "用户调研" },
        { id: "analysis", type: "requirementAnalysis", label: "需求分析" },
        { id: "document", type: "generatePRD", label: "生成PRD" }
      ],
      edges: [
        { source: "research", target: "analysis" },
        { source: "analysis", target: "document" }
      ]
    }),
    demo_url: "https://fastgpt.cn/chat/share?shareId=product-analysis-demo"
  },
  {
    title: "法律文档助手",
    description: "法律文档生成和审查工具，支持合同起草、法律条款解释、风险评估等功能。",
    category_id: "legal",
    json_source: JSON.stringify({
      nodes: [
        { id: "type", type: "documentType", label: "文档类型" },
        { id: "content", type: "contentInput", label: "内容输入" },
        { id: "review", type: "legalReview", label: "法律审查" }
      ],
      edges: [
        { source: "type", target: "content" },
        { source: "content", target: "review" }
      ]
    }),
    demo_url: "https://fastgpt.cn/chat/share?shareId=legal-assistant-demo"
  },
  {
    title: "社交媒体内容策划",
    description: "社交媒体内容创作工具，支持多平台内容生成，包括微博、抖音、小红书等平台的内容策划。",
    category_id: "social-media",
    json_source: JSON.stringify({
      nodes: [
        { id: "platform", type: "platformSelect", label: "平台选择" },
        { id: "topic", type: "topicPlanning", label: "话题策划" },
        { id: "content", type: "contentCreation", label: "内容创作" }
      ],
      edges: [
        { source: "platform", target: "topic" },
        { source: "topic", target: "content" }
      ]
    }),
    demo_url: "https://fastgpt.cn/chat/share?shareId=social-media-demo"
  },
  {
    title: "API文档生成器",
    description: "自动化API文档生成工具，根据代码注释和接口定义，生成标准化的API文档。",
    category_id: "development",
    json_source: JSON.stringify({
      nodes: [
        { id: "code", type: "codeAnalysis", label: "代码分析" },
        { id: "extract", type: "extractAPI", label: "接口提取" },
        { id: "document", type: "generateDoc", label: "生成文档" }
      ],
      edges: [
        { source: "code", target: "extract" },
        { source: "extract", target: "document" }
      ]
    }),
    demo_url: "https://fastgpt.cn/chat/share?shareId=api-doc-demo"
  },
  {
    title: "心理健康评估",
    description: "心理健康评估工具，通过问卷调查和对话分析，评估用户的心理状态，提供专业建议。",
    category_id: "health",
    json_source: JSON.stringify({
      nodes: [
        { id: "questionnaire", type: "psychoQuestionnaire", label: "心理问卷" },
        { id: "analysis", type: "mentalAnalysis", label: "心理分析" },
        { id: "advice", type: "healthAdvice", label: "健康建议" }
      ],
      edges: [
        { source: "questionnaire", target: "analysis" },
        { source: "analysis", target: "advice" }
      ]
    }),
    demo_url: "https://fastgpt.cn/chat/share?shareId=mental-health-demo"
  },
  {
    title: "电商产品描述生成器",
    description: "电商专用产品描述生成工具，根据产品特性和卖点，生成吸引人的产品描述和详情页内容。",
    category_id: "ecommerce",
    json_source: JSON.stringify({
      nodes: [
        { id: "product", type: "productDetails", label: "产品详情" },
        { id: "features", type: "featureExtraction", label: "特性提取" },
        { id: "description", type: "generateDescription", label: "生成描述" }
      ],
      edges: [
        { source: "product", target: "features" },
        { source: "features", target: "description" }
      ]
    }),
    demo_url: "https://fastgpt.cn/chat/share?shareId=ecommerce-desc-demo"
  },
  {
    title: "会议纪要生成器",
    description: "智能会议纪要工具，能够根据会议录音或文字记录，自动生成结构化的会议纪要和行动项。",
    category_id: "office",
    json_source: JSON.stringify({
      nodes: [
        { id: "input", type: "meetingInput", label: "会议输入" },
        { id: "extract", type: "keyPointExtraction", label: "要点提取" },
        { id: "summary", type: "generateSummary", label: "生成纪要" }
      ],
      edges: [
        { source: "input", target: "extract" },
        { source: "extract", target: "summary" }
      ]
    }),
    demo_url: "https://fastgpt.cn/chat/share?shareId=meeting-summary-demo"
  },
  {
    title: "语言学习助手",
    description: "个性化语言学习工具，支持多种语言学习，包括词汇练习、语法讲解、口语练习等功能。",
    category_id: "education",
    json_source: JSON.stringify({
      nodes: [
        { id: "level", type: "levelAssessment", label: "水平评估" },
        { id: "plan", type: "learningPlan", label: "学习计划" },
        { id: "practice", type: "practiceExercise", label: "练习题目" }
      ],
      edges: [
        { source: "level", target: "plan" },
        { source: "plan", target: "practice" }
      ]
    }),
    demo_url: "https://fastgpt.cn/chat/share?shareId=language-learning-demo"
  },
  {
    title: "投资组合分析器",
    description: "投资组合分析工具，帮助用户分析投资组合的风险和收益，提供优化建议。",
    category_id: "finance",
    json_source: JSON.stringify({
      nodes: [
        { id: "portfolio", type: "portfolioInput", label: "组合输入" },
        { id: "analysis", type: "riskAnalysis", label: "风险分析" },
        { id: "optimization", type: "portfolioOptimization", label: "组合优化" }
      ],
      edges: [
        { source: "portfolio", target: "analysis" },
        { source: "analysis", target: "optimization" }
      ]
    }),
    demo_url: "https://fastgpt.cn/chat/share?shareId=portfolio-analysis-demo",
    is_featured: true
  },
  {
    title: "创意写作灵感生成器",
    description: "创意写作工具，为作家和创作者提供故事灵感、角色设定、情节发展等创作素材。",
    category_id: "writing",
    json_source: JSON.stringify({
      nodes: [
        { id: "genre", type: "genreSelection", label: "题材选择" },
        { id: "elements", type: "storyElements", label: "故事元素" },
        { id: "inspiration", type: "generateInspiration", label: "生成灵感" }
      ],
      edges: [
        { source: "genre", target: "elements" },
        { source: "elements", target: "inspiration" }
      ]
    }),
    demo_url: "https://fastgpt.cn/chat/share?shareId=creative-writing-demo"
  }
];

// 生成唯一ID的函数
function generateId(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Date.now();
}

// 插入测试数据的函数
async function insertTestWorkflows() {
  const client = await pool.connect();
  
  try {
    console.log('开始插入测试工作流数据...');
    
    // 首先检查是否有作者数据，如果没有则创建默认作者
    const authorResult = await client.query('SELECT id FROM authors LIMIT 1');
    let authorId;
    
    if (authorResult.rows.length === 0) {
      console.log('创建默认作者...');
      const newAuthor = await client.query(`
        INSERT INTO authors (name, bio, is_verified)
        VALUES ($1, $2, $3)
        RETURNING id
      `, ['FastGPT团队', 'FastGPT官方工作流开发团队', true]);
      authorId = newAuthor.rows[0].id;
    } else {
      authorId = authorResult.rows[0].id;
    }
    
    // 检查并创建必要的分类
    const categories = [
      { id: 'customer-service', name: '客户服务', description: '客服相关工作流' },
      { id: 'writing', name: '写作助手', description: '文章写作和内容创作' },
      { id: 'data-analysis', name: '数据分析', description: '数据处理和分析' },
      { id: 'development', name: '开发工具', description: '软件开发相关工具' },
      { id: 'marketing', name: '营销推广', description: '营销和推广相关' },
      { id: 'education', name: '教育学习', description: '教育和学习相关' },
      { id: 'career', name: '职业发展', description: '职业规划和发展' },
      { id: 'health', name: '健康医疗', description: '健康和医疗相关' },
      { id: 'travel', name: '旅行出行', description: '旅行规划和出行' },
      { id: 'finance', name: '金融理财', description: '金融和理财相关' },
      { id: 'product', name: '产品管理', description: '产品设计和管理' },
      { id: 'legal', name: '法律服务', description: '法律咨询和服务' },
      { id: 'social-media', name: '社交媒体', description: '社交媒体运营' },
      { id: 'ecommerce', name: '电商运营', description: '电商平台运营' },
      { id: 'office', name: '办公效率', description: '办公自动化工具' }
    ];
    
    for (const category of categories) {
      await client.query(`
        INSERT INTO workflow_categories (id, name, description, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [category.id, category.name, category.description, 0, true]);
    }
    
    console.log('分类数据准备完成');
    
    // 插入工作流数据
    let insertedCount = 0;
    for (const workflow of testWorkflows) {
      const id = generateId(workflow.title);
      
      try {
        await client.query(`
          INSERT INTO workflows (
            id, title, description, author_id, category_id,
            json_source, demo_url, is_published, is_featured,
            like_count, usage_count, thumbnail_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          id,
          workflow.title,
          workflow.description,
          authorId,
          workflow.category_id,
          workflow.json_source,
          workflow.demo_url,
          true, // is_published
          workflow.is_featured || false,
          Math.floor(Math.random() * 100), // 随机点赞数
          Math.floor(Math.random() * 500), // 随机使用次数
          '/placeholder.svg' // 默认缩略图
        ]);
        
        insertedCount++;
        console.log(`✅ 插入工作流: ${workflow.title}`);
      } catch (error) {
        console.error(`❌ 插入工作流失败: ${workflow.title}`, error.message);
      }
    }
    
    console.log(`\n🎉 成功插入 ${insertedCount} 个测试工作流!`);
    
  } catch (error) {
    console.error('插入数据时发生错误:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// 运行脚本
insertTestWorkflows().catch(console.error);
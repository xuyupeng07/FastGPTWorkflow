import { Workflow, WorkflowCategory } from './types';

// 工作流分类
export const categories: WorkflowCategory[] = [
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
    name: '流程自动化',
    icon: 'Zap',
    color: '#f59e0b'
  },
  {
    id: 'education',
    name: '教育培训',
    icon: 'GraduationCap',
    color: '#ef4444'
  }
];

// 示例工作流数据
export const workflows: Workflow[] = [
  {
    id: '1',
    title: '智能客服问答系统',
    description: '基于知识库的智能客服，支持多轮对话和情感分析',
    longDescription: '这是一个完整的智能客服解决方案，集成了知识库检索、意图识别、情感分析等功能。能够处理常见的客户咨询，提供准确的回答，并在必要时转接人工客服。',
    category: categories[1]!,

    thumbnail: '/workflows/customer-service.jpg',
    screenshots: ['/workflows/customer-service-1.jpg', '/workflows/customer-service-2.jpg'],
    difficulty: 'intermediate',

    usageCount: 1250,
    likeCount: 89,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    author: {
      name: 'FastGPT团队',
      avatar: '/avatars/fastgpt-team.jpg'
    },
    config: {
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 100, y: 100 },
          data: { label: '开始' }
        },
        {
          id: 'intent',
          type: 'intent-recognition',
          position: { x: 300, y: 100 },
          data: { label: '意图识别' }
        },
        {
          id: 'knowledge',
          type: 'knowledge-base',
          position: { x: 500, y: 100 },
          data: { label: '知识库检索' }
        }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'intent' },
        { id: 'e2', source: 'intent', target: 'knowledge' }
      ],
      variables: [
        { id: 'user_input', name: '用户输入', type: 'string' },
        { id: 'intent_result', name: '意图识别结果', type: 'object' }
      ],
      version: '1.0',
      metadata: {
        description: '智能客服工作流',
        author: 'FastGPT团队'
      }
    },
    demoUrl: 'https://demo.fastgpt.com/customer-service',
    instructions: [
      '1. 配置知识库：上传相关文档和FAQ',
      '2. 设置意图识别模型',
      '3. 配置回复模板',
      '4. 测试对话流程'
    ],
    requirements: [
      'FastGPT账号',
      '知识库文档',
      '基础的对话设计经验'
    ]
  },
  {
    id: '2',
    title: '文章自动生成器',
    description: '根据关键词和大纲自动生成高质量文章内容',
    longDescription: '强大的内容创作工具，能够根据用户提供的关键词、大纲或主题，自动生成结构清晰、内容丰富的文章。支持多种文体风格，适用于博客、新闻、营销文案等场景。',
    category: categories[2]!,

    thumbnail: '/workflows/content-creation.jpg',
    screenshots: ['/workflows/content-creation-1.jpg'],
    difficulty: 'beginner',

    usageCount: 2100,
    likeCount: 156,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18',
    author: {
      name: '内容创作专家',
      avatar: '/avatars/content-expert.jpg'
    },
    config: {
      nodes: [
        {
          id: 'input',
          type: 'input',
          position: { x: 100, y: 100 },
          data: { label: '输入关键词' }
        },
        {
          id: 'outline',
          type: 'outline-generator',
          position: { x: 300, y: 100 },
          data: { label: '生成大纲' }
        },
        {
          id: 'content',
          type: 'content-generator',
          position: { x: 500, y: 100 },
          data: { label: '生成内容' }
        }
      ],
      edges: [
        { id: 'e1', source: 'input', target: 'outline' },
        { id: 'e2', source: 'outline', target: 'content' }
      ],
      variables: [
        { id: 'keywords', name: '关键词', type: 'string' },
        { id: 'style', name: '写作风格', type: 'string' },
        { id: 'length', name: '文章长度', type: 'number' }
      ],
      version: '1.0'
    },
    demoUrl: 'https://demo.fastgpt.com/content-creation',
    instructions: [
      '1. 输入文章主题和关键词',
      '2. 选择写作风格和目标长度',
      '3. 系统自动生成大纲',
      '4. 生成完整文章内容'
    ],
    requirements: [
      'FastGPT账号',
      '明确的写作主题',
      '基础的内容策划能力'
    ]
  },
  {
    id: '3',
    title: '数据报告分析助手',
    description: '自动分析数据并生成专业的分析报告',
    longDescription: '专业的数据分析工具，能够处理各种格式的数据文件，进行统计分析、趋势预测，并自动生成包含图表和洞察的专业报告。适用于业务分析、市场研究等场景。',
    category: categories[3]!,

    thumbnail: '/workflows/data-analysis.jpg',
    screenshots: ['/workflows/data-analysis-1.jpg', '/workflows/data-analysis-2.jpg'],
    difficulty: 'advanced',

    usageCount: 890,
    likeCount: 67,
    createdAt: '2024-01-08',
    updatedAt: '2024-01-22',
    author: {
      name: '数据科学家',
      avatar: '/avatars/data-scientist.jpg'
    },
    config: {
      nodes: [
        {
          id: 'upload',
          type: 'file-upload',
          position: { x: 100, y: 100 },
          data: { label: '上传数据' }
        },
        {
          id: 'process',
          type: 'data-processor',
          position: { x: 300, y: 100 },
          data: { label: '数据处理' }
        },
        {
          id: 'analyze',
          type: 'analyzer',
          position: { x: 500, y: 100 },
          data: { label: '统计分析' }
        },
        {
          id: 'report',
          type: 'report-generator',
          position: { x: 700, y: 100 },
          data: { label: '生成报告' }
        }
      ],
      edges: [
        { id: 'e1', source: 'upload', target: 'process' },
        { id: 'e2', source: 'process', target: 'analyze' },
        { id: 'e3', source: 'analyze', target: 'report' }
      ],
      variables: [
        { id: 'data_file', name: '数据文件', type: 'file' },
        { id: 'analysis_type', name: '分析类型', type: 'string' },
        { id: 'report_format', name: '报告格式', type: 'string' }
      ],
      version: '1.0'
    },
    demoUrl: 'https://demo.fastgpt.com/data-analysis',
    instructions: [
      '1. 上传CSV或Excel数据文件',
      '2. 选择分析维度和指标',
      '3. 配置图表类型和样式',
      '4. 生成并下载分析报告'
    ],
    requirements: [
      'FastGPT账号',
      '结构化数据文件',
      '数据分析基础知识'
    ]
  },
  {
    id: '4',
    title: 'Claude4AI助手',
    description: '使用Claude4构建的AI助手',
    longDescription: '基于Claude4模型构建的智能AI助手，支持多轮对话、推理分析和文件处理。配置了最新的Claude Sonnet 4模型，具备强大的理解和生成能力，适用于各种复杂的对话场景。',
    category: categories[1]!, // 客服助手

    thumbnail: '/workflows/claude4-assistant.jpg',
    screenshots: ['/workflows/claude4-assistant-1.jpg'],
    difficulty: 'beginner',

    usageCount: 1250,
    likeCount: 89,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    author: {
      name: 'FastGPT团队',
      avatar: '/avatars/fastgpt-team.jpg'
    },
    config: {
      nodes: [
        {
          id: 'ai-chat',
          type: 'ai-chat',
          position: { x: 300, y: 200 },
          data: { 
            label: 'Claude4 AI对话',
            model: 'claude-sonnet-4-20250514',
            systemPrompt: '',
            maxHistories: 6,
            maxToken: 16000,
            aiChatReasoning: true
          }
        }
      ],
      edges: [],
      variables: [],
      version: '1.0',
      aiSettings: {
        model: 'claude-sonnet-4-20250514',
        systemPrompt: '',
        isResponseAnswerText: true,
        maxHistories: 6,
        maxToken: 16000,
        aiChatReasoning: true
      },
      dataset: {
        datasets: [],
        similarity: 0.4,
        limit: 3000,
        searchMode: 'embedding',
        usingReRank: true,
        rerankModel: '',
        rerankWeight: 0.5,
        datasetSearchUsingExtensionQuery: true,
        datasetSearchExtensionBg: ''
      },
      selectedTools: [],
      chatConfig: {
        questionGuide: {
          open: false
        },
        ttsConfig: {
          type: 'web'
        },
        whisperConfig: {
          open: false,
          autoSend: false,
          autoTTSResponse: false
        },
        chatInputGuide: {
          open: false,
          textList: [],
          customUrl: ''
        },
        instruction: '',
        autoExecute: {
          open: false,
          defaultPrompt: ''
        },
        welcomeText: '',
        variables: [],
        fileSelectConfig: {
          canSelectFile: true,
          canSelectImg: true,
          maxFiles: 10,
          customPdfParse: true
        },
        _id: '686b69bb6a67038a04a1ae14'
      }
    },
    demoUrl: 'https://demo.fastgpt.com/claude4-assistant',
    instructions: [
      '1. 直接开始对话，无需额外配置',
      '2. 支持文件上传和图片分析',
      '3. 具备推理分析能力',
      '4. 支持多轮上下文对话'
    ],
    requirements: [
      'FastGPT账号',
      'Claude4模型访问权限'
    ]
  }
];

// 获取所有工作流
export const getAllWorkflows = (): Workflow[] => {
  return workflows;
};

// 根据分类获取工作流
export const getWorkflowsByCategory = (categoryId: string): Workflow[] => {
  if (categoryId === 'all') {
    return workflows;
  }
  return workflows.filter(workflow => workflow.category.id === categoryId);
};

// 根据ID获取工作流
export const getWorkflowById = (id: string): Workflow | undefined => {
  return workflows.find(workflow => workflow.id === id);
};

// 搜索工作流
export const searchWorkflows = (query: string): Workflow[] => {
  const lowercaseQuery = query.toLowerCase();
  return workflows.filter(workflow => 
    workflow.title.toLowerCase().includes(lowercaseQuery) ||
    workflow.description.toLowerCase().includes(lowercaseQuery) ||
    false // 移除标签搜索功能
  );
};
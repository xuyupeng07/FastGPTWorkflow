import { Workflow, WorkflowCategory } from './types';

// 工作流分类
export const categories: WorkflowCategory[] = [
  {
    id: 'all',
    name: '全部'
  },
  {
    id: 'customer-service',
    name: '客服助手'
  },
  {
    id: 'content-creation',
    name: '内容创作'
  },
  {
    id: 'data-analysis',
    name: '数据分析'
  },
  {
    id: 'automation',
    name: '流程自动化'
  },
  {
    id: 'education',
    name: '教育培训'
  }
];

// 示例工作流数据
export const workflows: Workflow[] = [
  {
    id: '1',
    title: '智能客服问答系统',
    description: '基于知识库的智能客服，支持多轮对话和情感分析',
    category: categories[1]!,

    thumbnail: '/workflows/customer-service.jpg',

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


  },
  {
    id: '2',
    title: '文章自动生成器',
    description: '根据关键词和大纲自动生成高质量文章内容',
    category: categories[2]!,

    thumbnail: '/workflows/content-creation.jpg',

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


  },
  {
    id: '3',
    title: '数据报告分析助手',
    description: '自动分析数据并生成专业的分析报告',
    category: categories[3]!,

    thumbnail: '/workflows/data-analysis.jpg',

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


  },
  {
    id: '4',
    title: 'Claude4AI助手',
    description: '使用Claude4构建的AI助手',
    category: categories[1]!, // 客服助手

    thumbnail: '/workflows/claude4-assistant.jpg',

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
        limit: parseInt(process.env.DATA_QUERY_LIMIT || '1500'),
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
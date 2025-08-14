// 合作伙伴数据类型
export interface Partner {
  id: string;
  name: string;
  logo: string;
  description: string;
  website: string;
  category: 'technology' | 'enterprise' | 'education' | 'startup';
  featured?: boolean;
}

// 合作伙伴数据
export const partners: Partner[] = [
  // AI模型提供商
  {
    id: '1',
    name: 'OpenAI',
    logo: '/partners/openai-logo.svg',
    description: '人工智能研究公司，提供GPT系列模型',
    website: 'https://openai.com',
    category: 'technology',
    featured: true
  },
  {
    id: '2',
    name: 'Anthropic',
    logo: '/partners/anthropic.svg',
    description: 'AI安全公司，Claude模型的开发者',
    website: 'https://www.anthropic.com',
    category: 'technology',
    featured: true
  },
  {
    id: '3',
    name: 'Claude',
    logo: '/partners/claude-color.svg',
    description: 'Anthropic开发的AI助手，专注于安全和有用性',
    website: 'https://claude.ai',
    category: 'technology',
    featured: true
  },
  {
    id: '4',
    name: 'Google Gemini',
    logo: '/partners/gemini-color.svg',
    description: 'Google最新的多模态AI模型',
    website: 'https://gemini.google.com',
    category: 'technology',
    featured: true
  },
  {
    id: '5',
    name: 'DeepSeek',
    logo: '/partners/deepseek-color.svg',
    description: '专注于AGI的AI公司，提供强大的推理能力',
    website: 'https://www.deepseek.com',
    category: 'technology'
  },
  {
    id: '6',
    name: '豆包',
    logo: '/partners/doubao-color.svg',
    description: '字节跳动推出的AI助手',
    website: 'https://www.doubao.com',
    category: 'technology'
  },
  {
    id: '7',
    name: 'Kimi',
    logo: '/partners/kimi-color.svg',
    description: 'Moonshot AI推出的智能助手',
    website: 'https://kimi.moonshot.cn',
    category: 'technology'
  },
  {
    id: '8',
    name: 'Moonshot',
    logo: '/partners/moonshot.svg',
    description: '月之暗面科技的大模型服务',
    website: 'https://www.moonshot.cn',
    category: 'technology'
  },
  {
    id: '9',
    name: '智谱AI',
    logo: '/partners/zhipu-color.svg',
    description: '清华系AI公司，提供GLM系列模型',
    website: 'https://www.zhipuai.cn',
    category: 'technology'
  },
  {
    id: '10',
    name: '混元',
    logo: '/partners/hunyuan-color.svg',
    description: '腾讯自研的大语言模型',
    website: 'https://hunyuan.tencent.com',
    category: 'technology'
  },
  {
    id: '11',
    name: 'MiniMax',
    logo: '/partners/minimax-color.svg',
    description: '专注于通用人工智能的公司',
    website: 'https://www.minimax.chat',
    category: 'technology'
  },
  {
    id: '12',
    name: 'SiliconCloud',
    logo: '/partners/siliconcloud-color.svg',
    description: '硅基流动的AI云服务平台',
    website: 'https://siliconflow.cn',
    category: 'technology'
  },
  {
    id: '13',
    name: 'Qwen',
    logo: '/partners/qwen-color.svg',
    description: '阿里云推出的通义千问大模型',
    website: 'https://tongyi.aliyun.com',
    category: 'technology'
  },
  {
    id: '14',
    name: '文心一言',
    logo: '/partners/wenxin-color.svg',
    description: '百度推出的知识增强大语言模型',
    website: 'https://yiyan.baidu.com',
    category: 'technology'
  },
  {
    id: '15',
    name: 'Grok',
    logo: '/partners/grok.svg',
    description: 'xAI开发的AI助手',
    website: 'https://grok.x.ai',
    category: 'technology'
  },
  {
    id: '16',
    name: 'InternLM',
    logo: '/partners/internlm.svg',
    description: '上海AI实验室的开源大语言模型',
    website: 'https://internlm.intern-ai.org.cn',
    category: 'technology'
  },
  {
    id: '17',
    name: 'BAAI',
    logo: '/partners/baai.svg',
    description: '北京智源人工智能研究院',
    website: 'https://www.baai.ac.cn',
    category: 'education'
  },
  
  // AI工具和平台
  {
    id: '18',
    name: 'Kling AI',
    logo: '/partners/kling-color.svg',
    description: '快手推出的AI视频生成工具',
    website: 'https://kling.kuaishou.com',
    category: 'technology'
  },
  {
    id: '19',
    name: 'Flux',
    logo: '/partners/flux.svg',
    description: 'Black Forest Labs的AI图像生成模型',
    website: 'https://blackforestlabs.ai',
    category: 'technology'
  },
  {
    id: '20',
    name: 'Stability AI',
    logo: '/partners/stability-color.svg',
    description: 'Stable Diffusion等AI图像生成模型的开发者',
    website: 'https://stability.ai',
    category: 'technology'
  },
  {
    id: '21',
    name: 'Ollama',
    logo: '/partners/ollama.svg',
    description: '本地运行大语言模型的工具',
    website: 'https://ollama.ai',
    category: 'technology'
  },
  {
    id: '22',
    name: 'Xinference',
    logo: '/partners/xinference-color.svg',
    description: '开源的大模型推理框架',
    website: 'https://github.com/xorbitsai/inference',
    category: 'technology'
  },
  {
    id: '23',
    name: 'MCP',
    logo: '/partners/mcp.svg',
    description: 'Model Context Protocol协议',
    website: 'https://modelcontextprotocol.io',
    category: 'technology'
  },
  {
    id: '24',
    name: 'Jina AI',
    logo: '/partners/jina.svg',
    description: '神经搜索和多模态AI解决方案',
    website: 'https://jina.ai',
    category: 'technology'
  },
  {
    id: '25',
    name: 'SearchAPI',
    logo: '/partners/searchapi.svg',
    description: '实时搜索API服务',
    website: 'https://www.searchapi.io',
    category: 'technology'
  },
  {
    id: '26',
    name: 'Doc2X',
    logo: '/partners/doc2x-color.svg',
    description: '文档解析和转换AI工具',
    website: 'https://doc2x.noedgeai.com',
    category: 'technology'
  },
  {
    id: '27',
    name: '博查AI',
    logo: '/partners/bocha.png',
    description: 'AI驱动的智能对话平台',
    website: 'https://bocha.ai',
    category: 'technology'
  },
  
  // 云服务商
  {
    id: '28',
    name: '阿里云',
    logo: '/partners/alibabacloud-color.svg',
    description: '领先的云计算和人工智能服务提供商',
    website: 'https://www.aliyun.com',
    category: 'technology',
    featured: true
  },
  {
    id: '29',
    name: '腾讯云',
    logo: '/partners/tencentcloud-color.svg',
    description: '全面的云服务和AI解决方案',
    website: 'https://cloud.tencent.com',
    category: 'technology'
  },
  
  // 数据库
  {
    id: '30',
    name: 'MongoDB',
    logo: '/partners/MongoDB.svg',
    description: '领先的NoSQL数据库解决方案',
    website: 'https://www.mongodb.com',
    category: 'technology'
  },
  {
    id: '31',
    name: 'MySQL',
    logo: '/partners/MySQL.svg',
    description: '世界上最流行的开源关系型数据库',
    website: 'https://www.mysql.com',
    category: 'technology'
  },
  {
    id: '32',
    name: 'OceanBase',
    logo: '/partners/OceanBase.svg',
    description: '蚂蚁集团自研的分布式关系数据库',
    website: 'https://www.oceanbase.com',
    category: 'technology'
  },
  {
    id: '33',
    name: 'Redis',
    logo: '/partners/redis.svg',
    description: '高性能的内存数据结构存储系统',
    website: 'https://redis.io',
    category: 'technology'
  },
  
  // 开发工具
  {
    id: '34',
    name: 'GitHub',
    logo: '/partners/github.svg',
    description: '全球最大的代码托管平台',
    website: 'https://github.com',
    category: 'technology'
  },
  
  // 学术平台
  {
    id: '35',
    name: 'arXiv',
    logo: '/partners/arxiv_.png',
    description: '学术论文预印本服务器',
    website: 'https://arxiv.org',
    category: 'education'
  },
  
  // 企业协作
  {
    id: '36',
    name: '飞书',
    logo: '/partners/飞书.svg',
    description: '字节跳动旗下的企业协作平台',
    website: 'https://www.feishu.cn',
    category: 'enterprise'
  },
  {
    id: '37',
    name: '钉钉',
    logo: '/partners/钉钉.svg',
    description: '阿里巴巴推出的企业级智能移动办公平台',
    website: 'https://www.dingtalk.com',
    category: 'enterprise'
  },
  {
    id: '38',
    name: '企业微信',
    logo: '/partners/企业微信.svg',
    description: '腾讯推出的企业通讯与办公工具',
    website: 'https://work.weixin.qq.com',
    category: 'enterprise'
  }
];

// 分类图标和标签
export const categoryIcons = {
  technology: 'Zap',
  enterprise: 'Award',
  education: 'Users',
  startup: 'ExternalLink'
};

export const categoryLabels = {
  technology: '技术伙伴',
  enterprise: '企业伙伴',
  education: '教育伙伴',
  startup: '创业伙伴'
};
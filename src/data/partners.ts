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
    name: 'Claude',
    logo: '/partners/claude-color.svg',
    description: 'Anthropic开发的AI助手，专注于安全和有用性',
    website: 'https://claude.ai',
    category: 'technology',
    featured: true
  },
  {
    id: '3',
    name: 'Google Gemini',
    logo: '/partners/gemini-color.svg',
    description: 'Google最新的多模态AI模型',
    website: 'https://gemini.google.com',
    category: 'technology',
    featured: true
  },
  {
    id: '4',
    name: '阿里云',
    logo: '/partners/alibabacloud-color.svg',
    description: '领先的云计算和人工智能服务提供商',
    website: 'https://www.aliyun.com',
    category: 'technology',
    featured: true
  },
  {
    id: '5',
    name: '腾讯云',
    logo: '/partners/tencentcloud-color.svg',
    description: '全面的云服务和AI解决方案',
    website: 'https://cloud.tencent.com',
    category: 'technology'
  },
  {
    id: '6',
    name: 'DeepSeek',
    logo: '/partners/deepseek-color.svg',
    description: '专注于AGI的AI公司，提供强大的推理能力',
    website: 'https://www.deepseek.com',
    category: 'technology'
  },
  {
    id: '7',
    name: '豆包',
    logo: '/partners/doubao-color.svg',
    description: '字节跳动推出的AI助手',
    website: 'https://www.doubao.com',
    category: 'technology'
  },
  {
    id: '8',
    name: 'Kling AI',
    logo: '/partners/kling-color.svg',
    description: '快手推出的AI视频生成工具',
    website: 'https://kling.kuaishou.com',
    category: 'technology'
  },
  {
    id: '9',
    name: 'Xinference',
    logo: '/partners/xinference-color.svg',
    description: '开源的大模型推理框架',
    website: 'https://github.com/xorbitsai/inference',
    category: 'technology'
  },
  {
    id: '10',
    name: 'MongoDB',
    logo: '/partners/MongoDB.svg',
    description: '领先的NoSQL数据库解决方案',
    website: 'https://www.mongodb.com',
    category: 'technology'
  },
  {
    id: '11',
    name: 'MySQL',
    logo: '/partners/MySQL.svg',
    description: '世界上最流行的开源关系型数据库',
    website: 'https://www.mysql.com',
    category: 'technology'
  },
  {
    id: '12',
    name: 'OceanBase',
    logo: '/partners/OceanBase.svg',
    description: '蚂蚁集团自研的分布式关系数据库',
    website: 'https://www.oceanbase.com',
    category: 'technology'
  },
  {
    id: '13',
    name: 'Redis',
    logo: '/partners/redis.svg',
    description: '高性能的内存数据结构存储系统',
    website: 'https://redis.io',
    category: 'technology'
  },
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
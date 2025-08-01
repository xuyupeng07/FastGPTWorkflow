// 工作流相关类型定义

export interface WorkflowCard {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string | null;
  usageCount: number;
  createdAt: string;
  json_source?: string;
}

export interface WorkflowCategory {
  id: string;
  name: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface WorkflowVariable {
  id: string;
  name: string;
  type: string;
  defaultValue?: unknown;
}

export interface FastGPTWorkflowConfig {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: WorkflowVariable[];
  // FastGPT特定配置
  version?: string;
  metadata?: Record<string, unknown>;
  aiSettings?: {
    model: string;
    systemPrompt: string;
    isResponseAnswerText: boolean;
    maxHistories: number;
    maxToken: number;
    aiChatReasoning: boolean;
  };
  dataset?: {
    datasets: unknown[];
    similarity: number;
    limit: number;
    searchMode: string;
    usingReRank: boolean;
    rerankModel: string;
    rerankWeight: number;
    datasetSearchUsingExtensionQuery: boolean;
    datasetSearchExtensionBg: string;
  };
  selectedTools?: unknown[];
  chatConfig?: {
    questionGuide: {
      open: boolean;
    };
    ttsConfig: {
      type: string;
    };
    whisperConfig: {
      open: boolean;
      autoSend: boolean;
      autoTTSResponse: boolean;
    };
    chatInputGuide: {
      open: boolean;
      textList: unknown[];
      customUrl: string;
    };
    instruction: string;
    autoExecute: {
      open: boolean;
      defaultPrompt: string;
    };
    welcomeText: string;
    variables: unknown[];
    fileSelectConfig: {
      canSelectFile: boolean;
      canSelectImg: boolean;
      maxFiles: number;
      customPdfParse: boolean;
    };
    _id: string;
  };
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  category: WorkflowCategory;
  thumbnail: string | null;
  thumbnail_image_id?: string;
  usageCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string;
    avatar?: string;
  };
  config: FastGPTWorkflowConfig;
  demoUrl?: string;
  json_source?: string;
  is_featured?: boolean;
}

export interface SearchFilters {
  category?: string;
  sortBy?: 'popularity' | 'newest' | 'usage';
}
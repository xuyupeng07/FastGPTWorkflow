// API客户端 - 连接后端API服务
import { getApiBaseUrl } from './config';

const API_BASE_URL = getApiBaseUrl();

// API响应类型定义
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// 后端API数据类型（与数据库对应）
export interface ApiWorkflow {
  id: string;
  title: string;
  description: string;

  category_id: string;
  category_name: string;

  thumbnail_image_id?: string;
  screenshots?: string[];

  usage_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_avatar?: string;
  demo_url?: string;
  no_login_url?: string;

  config?: Record<string, unknown>;
  is_featured?: boolean;
}

export interface ApiCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  workflow_count?: number;
}



export interface ApiStats {
  total_workflows: number;
  category_stats: Array<{
    category_id: string;
    category_name: string;
    workflow_count: number;
  }>;

  recent_activities: Array<{
    action_type: string;
    count: number;
  }>;
}

// API请求函数
class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API请求错误 [${endpoint}]:`, error);
      throw error;
    }
  }

  // 获取健康状态
  async getHealth() {
    return this.request<{ status: string; timestamp: string; uptime: number }>('/health');
  }

  // 获取分类列表
  async getCategories(): Promise<ApiResponse<ApiCategory[]>> {
    return this.request<ApiCategory[]>('/api/categories');
  }

  // 获取工作流列表
  async getWorkflows(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Promise<ApiResponse<ApiWorkflow[]>> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.category && params.category !== 'all') searchParams.append('category', params.category);
    if (params?.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    const endpoint = `/api/workflows${queryString ? `?${queryString}` : ''}`;
    
    return this.request<ApiWorkflow[]>(endpoint);
  }

  // 获取工作流详情
  async getWorkflowById(id: string): Promise<ApiResponse<ApiWorkflow>> {
    return this.request<ApiWorkflow>(`/api/workflows/${id}`);
  }



  // 获取统计信息
  async getStats(): Promise<ApiResponse<ApiStats>> {
    return this.request<ApiStats>('/api/stats');
  }

  // 记录用户行为
  async recordAction(workflowId: string, actionType: 'view' | 'like' | 'copy' | 'download' | 'try'): Promise<ApiResponse<{ success: boolean }>> {
    // 对于点赞操作，使用专门的like API
    if (actionType === 'like') {
      return this.request<{ success: boolean }>(`/api/workflows/${workflowId}/like`, {
        method: 'POST',
        body: JSON.stringify({ user_session_id: this.getUserSessionId() }),
      });
    }
    
    // 其他操作使用通用的actions API
    return this.request<{ success: boolean }>(`/api/workflows/${workflowId}/actions`, {
      method: 'POST',
      body: JSON.stringify({ 
        action_type: actionType,
        user_session_id: this.getUserSessionId()
      }),
    });
  }

  // 获取用户会话ID
  private getUserSessionId(): string {
    if (typeof window === 'undefined') return '';
    
    let sessionId = localStorage.getItem('user_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user_session_id', sessionId);
    }
    return sessionId;
  }
}

// 创建API客户端实例
export const apiClient = new ApiClient();

// 数据转换函数 - 将API数据转换为前端组件所需的格式
export function transformApiWorkflowToWorkflow(apiWorkflow: ApiWorkflow): import('./types').Workflow {
  const transformedConfig: import('./types').FastGPTWorkflowConfig = apiWorkflow.config && typeof apiWorkflow.config === 'object' 
    ? (apiWorkflow.config as unknown) as import('./types').FastGPTWorkflowConfig
    : {
        nodes: [],
        edges: [],
        variables: [],
        version: '1.0',
      };
  
  return {
    id: apiWorkflow.id,
    title: apiWorkflow.title,
    description: apiWorkflow.description,
    category: {
      id: apiWorkflow.category_id,
      name: apiWorkflow.category_name,
    },

    thumbnail: apiWorkflow.thumbnail_image_id ? `/api/images/${apiWorkflow.thumbnail_image_id}?variant=thumbnail` : null,
    thumbnail_image_id: apiWorkflow.thumbnail_image_id,

    usageCount: apiWorkflow.usage_count,
    likeCount: apiWorkflow.like_count,
    createdAt: apiWorkflow.created_at,
    updatedAt: apiWorkflow.updated_at,
    author: {
      name: apiWorkflow.author_name,
      avatar: apiWorkflow.author_avatar || '/avatars/default.jpg',
    },
    config: transformedConfig,
    ...(apiWorkflow.demo_url && { demo_url: apiWorkflow.demo_url }),
    ...(apiWorkflow.no_login_url && { no_login_url: apiWorkflow.no_login_url }),

    ...(apiWorkflow.is_featured !== undefined && { is_featured: apiWorkflow.is_featured }),
  };
}

export function transformApiCategoryToCategory(apiCategory: ApiCategory): import('./types').WorkflowCategory {
  return {
    id: apiCategory.id,
    name: apiCategory.name,
  };
}



// 错误处理辅助函数
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return '发生未知错误，请稍后重试';
}

// 缓存管理
class ApiCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

  set(key: string, data: unknown, ttl: number = 5 * 60 * 1000) { // 默认5分钟缓存
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): unknown | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

export const apiCache = new ApiCache();
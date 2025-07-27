// React Hooks for API data fetching

import { useState, useEffect, useCallback } from 'react';
import { 
  apiClient, 
  ApiStats,
  transformApiWorkflowToWorkflow,
  transformApiCategoryToCategory,
  handleApiError,
  apiCache
} from '@/lib/api';
import { Workflow, WorkflowCategory } from '@/lib/types';

// 通用API状态类型
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// 分页状态类型
interface PaginationState {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// 工作流列表Hook
export function useWorkflows(params?: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}) {
  const [state, setState] = useState<ApiState<Workflow[]> & { pagination?: PaginationState | undefined }>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchWorkflows = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // 生成缓存键
      const cacheKey = `workflows_${JSON.stringify(params || {})}`;
      const cachedData = apiCache.get(cacheKey);
      
      if (cachedData && typeof cachedData === 'object' && cachedData !== null) {
        const typedCachedData = cachedData as { workflows: Workflow[]; pagination?: PaginationState };
        setState({
          data: typedCachedData.workflows,
          pagination: typedCachedData.pagination || undefined,
          loading: false,
          error: null,
        });
        return;
      }

      const response = await apiClient.getWorkflows(params);
      
      if (response.success && response.data) {
        const transformedWorkflows = response.data.map(transformApiWorkflowToWorkflow);
        const result = {
          workflows: transformedWorkflows,
          pagination: response.pagination,
        };
        
        // 缓存结果
        apiCache.set(cacheKey, result);
        
        setState({
          data: transformedWorkflows,
          pagination: response.pagination,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(response.message || '获取工作流列表失败');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: handleApiError(error),
      }));
    }
  }, [
    params?.page,
    params?.limit,
    params?.category,
    params?.search
  ]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return {
    ...state,
    refetch: fetchWorkflows,
  };
}

// 工作流详情Hook
export function useWorkflow(id: string) {
  const [state, setState] = useState<ApiState<Workflow>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchWorkflow = useCallback(async (forceRefresh = false) => {
    if (!id) return;
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const cacheKey = `workflow_${id}`;
      
      // 如果强制刷新，清除缓存
      if (forceRefresh) {
        apiCache.clear();
      }
      
      const cachedData = apiCache.get(cacheKey);
      
      if (cachedData && !forceRefresh) {
        setState({
          data: cachedData as Workflow,
          loading: false,
          error: null,
        });
        return;
      }

      const response = await apiClient.getWorkflowById(id);
      
      if (response.success && response.data) {
        const transformedWorkflow = transformApiWorkflowToWorkflow(response.data);
        
        // 缓存结果
        apiCache.set(cacheKey, transformedWorkflow);
        
        setState({
          data: transformedWorkflow,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(response.message || '获取工作流详情失败');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: handleApiError(error),
      }));
    }
  }, [id]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  return {
    ...state,
    refetch: fetchWorkflow,
  };
}

// 分类列表Hook
export function useCategories() {
  const [state, setState] = useState<ApiState<WorkflowCategory[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchCategories = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const cacheKey = 'categories';
      const cachedData = apiCache.get(cacheKey);
      
      if (cachedData) {
        setState({
          data: cachedData as WorkflowCategory[],
          loading: false,
          error: null,
        });
        return;
      }

      const response = await apiClient.getCategories();
      
      if (response.success && response.data) {
        const transformedCategories = response.data.map(transformApiCategoryToCategory);
        
        // 在最前面添加"全部"分类
        const allCategory: WorkflowCategory = {
          id: 'all',
          name: '全部'
        };
        
        const categoriesWithAll = [allCategory, ...transformedCategories];
        
        // 缓存结果
        apiCache.set(cacheKey, categoriesWithAll, 10 * 60 * 1000); // 10分钟缓存
        
        setState({
          data: categoriesWithAll,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(response.message || '获取分类列表失败');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: handleApiError(error),
      }));
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    ...state,
    refetch: fetchCategories,
  };
}



// 统计信息Hook
export function useStats() {
  const [state, setState] = useState<ApiState<ApiStats>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchStats = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const cacheKey = 'stats';
      const cachedData = apiCache.get(cacheKey);
      
      if (cachedData) {
        setState({
          data: cachedData as ApiStats,
          loading: false,
          error: null,
        });
        return;
      }

      const response = await apiClient.getStats();
      
      if (response.success && response.data) {
        // 缓存结果
        apiCache.set(cacheKey, response.data, 2 * 60 * 1000); // 2分钟缓存
        
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(response.message || '获取统计信息失败');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: handleApiError(error),
      }));
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    ...state,
    refetch: fetchStats,
  };
}

// 用户行为记录Hook
export function useUserActions() {
  const [loading, setLoading] = useState(false);

  const recordAction = useCallback(async (
    workflowId: string, 
    actionType: 'view' | 'like' | 'copy' | 'download' | 'try'
  ) => {
    try {
      setLoading(true);
      await apiClient.recordAction(workflowId, actionType);
      
      // 清除相关缓存
      apiCache.clear();
      
      return true;
    } catch (error) {
      console.error('记录用户行为失败:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    recordAction,
    loading,
  };
}

// 搜索Hook
export function useSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getWorkflows({ search: query });
      
      if (response.success && response.data) {
        const transformedWorkflows = response.data.map(transformApiWorkflowToWorkflow);
        setSearchResults(transformedWorkflows);
      } else {
        throw new Error(response.message || '搜索失败');
      }
    } catch (error) {
      setError(handleApiError(error));
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    error,
    search,
    clearSearch,
  };
}

// 健康检查Hook
export function useHealthCheck() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const response = await apiClient.getHealth();
      setIsHealthy(response.success);
      setLastCheck(new Date());
    } catch (_error) {
      setIsHealthy(false);
      setLastCheck(new Date());
    }
  }, []);

  useEffect(() => {
    checkHealth();
    
    // 每30秒检查一次健康状态
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    isHealthy,
    lastCheck,
    checkHealth,
  };
}
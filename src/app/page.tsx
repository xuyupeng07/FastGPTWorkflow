'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { WorkflowGrid } from '@/components/WorkflowGrid';
import { HydrationSafeWrapper, useDOMProtection, useSafeRender } from '@/components/HydrationSafeWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useWorkflows, useCategories } from '@/hooks/useApi';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mounted, setMounted] = useState(false);
  
  // 使用DOM保护和安全渲染
  useDOMProtection();
  const canRender = useSafeRender();
  
  // 修复无限循环问题：将参数对象提取到组件外部或使用useMemo
  const workflowParams = useMemo(() => ({
    limit: 50, // 使用合理的分页大小
    page: 1
  }), []);
  
  // 获取工作流数据，使用合理的分页参数
  const { data: allWorkflows, loading: workflowsLoading, error: workflowsError, refetch: refetchWorkflows } = useWorkflows(workflowParams);
  
  // 在前端进行搜索和分类过滤
  const workflows = useMemo(() => {
    if (!allWorkflows) return [];
    
    let filtered = allWorkflows;
    
    // 分类过滤
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(workflow => workflow.category.id === selectedCategory);
    }
    
    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(workflow => 
        workflow.title.toLowerCase().includes(query) ||
        workflow.description.toLowerCase().includes(query) ||
        false // 移除标签搜索功能
      );
    }
    
    return filtered;
  }, [allWorkflows, selectedCategory, searchQuery]);
  
  const { data: categories, loading: categoriesLoading, error: categoriesError } = useCategories();

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 防止水合错误的早期返回
  if (!mounted || !canRender) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-20">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };
  
  // 加载状态 - 确保服务端和客户端一致
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header onSearch={handleSearch} />
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-20">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        </div>
      </div>
    );
  }
  
  // 数据加载状态
  if (workflowsLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header onSearch={handleSearch} />
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-20">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        </div>
      </div>
    );
  }
  
  // 错误状态
  if (workflowsError || categoriesError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header onSearch={handleSearch} />
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-20">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">加载失败</h2>
            <p className="text-gray-600 mb-4">
              {workflowsError || categoriesError}
            </p>
            <button
              onClick={() => {
                refetchWorkflows();
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <HydrationSafeWrapper 
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="container mx-auto px-4 py-20">
              <div className="flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">初始化中...</span>
              </div>
            </div>
          </div>
        }
      >
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <Header onSearch={handleSearch} />
          <WorkflowGrid 
            workflows={workflows || []} 
            categories={categories || []}
            searchQuery={searchQuery}
            onDataUpdate={refetchWorkflows}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      </HydrationSafeWrapper>
    </ErrorBoundary>
  );
}

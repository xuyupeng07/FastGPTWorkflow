'use client';

import React, { useState, useMemo } from 'react';
import { WorkflowCard } from './WorkflowCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Workflow, WorkflowCategory } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkflowGridProps {
  workflows: Workflow[];
  categories: WorkflowCategory[];
  searchQuery?: string;
  selectedCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  onDataUpdate?: () => void; // 新增：数据更新回调
}

const sortOptions = [
  { value: 'popularity', label: '热门度' },
  { value: 'usage', label: '使用量' },
  { value: 'newest', label: '最新' }
];

export function WorkflowGrid({ 
  workflows, 
  categories, 
  searchQuery = '', 
  selectedCategory = 'all',
  onCategoryChange,
  onDataUpdate
}: WorkflowGridProps) {
  const [sortBy, setSortBy] = useState('popularity');

  // 排序工作流（过滤已在父组件完成）
  const sortedWorkflows = useMemo(() => {
    return [...workflows].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'popularity':
        default:
          return b.likeCount - a.likeCount;
      }
    });
  }, [workflows, sortBy]);

  return (
    <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-8 space-y-8">
      {/* 现代化筛选区域 */}
      <div className="space-y-6">
        {/* 排序选项和分类筛选在同一行 */}
        <div className="flex items-center justify-between gap-6">
          {/* 左侧：排序选项 */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            {sortOptions.map((option) => (
              <Button
                key={option.value}
                variant="ghost"
                size="sm"
                onClick={() => setSortBy(option.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  sortBy === option.value 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* 右侧：分类筛选 */}
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCategoryChange?.(category.id)}
                className={`rounded-full px-4 py-2 font-medium transition-all duration-200 ${
                  selectedCategory === category.id 
                    ? 'bg-gray-900 text-white shadow-md hover:bg-gray-800' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category.name}
                {selectedCategory === category.id && (
                  <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-0 text-xs">
                    {workflows.length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* 搜索结果提示 */}
      {searchQuery && (
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            搜索 &ldquo;<span className="font-medium text-gray-600">{searchQuery}</span>&rdquo;
          </p>
        </div>
      )}

      {/* 工作流网格 */}
      <AnimatePresence mode="wait">
        {sortedWorkflows.length > 0 ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4"
          >
            {sortedWorkflows.map((workflow, index) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                index={index}
                onDataUpdate={onDataUpdate}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-20"
          >
            <div className="text-5xl mb-6 opacity-60">🔍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              暂无匹配的模板
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
              试试调整搜索关键词或选择其他分类
            </p>
            <Button
              variant="outline"
              onClick={() => {
                onCategoryChange?.('all');
              }}
              className="rounded-full px-6 py-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              重置筛选
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
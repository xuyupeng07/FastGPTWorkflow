'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Workflow } from '@/lib/types';
import { WorkflowExperience } from '@/components/WorkflowExperience';
import { motion } from 'framer-motion';
import { Users, Heart, Eye, Sparkles, Zap, Copy, CheckCircle, Loader2 } from 'lucide-react';
import { getUserSessionId } from '@/lib/userSession';
import { apiCache } from '@/lib/api';

interface WorkflowCardProps {
  workflow: Workflow;
  index?: number;
  onDataUpdate?: () => void; // 新增：数据更新回调
}

const categoryIcons: { [key: string]: React.ReactNode } = {
  'data-analysis': <Sparkles className="w-5 h-5" />,
  'automation': <Zap className="w-5 h-5" />,
  'content': <Eye className="w-5 h-5" />,
  'customer-service': <Users className="w-5 h-5" />,
  'default': <Sparkles className="w-5 h-5" />
};

export function WorkflowCard({ workflow, index = 0, onDataUpdate }: WorkflowCardProps) {
  const [showExperience, setShowExperience] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copying, setCopying] = useState(false);
  const [cachedConfig, setCachedConfig] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(workflow.likeCount || 0);
  const [liking, setLiking] = useState(false);
  const [userSessionId, setUserSessionId] = useState<string>('');
  const [usageCount, setUsageCount] = useState(workflow.usageCount || 0);

  const handleCopyJson = async (e?: React.MouseEvent) => {
    // 阻止事件冒泡和默认行为，防止页面刷新
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (copying) return; // 防止重复点击
    
    try {
      setCopying(true);
      
      // 优先使用缓存的配置
      if (cachedConfig) {
        await navigator.clipboard.writeText(cachedConfig);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        
        // 乐观更新：立即增加使用数量
        setUsageCount(prev => prev + 1);
        
        // 记录copy行为
        if (userSessionId) {
          try {
            await recordUserAction('copy');
          } catch (error) {
            console.error('记录copy行为失败:', error);
          }
        }
        return;
      }
      
      // 检查是否有JSON源码
      if (workflow.json_source) {
        let jsonString;
        try {
          // 尝试解析并格式化JSON
          const parsed = JSON.parse(workflow.json_source);
          jsonString = JSON.stringify(parsed, null, 2);
        } catch {
          // 如果解析失败，直接使用原始字符串
          jsonString = workflow.json_source;
        }
        
        setCachedConfig(jsonString); // 缓存配置
        await navigator.clipboard.writeText(jsonString);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        
        // 乐观更新：立即增加使用数量
        setUsageCount(prev => prev + 1);
        
        // 记录copy行为
        if (userSessionId) {
          try {
            await recordUserAction('copy');
          } catch (error) {
            console.error('记录copy行为失败:', error);
          }
        }
        return;
      }
      
      // 如果没有JSON源码，从API获取配置数据
      const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/workflows/${workflow.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data.config) {
        const jsonString = JSON.stringify(result.data.config, null, 2);
        setCachedConfig(jsonString); // 缓存配置
        await navigator.clipboard.writeText(jsonString);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        
        // 乐观更新：立即增加使用数量
        setUsageCount(prev => prev + 1);
        
        // 记录copy行为
        if (userSessionId) {
          try {
            await recordUserAction('copy');
          } catch (error) {
            console.error('记录copy行为失败:', error);
          }
        }
      } else {
        throw new Error(result.message || '无法获取配置数据');
      }
    } catch (err) {
      console.error('复制失败:', err);
      setCopySuccess(false);
      // 可以添加toast提示
      alert(`复制失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setCopying(false);
    }
  };

  const handleTryWorkflow = (e: React.MouseEvent) => {
    // 阻止事件冒泡和默认行为，防止页面刷新
    e.preventDefault();
    e.stopPropagation();
    
    if (workflow.demoUrl) {
      window.open(workflow.demoUrl, '_blank');
      
      // 乐观更新：立即增加使用数量
      setUsageCount(prev => prev + 1);
      
      // 记录try行为
      if (userSessionId) {
        // 异步记录行为，不阻塞UI
        recordUserAction('try')
          .catch((error) => {
            console.error('记录try行为失败:', error);
          });
      }
    } else {
      console.warn('该工作流没有设置演示URL');
    }
  };

  // 清除工作流相关缓存
  const clearWorkflowCaches = useCallback(() => {
    // 清除工作流列表缓存
    const cacheKeys = ['workflows_{}', 'workflows_{"limit":1000}'];
    cacheKeys.forEach(key => {
      apiCache.get(key) && apiCache.clear();
    });
    
    // 清除特定工作流详情缓存
    const workflowCacheKey = `workflow_${workflow.id}`;
    apiCache.get(workflowCacheKey) && apiCache.clear();
  }, [workflow.id]);

  // 记录用户行为的函数
  const recordUserAction = useCallback(async (actionType: string) => {
    try {
      const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/workflows/${workflow.id}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action_type: actionType,
          user_session_id: userSessionId
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '记录用户行为失败');
      }
    } catch (error) {
      console.error('记录用户行为失败:', error);
      throw error; // 重新抛出错误，让调用者处理
    }
  }, [workflow.id, userSessionId]);

  // 本地缓存管理
  const getCachedLikeStatus = useCallback((workflowId: string | number, sessionId: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const cacheKey = `like_status_${workflowId}_${sessionId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        // 缓存有效期1小时
        if (Date.now() - data.timestamp < 3600000) {
          return { liked: data.liked, likeCount: data.likeCount };
        }
      }
    } catch (error) {
      console.error('读取缓存失败:', error);
    }
    return null;
  }, []);

  const setCachedLikeStatus = useCallback((workflowId: string | number, sessionId: string, liked: boolean, likeCount: number) => {
    if (typeof window === 'undefined') return;
    try {
      const cacheKey = `like_status_${workflowId}_${sessionId}`;
      const data = {
        liked,
        likeCount,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
      console.error('保存缓存失败:', error);
    }
  }, []);

  // 防抖获取点赞状态
  const fetchLikeStatusRef = useRef<NodeJS.Timeout | null>(null);
  
  const fetchLikeStatus = useCallback(async (sessionId: string) => {
    // 清除之前的定时器
    if (fetchLikeStatusRef.current) {
      clearTimeout(fetchLikeStatusRef.current);
    }
    
    // 防抖延迟100ms
    fetchLikeStatusRef.current = setTimeout(async () => {
      try {
        const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api';
        const response = await fetch(`${API_BASE_URL}/workflows/${workflow.id}/like-status?user_session_id=${sessionId}`, {
          // 添加缓存控制
          headers: {
            'Cache-Control': 'max-age=300' // 5分钟缓存
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setLiked(result.data.liked);
            setLikeCount(result.data.like_count);
            // 更新缓存
            setCachedLikeStatus(workflow.id, sessionId, result.data.liked, result.data.like_count);
          }
        }
      } catch (error) {
        console.error('获取点赞状态失败:', error);
      }
    }, 100);
  }, [workflow.id, setCachedLikeStatus]);

  // 同步工作流使用数量
  useEffect(() => {
    setUsageCount(workflow.usageCount || 0);
  }, [workflow.usageCount]);

  // 初始化用户会话ID和点赞状态
  useEffect(() => {
    const sessionId = getUserSessionId();
    setUserSessionId(sessionId);
    
    // 先从本地缓存获取点赞状态
    const cachedLikeStatus = getCachedLikeStatus(workflow.id, sessionId);
    if (cachedLikeStatus) {
      setLiked(cachedLikeStatus.liked);
      setLikeCount(cachedLikeStatus.likeCount);
    }
    
    // 然后异步获取最新状态
    if (sessionId) {
      fetchLikeStatus(sessionId);
    }
    
    // 清理函数
    return () => {
      if (fetchLikeStatusRef.current) {
        clearTimeout(fetchLikeStatusRef.current);
      }
      if (handleLikeRef.current) {
        clearTimeout(handleLikeRef.current);
      }
    };
  }, [workflow.id, getCachedLikeStatus, fetchLikeStatus]);





  // 防抖处理点赞
  const handleLikeRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleLike = useCallback(async () => {
    if (liking || !userSessionId || liked) return;
    
    // 防抖处理，防止重复点击
    if (handleLikeRef.current) {
      clearTimeout(handleLikeRef.current);
    }
    
    // 乐观更新：立即更新UI
    const originalLiked = liked;
    const originalLikeCount = likeCount;
    setLiked(true);
    setLikeCount(prev => prev + 1);
    setLiking(true);
    
    // 立即更新缓存
    setCachedLikeStatus(workflow.id, userSessionId, true, likeCount + 1);
    
    // 延迟50ms发送请求，给UI更新时间
    handleLikeRef.current = setTimeout(async () => {
      try {
        const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api';
        
        const response = await fetch(`${API_BASE_URL}/workflows/${workflow.id}/actions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action_type: 'like',
            user_session_id: userSessionId
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          // 成功，保持乐观更新的状态
          setCachedLikeStatus(workflow.id, userSessionId, true, likeCount + 1);
        } else if (result.code === 'ALREADY_LIKED') {
          // 用户已经点赞过，保持点赞状态
          setCachedLikeStatus(workflow.id, userSessionId, true, likeCount + 1);
        } else {
          // 失败，回滚状态
          setLiked(originalLiked);
          setLikeCount(originalLikeCount);
          setCachedLikeStatus(workflow.id, userSessionId, originalLiked, originalLikeCount);
          console.error('点赞失败:', result.error);
        }
      } catch (error) {
        // 网络错误，回滚状态
        setLiked(originalLiked);
        setLikeCount(originalLikeCount);
        setCachedLikeStatus(workflow.id, userSessionId, originalLiked, originalLikeCount);
        console.error('点赞请求失败:', error);
      } finally {
        setLiking(false);
      }
    }, 50);
  }, [liking, userSessionId, liked, likeCount, workflow.id, setCachedLikeStatus]);

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -2, scale: 1.005 }}
      className="w-full h-56 group relative"
    >
      {workflow.is_featured && (
         <div className="absolute top-5 right-0 bg-black text-white p-1 rounded-tl-md rounded-bl-md z-10">
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
       )}
      <Card className="h-full flex flex-col hover:shadow-md transition-all duration-300 border border-gray-100/50 bg-white rounded-xl overflow-hidden p-1">
        {/* 主要内容区域 */}
        <div className="flex-1 px-5 pt-3 pb-3 overflow-hidden">
          {/* 顶部区域：logo和基本信息 */}
           <div className="flex gap-2.5 -mb-1">
             {/* 左侧logo */}
             <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm border border-gray-100">
               {workflow.thumbnail ? (
                 <img 
                   src={workflow.thumbnail} 
                   alt={workflow.title}
                   className="w-full h-full object-cover rounded-xl"
                   onError={(e) => {
                     // 如果图片加载失败，显示分类图标
                     const target = e.target as HTMLImageElement;
                     target.style.display = 'none';
                     const parent = target.parentElement;
                     if (parent) {
                       parent.innerHTML = `<div class="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center"><div class="text-gray-600 text-lg">${categoryIcons[workflow.category.id] ? '' : ''}</div></div>`;
                     }
                   }}
                 />
               ) : (
                 <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center">
                   <div className="text-gray-600 text-lg">
                     {categoryIcons[workflow.category.id] || categoryIcons.default}
                   </div>
                 </div>
               )}
             </div>
             
             {/* 右侧信息 */}
             <div className="flex-1 min-w-0">
               {/* 标题 */}
               <div className="mb-1">
                 <div className="flex items-center gap-1.5">
                   <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 flex-1">
                     {workflow.title}
                   </h3>
                 </div>
               </div>
               
               {/* 作者信息 */}
                <div className="flex items-center gap-1.5 mb-0.5 mt-1">
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center border border-gray-200">
                    <img src="/fastgpt.svg" alt="FastGPT" className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">FastGPT团队</span>
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center ml-0.5">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
             </div>
           </div>
          
          {/* 描述 */}
           <p 
             className="text-sm text-gray-500 line-clamp-3 leading-relaxed mt-5 cursor-help"
             title={workflow.description}
           >
             {workflow.description}
           </p>
        </div>

        {/* 底部统计和操作 */}
        <div className="flex items-center justify-between px-5 py-2 border-t border-gray-100 flex-shrink-0 bg-gray-50/30">
          {/* 统计信息 */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span className="font-medium">{usageCount > 999 ? `${Math.floor(usageCount/1000)}k` : usageCount}</span>
            </span>
            <button 
              onClick={handleLike}
              disabled={liking}
              className={`flex items-center gap-1 transition-colors hover:text-red-500 ${
                liked ? 'text-red-500' : 'text-gray-500'
              } ${liking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Heart 
                className={`w-3 h-3 transition-all ${
                  liked ? 'fill-current' : ''
                } ${liking ? 'animate-pulse' : ''}`} 
              />
              <span className="font-medium">{likeCount}</span>
            </button>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-1.5">
            <Button 
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCopyJson}
              disabled={copying}
              className={`border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 h-6 ${
                copying ? 'opacity-70 cursor-not-allowed' : ''
              } ${
                copySuccess ? 'border-green-300 bg-green-50 text-green-700' : ''
              }`}
            >
              {copying ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  复制中...
                </>
              ) : copySuccess ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
            <Button 
               type="button"
               size="sm"
               onClick={handleTryWorkflow}
               className="bg-gray-900 hover:bg-gray-800 text-white border-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 h-6"
               disabled={!workflow.demoUrl}
             >
               Try
             </Button>
          </div>
        </div>
      </Card>
    </motion.div>
    
    {/* 体验弹窗 */}
    <WorkflowExperience
      workflow={workflow}
      isOpen={showExperience}
      onClose={() => setShowExperience(false)}
    />
    </>
  );
}
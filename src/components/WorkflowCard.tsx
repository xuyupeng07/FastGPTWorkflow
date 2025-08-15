'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Workflow } from '@/lib/types';

import { LikeAnimation } from '@/components/LikeAnimation';
import { ClientOnlyWrapper, useSafeEventHandler } from '@/components/HydrationSafeWrapper';
import { motion } from 'framer-motion';
import { Users, Heart, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getUserSessionId } from '@/lib/userSession';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

import { getApiUrl } from '@/lib/config';

interface WorkflowCardProps {
  workflow: Workflow;
  index?: number;
  onDataUpdate?: (() => void) | undefined; // 新增：数据更新回调
}

export function WorkflowCard({ workflow, index = 0 }: WorkflowCardProps) {
  // 客户端渲染状态 - 必须在最前面声明
  const [isClient, setIsClient] = useState(false);
  const { isAuthenticated } = useAuth();
  const logoRef = useRef<HTMLDivElement>(null);
  

  const [copySuccess, setCopySuccess] = useState(false);
  const [copying, setCopying] = useState(false);
  const [cachedConfig, setCachedConfig] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(workflow.likeCount || 0);
  const [liking, setLiking] = useState(false);
  const [userSessionId, setUserSessionId] = useState<string>('');
  const [usageCount, setUsageCount] = useState(workflow.usageCount || 0);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [hasJsonConfig, setHasJsonConfig] = useState<boolean | null>(null);
  
  // 初始化客户端状态
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCopyJson = useSafeEventHandler(useCallback(async (e?: React.MouseEvent) => {
    // 阻止事件冒泡和默认行为，防止页面刷新
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (copying || !isClient) return; // 防止重复点击和确保在客户端
    
    // 检查登录状态
    if (!isAuthenticated) {
      toast.error('请先登录后再使用复制功能');
      return;
    }
    
    // 检查是否有JSON配置
    if (hasJsonConfig === false) {
      toast.error('该工作流没有配置JSON');
      return;
    }
    
    try {
      setCopying(true);
      
      // 优先使用缓存的配置
      if (cachedConfig) {
        await navigator.clipboard.writeText(cachedConfig);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        
        // 记录copy行为
        if (userSessionId) {
          try {
            await recordUserAction('copy');
            // API调用成功后，乐观更新使用数量
            setUsageCount(prev => prev + 1);
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
        
        // 记录copy行为
        if (userSessionId) {
          try {
            await recordUserAction('copy');
            // API调用成功后，乐观更新使用数量
            setUsageCount(prev => prev + 1);
          } catch (error) {
            console.error('记录copy行为失败:', error);
          }
        }
        return;
      }
      
      // 如果没有JSON源码，从API获取配置数据
      const API_BASE_URL = getApiUrl();
      const response = await fetch(`${API_BASE_URL}/workflows/${workflow.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        let jsonString = '';
        
        // 优先使用json_source，如果没有则尝试使用config
        if (result.data.json_source) {
          try {
            // 尝试解析并格式化JSON
            const parsed = JSON.parse(result.data.json_source);
            jsonString = JSON.stringify(parsed, null, 2);
          } catch {
            // 如果解析失败，直接使用原始字符串
            jsonString = result.data.json_source;
          }
        } else if (result.data.config) {
          jsonString = JSON.stringify(result.data.config, null, 2);
        } else {
          throw new Error('工作流没有可用的配置数据');
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
      } else {
        throw new Error(result.message || '无法获取配置数据');
      }
    } catch (err) {
      console.error('复制失败:', err);
      setCopySuccess(false);
      toast.error(`复制失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setCopying(false);
    }
  }, [copying, isClient, cachedConfig, workflow.json_source, workflow.id, userSessionId, hasJsonConfig]), [copying, isClient, cachedConfig, workflow.json_source, workflow.id, userSessionId, hasJsonConfig]);

  const handleTryWorkflow = useSafeEventHandler(useCallback((e: React.MouseEvent) => {
    // 阻止事件冒泡和默认行为，防止页面刷新
    e.preventDefault();
    e.stopPropagation();
    
    if (!isClient) return; // 确保在客户端
    
    // 根据登录状态选择不同的URL
    let targetUrl = null;
    if (isAuthenticated && workflow.no_login_url) {
      targetUrl = workflow.no_login_url;
    } else if (!isAuthenticated && workflow.demo_url) {
      targetUrl = workflow.demo_url;
    }
    
    if (targetUrl) {
      window.open(targetUrl, '_blank');
      
      // 记录try行为
      if (userSessionId) {
        recordUserAction('try')
          .then(() => {
            setUsageCount(prev => prev + 1);
          })
          .catch((_error) => {
            console.error('记录try行为失败:', _error);
          });
      }
    }
  }, [isClient, isAuthenticated, userSessionId, workflow.id, workflow.demo_url, workflow.no_login_url]), [isClient, isAuthenticated, userSessionId, workflow.id, workflow.demo_url, workflow.no_login_url]);



  // 记录用户行为的函数
  const recordUserAction = useCallback(async (actionType: string) => {
    try {
      const API_BASE_URL = getApiUrl();
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
    } catch (_error) {
      console.error('获取用户会话失败:', _error);
      throw _error; // 重新抛出错误，让调用者处理
    }
  }, [workflow.id, userSessionId]);

  // 本地缓存管理 - 永久保存点赞状态
  const getCachedLikeStatus = useCallback((workflowId: string | number, sessionId: string) => {
    if (!isClient) return null;
    try {
      const cacheKey = `like_status_${workflowId}_${sessionId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        // 如果缓存中显示已点赞，直接返回点赞状态
        if (data.liked) {
          return { liked: true, likeCount: data.likeCount };
        }
        return { liked: data.liked, likeCount: data.likeCount };
      }
    } catch (_error) {
      console.error('获取点赞状态失败:', _error);
    }
    return null;
  }, [isClient]);

  // 检测工作流是否有可用的JSON配置
  const checkJsonConfig = useCallback(async () => {
    try {
      // 首先检查本地是否有json_source
      if (workflow.json_source) {
        setHasJsonConfig(true);
        return;
      }
      
      // 如果没有本地json_source，检查API是否有配置数据
      const API_BASE_URL = getApiUrl();
      const response = await fetch(`${API_BASE_URL}/workflows/${workflow.id}`);
      
      if (!response.ok) {
        setHasJsonConfig(false);
        return;
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // 检查是否有json_source或config
        const hasConfig = !!(result.data.json_source || result.data.config);
        setHasJsonConfig(hasConfig);
      } else {
        setHasJsonConfig(false);
      }
    } catch (error) {
      console.error('检测JSON配置失败:', error);
      setHasJsonConfig(false);
    }
  }, [workflow.id, workflow.json_source]);

  const setCachedLikeStatus = useCallback((workflowId: string | number, sessionId: string, liked: boolean, likeCount: number) => {
    if (!isClient) return;
    try {
      const cacheKey = `like_status_${workflowId}_${sessionId}`;
      const data = {
        liked,
        likeCount,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (_error) {
      console.error('记录try行为失败:', _error);
    }
  }, [isClient]);

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
        const API_BASE_URL = getApiUrl();
        const response = await fetch(`${API_BASE_URL}/workflows/${workflow.id}/like-status?user_session_id=${sessionId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
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
        } else {
          // 如果响应不成功，使用默认值
          console.warn(`获取点赞状态失败，状态码: ${response.status}`);
        }
      } catch (_error) {
          // 网络错误时静默处理，使用缓存或默认值
          console.warn('获取点赞状态失败，使用默认值:', _error);
        // 不显示错误，保持现有状态
      }
    }, 100);
  }, [workflow.id, setCachedLikeStatus]);

  // 同步工作流使用数量
  useEffect(() => {
    setUsageCount(workflow.usageCount || 0);
  }, [workflow.usageCount]);


  
  // 初始化用户会话ID和点赞状态（仅在客户端）
  useEffect(() => {
    if (!isClient) return;
    
    const sessionId = getUserSessionId();
    setUserSessionId(sessionId);
    
    // 先从本地缓存获取点赞状态
    const cachedLikeStatus = getCachedLikeStatus(workflow.id, sessionId);
    if (cachedLikeStatus && cachedLikeStatus.liked) {
      // 如果缓存显示已点赞，直接设置状态
      setLiked(true);
      setLikeCount(cachedLikeStatus.likeCount);
    } else {
      // 获取最新状态
      if (sessionId) {
        fetchLikeStatus(sessionId);
      }
    }
    
    // 检测JSON配置
    checkJsonConfig();
    
    // 清理函数
    return () => {
      if (fetchLikeStatusRef.current) {
        clearTimeout(fetchLikeStatusRef.current);
      }
      if (handleLikeRef.current) {
        clearTimeout(handleLikeRef.current);
      }
    };
  }, [isClient, workflow.id, getCachedLikeStatus, fetchLikeStatus, checkJsonConfig]);





  // 防抖处理点赞
  const handleLikeRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleLike = useSafeEventHandler(useCallback(async () => {
    if (liking || !isClient || !userSessionId) return;
    
    // 防抖处理，防止重复点击
    if (handleLikeRef.current) {
      clearTimeout(handleLikeRef.current);
    }
    
    // 乐观更新：立即更新UI
    const originalLikeCount = likeCount;
    setLiked(true); // 点赞后爱心保持红色
    setLikeCount(prev => prev + 1);
    setLiking(true);
    
    // 触发点赞动画
    setShowLikeAnimation(true);
    setTimeout(() => setShowLikeAnimation(false), 1000);
    
    // 立即更新缓存
    setCachedLikeStatus(workflow.id, userSessionId, true, likeCount + 1);
    
    // 延迟50ms发送请求，给UI更新时间
    handleLikeRef.current = setTimeout(async () => {
      try {
        const API_BASE_URL = getApiUrl();
        
        const response = await fetch(`${API_BASE_URL}/workflows/${workflow.id}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_session_id: userSessionId
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          // 成功，保持乐观更新的状态
          setCachedLikeStatus(workflow.id, userSessionId, true, likeCount + 1);
        } else {
          // 失败，回滚点赞数量但保持爱心红色
          setLikeCount(originalLikeCount);
          console.error('点赞失败:', result.error);
        }
      } catch (_error) {
          // 网络错误，回滚点赞数量但保持爱心红色
          setLikeCount(originalLikeCount);
          console.error('点赞请求失败:', _error);
      } finally {
        setLiking(false);
      }
    }, 50);
  }, [liking, isClient, userSessionId, liked, likeCount, workflow.id, setCachedLikeStatus]), [liking, isClient, userSessionId, liked, likeCount, workflow.id, setCachedLikeStatus]);

  return (
    <ClientOnlyWrapper>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -2, scale: 1.005 }}
      className="workflow-card w-full h-48 sm:h-52 lg:h-56 group relative"
    >
      {workflow.is_featured && (
         <div className="absolute top-3 right-0 z-10">
           <div className="relative bg-gradient-to-r from-amber-50 via-yellow-100 to-amber-50 text-amber-700 px-1.5 py-0 rounded-tl-lg rounded-bl-lg shadow-sm backdrop-blur-sm overflow-hidden group">
             {/* 简洁光泽动效 */}
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/30 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-800 ease-out"></div>
             {/* 清新内部光效 */}
             <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent"></div>
             <span className="relative text-xs font-bold tracking-wide" style={{fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif', textShadow: '0 0.5px 1px rgba(180,83,9,0.15)'}}>VIP</span>
           </div>
         </div>
       )}
      <Card className="workflow-card h-full flex flex-col hover:shadow-md transition-all duration-300 border border-gray-100/50 bg-white rounded-xl overflow-hidden p-1 sm:p-1.5">
        {/* 主要内容区域 */}
        <div className="flex-1 px-3 sm:px-4 lg:px-5 pt-2 sm:pt-3 pb-1 sm:pb-1.5 overflow-hidden">
          {/* 顶部区域：logo和基本信息 */}
           <div className="flex gap-2 sm:gap-2.5 -mb-1">
             {/* 左侧logo */}
             <div ref={logoRef} className="w-14 h-14 flex items-center justify-center overflow-hidden rounded-lg border-2 border-transparent shadow-lg" style={{
               boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12), 0 3px 6px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
               background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)'
             }}>
               <Image
                src={workflow.thumbnail_image_id ? `/api/images/${workflow.thumbnail_image_id}` : '/fastgpt.svg'}
                alt={workflow.title}
                width={56}
                height={56}
                className="max-w-full max-h-full object-contain"
                style={{
                  imageRendering: 'auto'
                } as React.CSSProperties}
                unoptimized={workflow.thumbnail_image_id ? true : false}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/fastgpt.svg';
                }}
              />
             </div>
             
             {/* 右侧信息 */}
             <div className="flex-1 min-w-0">
               {/* 标题 */}
               <div className="mb-1">
                 <div className="flex items-center gap-1.5">
                   <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 line-clamp-1 flex-1">
                     {workflow.title}
                   </h3>
                 </div>
               </div>
               
               {/* 作者信息 */}
                <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 mt-0.5 sm:mt-1">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden">
                     <Image
                        src={(workflow.author?.name === 'FastGPT团队' || !workflow.author?.name) ? "/fastgpt.svg" : "/community.svg"}
                        alt={(workflow.author?.name === 'FastGPT团队' || !workflow.author?.name) ? "FastGPT" : "社区贡献者"}
                        width={20}
                        height={20}
                        className="max-w-full max-h-full object-contain"
                        style={{
                          imageRendering: 'auto'
                        } as React.CSSProperties}
                        unoptimized
                     />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    {/* 显示实际作者名称 */}
                    {workflow.author?.name || 'FastGPT团队'}
                  </span>
                  {/* 只有FastGPT团队才显示认证标志 */}
                  {(workflow.author?.name === 'FastGPT团队' || !workflow.author?.name) && (
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center ml-0.5">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
             </div>
           </div>
          
          {/* 描述 */}
          <Tooltip 
            content={workflow.description}
            side="top"
            align="center"
            anchorRef={logoRef}
            className="max-w-sm text-sm leading-relaxed bg-white text-gray-900 border-gray-200 shadow-xl"
          >
            <p className="text-xs sm:text-sm text-gray-500 line-clamp-4 sm:line-clamp-3 leading-relaxed mt-1 sm:mt-2 lg:mt-2.5 cursor-pointer">
              {workflow.description}
            </p>
          </Tooltip>
        </div>

        {/* 底部统计和操作 */}
        <div className="flex items-center justify-between px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 border-t border-gray-100 flex-shrink-0 bg-gray-50/30">
          {/* 统计信息 */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-0.5 sm:gap-1">
              <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span className="font-medium">{usageCount > 999 ? `${Math.floor(usageCount/1000)}k` : (usageCount || 0)}</span>
            </span>
            <div className="relative">
              <button 
                onClick={handleLike}
                disabled={liking}
                className={`flex items-center gap-1 transition-colors hover:text-red-500 ${
                  liked ? 'text-red-500' : 'text-gray-500'
                } ${liking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <Heart 
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-all ${
                    liked ? 'fill-current' : ''
                  } ${liking ? 'animate-pulse' : ''}`} 
                />
                <span className="font-medium">{likeCount || 0}</span>
              </button>
              
              {/* 点赞动画 */}
              <LikeAnimation
                isTriggered={showLikeAnimation}
                onComplete={() => setShowLikeAnimation(false)}
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-1 sm:gap-1.5">
            {/* 复制按钮 - 未登录时禁用并提示 */}
            <Tooltip 
              content={
                !isAuthenticated 
                  ? "登录后可复制工作流源码" 
                  : hasJsonConfig === false 
                    ? "该工作流没有配置源码，请联系管理员获取" 
                    : "复制源码"
              }
              side="bottom"
              align="center"
              className="text-xs bg-gray-900 text-white border-gray-700"
            >
              <Button 
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopyJson}
                disabled={!isAuthenticated || copying || hasJsonConfig === false}
                className={`border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg px-1.5 sm:px-2 lg:px-2.5 py-0.5 sm:py-1 text-xs font-medium transition-all duration-200 h-5 sm:h-6 ${
                  !isAuthenticated || copying || hasJsonConfig === false ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  copySuccess ? 'border-green-300 bg-green-50 text-green-700' : ''
                } ${
                  hasJsonConfig === false || !isAuthenticated ? 'bg-gray-100 text-gray-400' : ''
                }`}
              >
                {copying ? (
                  <>
                    <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 animate-spin" />
                    复制中...
                  </>
                ) : copySuccess ? (
                  <>
                    <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 text-green-600" />
                    已复制
                  </>
                ) : (
                  <>                  Copy                </>
                )}
              </Button>
            </Tooltip>
            <Tooltip 
               content={
                 (isAuthenticated && !workflow.no_login_url) 
                   ? "该工作流暂未配置体验链接，请联系管理员获取" 
                   : (!isAuthenticated && !workflow.demo_url)
                     ? "登录后可快速体验该工作流"
                     : isAuthenticated 
                       ? "快速体验" 
                       : "跳转至FastGPT登录页，扫码登录后系统将自动创建该工作流"
               }
               side="bottom"
               align="center"
               className="text-xs bg-gray-900 text-white border-gray-700"
             >
              <Button 
                 type="button"
                 size="sm"
                 onClick={handleTryWorkflow}
                 className={`border-0 rounded-lg px-1.5 sm:px-2 lg:px-2.5 py-0.5 sm:py-1 text-xs font-medium transition-all duration-200 h-5 sm:h-6 ${
                   (isAuthenticated && !workflow.no_login_url) || (!isAuthenticated && !workflow.demo_url)
                     ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                     : 'bg-gray-900 hover:bg-gray-800 text-white'
                 }`}
                 disabled={(isAuthenticated && !workflow.no_login_url) || (!isAuthenticated && !workflow.demo_url)}
               >
                 Try
               </Button>
            </Tooltip>
          </div>
        </div>
      </Card>
    </motion.div>
    

      </ClientOnlyWrapper>
  );
}
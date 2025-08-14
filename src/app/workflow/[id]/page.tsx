'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { JsonViewer } from '@/components/JsonViewer';
import { WorkflowExperience } from '@/components/WorkflowExperience';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Users, 
  Heart, 
  Share2, 
  Download, 
  Play, 
  ArrowLeft,
  Star,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Zap,
  Settings,
  Copy,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useWorkflow, useUserActions } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

import { getApiBaseUrl } from '@/lib/config';

export default function WorkflowDetailPage() {
  const params = useParams();
  const workflowId = params.id as string;
  const { data: workflow, loading, error, refetch } = useWorkflow(workflowId);
  const { recordAction, loading: actionLoading } = useUserActions();
  const { isAuthenticated } = useAuth();
  const [isExperiencing] = useState(false);
  const [showJsonViewer, setShowJsonViewer] = useState(false);
  const [showExperience, setShowExperience] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [likeSuccess, setLikeSuccess] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // 初始化客户端状态
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 调试信息显示
  const debugInfo = workflow ? {
    id: workflow.id,
    hasConfig: !!workflow.config,
    configType: typeof workflow.config,
    configKeys: workflow.config ? Object.keys(workflow.config) : [],
    nodesCount: workflow.config?.nodes?.length || 0,
    edgesCount: workflow.config?.edges?.length || 0,
    variablesCount: workflow.config?.variables?.length || 0,
    version: workflow.config?.version
  } : null;

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">加载工作流详情...</span>
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !workflow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {error ? '加载失败' : '工作流未找到'}
          </h1>
          <p className="text-gray-600 mb-8">
            {error || '抱歉，您访问的工作流不存在或已被删除。'}
          </p>
          <div className="space-x-4">
            <Button onClick={() => refetch()} variant="outline">
              重试
            </Button>
            <Link href="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回首页
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleExperience = (e?: React.MouseEvent) => {
    // 阻止事件冒泡和默认行为，防止页面刷新
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setShowExperience(true);
    
    // 乐观更新：立即增加使用数量
    if (workflow) {
      // 这里可以添加乐观更新逻辑，比如更新本地状态
      // setUsageCount(prev => prev + 1); // 如果有使用数量状态的话
    }
  };

  const handleCopyJson = async (e?: React.MouseEvent) => {
    // 阻止事件冒泡和默认行为，防止页面刷新
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // 检查登录状态
    if (!isAuthenticated) {
      toast.error('请先登录后再使用复制功能');
      return;
    }
    
    if (!workflow || !isClient) return;
    
    try {
      // 直接从API获取最新数据
      const API_BASE_URL = getApiBaseUrl();
      const response = await fetch(`${API_BASE_URL}/api/workflows/${workflow.id}`);
      const result = await response.json();
      
      if (result.success && result.data.config) {
        const jsonString = JSON.stringify(result.data.config, null, 2);
        await navigator.clipboard.writeText(jsonString);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        
        // 乐观更新：立即增加使用数量
        // 这里可以添加乐观更新逻辑，比如更新本地状态
        // setUsageCount(prev => prev + 1); // 如果有使用数量状态的话
        
        // 记录复制操作
        await recordAction(workflow.id, 'copy');
      } else {
        throw new Error('无法获取配置数据');
      }
    } catch (_error) {
      console.error('记录行为失败:', _error);
    }
  };

  const handleLike = async () => {
    try {
      await recordAction(workflowId, 'like');
      setLikeSuccess(true);
      setTimeout(() => setLikeSuccess(false), 2000);
    } catch (err) {
      console.error('点赞失败:', err);
    }
  };





  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-8">
        {/* 调试信息显示 */}
          {debugInfo && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-yellow-800">🔍 调试信息</h3>
                <button
                  onClick={() => refetch()}
                  className="text-xs bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-2 py-1 rounded"
                >
                  强制刷新
                </button>
              </div>
              <div className="text-xs text-yellow-700 space-y-1">
                <div>工作流ID: {debugInfo.id}</div>
                <div>配置存在: {debugInfo.hasConfig ? '是' : '否'}</div>
                <div>配置类型: {debugInfo.configType}</div>
                <div>配置键: {debugInfo.configKeys.join(', ')}</div>
                <div>节点数量: {debugInfo.nodesCount}</div>
                <div>边数量: {debugInfo.edgesCount}</div>
                <div>变量数量: {debugInfo.variablesCount}</div>
                <div>版本: {debugInfo.version}</div>
              </div>
            </div>
          )}
        
        {/* 返回按钮 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Link href="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回工作流列表
            </Button>
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 主要内容区域 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 工作流基本信息 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary">{workflow.category.toString()}</Badge>
                  </div>
                  <CardTitle className="text-3xl font-bold text-gray-800">
                    {workflow.title}
                  </CardTitle>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {workflow.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{(workflow.usageCount || 0).toLocaleString()} 次使用</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{workflow.likeCount?.toLocaleString() || 0} 点赞</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
      
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      <span>4.8 评分</span>
                    </div>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex flex-wrap gap-3">
                    {/* 复制按钮 - 未登录时禁用并提示 */}
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={(e) => handleCopyJson(e)}
                      disabled={!isAuthenticated}
                      className={`px-6 ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={!isAuthenticated ? '登录后开放复制功能' : ''}
                    >
                      {copySuccess ? (
                         <>
                           <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                           复制成功
                         </>
                       ) : (
                         <>
                           <Copy className="w-4 h-4 mr-2" />
                           复制 JSON
                         </>
                       )}
                    </Button>
                    
                    <Button 
                      type="button"
                      size="lg" 
                      onClick={(e) => handleExperience(e)}
                      disabled={isExperiencing}
                      className="px-6"
                    >
                      {isExperiencing ? (
                        <>
                          <Settings className="w-4 h-4 mr-2 animate-spin" />
                          体验中...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          立即体验
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setShowJsonViewer(!showJsonViewer)}
                      className="px-6"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {showJsonViewer ? '隐藏' : '查看'} JSON 配置
                    </Button>
                    
                    <Button variant="outline" className="px-6">
                      <Share2 className="w-4 h-4 mr-2" />
                      分享
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="px-6"
                      onClick={handleLike}
                      disabled={actionLoading}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${likeSuccess ? 'fill-red-500 text-red-500' : ''}`} />
                      {likeSuccess ? '已点赞' : '收藏'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* JSON 配置查看器 */}
            {showJsonViewer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <JsonViewer config={workflow.config} />
              </motion.div>
            )}

            {/* 详细说明 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    详细说明
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <h3>功能特点</h3>
                    <ul>
                      <li>智能对话处理，支持多轮对话上下文</li>
                      <li>自动意图识别和分类</li>
                      <li>集成知识库检索功能</li>
                      <li>支持自定义回复模板</li>
                      <li>实时数据分析和统计</li>
                    </ul>
                    
                    <h3>使用场景</h3>
                    <p>
                      适用于电商客服、技术支持、产品咨询等多种客服场景。
                      通过智能化的对话处理，能够大幅提升客服效率，
                      减少人工干预，提供7x24小时的优质服务体验。
                    </p>
                    
                    <h3>配置说明</h3>
                    <p>
                      该工作流包含 {workflow.config.nodes.length} 个节点和 {workflow.config.edges.length} 条连接，
                      支持 {workflow.config.variables.length} 个自定义变量。
                      您可以根据实际需求调整节点配置和变量设置。
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 快速信息 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">快速信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">创建时间</span>
                    <span className="font-medium">2024-01-15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">更新时间</span>
                    <span className="font-medium">2024-01-20</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">版本</span>
                    <span className="font-medium">v1.2.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">作者</span>
                    <span className="font-medium">FastGPT Team</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">许可证</span>
                    <span className="font-medium">MIT</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 相关工作流 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">相关工作流</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { title: '内容创作助手', category: '内容创作' },
                    { title: '数据分析工具', category: '数据分析' },
                    { title: '邮件自动回复', category: '办公自动化' }
                  ].map((item, index) => (
                    <div key={index} className="p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="font-medium text-sm">{item.title}</div>
                      <div className="text-xs text-gray-500">{item.category}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* 使用统计 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    使用统计
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>本周使用</span>
                      <span>1,234 次</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>用户满意度</span>
                      <span>96%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '96%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>成功率</span>
                      <span>98.5%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '98.5%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* 体验弹窗 */}
      <WorkflowExperience
        workflow={workflow}
        isOpen={showExperience}
        onClose={() => setShowExperience(false)}
      />
    </div>
  );
}
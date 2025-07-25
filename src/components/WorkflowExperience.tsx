'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Workflow } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2,
  MessageSquare,
  Zap,
  ArrowUp
} from 'lucide-react';

interface WorkflowExperienceProps {
  workflow: Workflow;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export function WorkflowExperience({ workflow, isOpen, onClose }: WorkflowExperienceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: `您好！欢迎体验「${workflow.title}」工作流。我是您的AI助手，请告诉我您需要什么帮助？`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // 模拟AI响应
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: generateBotResponse(inputValue, workflow),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 2000);
  };

  const generateBotResponse = (userInput: string, workflow: Workflow): string => {
    const responses = {
      'customer-service': [
        '我理解您的问题。根据我们的知识库，这个问题的解决方案是...',
        '感谢您的咨询！让我为您查找相关信息...',
        '这是一个常见问题，我来为您详细解答...'
      ],
      'content-creation': [
        '我来为您创作一段精彩的内容...',
        '基于您的需求，我建议以下创作思路...',
        '让我为您生成一些创意想法...'
      ],
      'data-analysis': [
        '正在分析您提供的数据...',
        '根据数据分析结果，我发现以下趋势...',
        '让我为您生成详细的分析报告...'
      ]
    };

    const categoryId = typeof workflow.category === 'object' ? workflow.category.id : workflow.category;
    const categoryResponses = responses[categoryId as keyof typeof responses] || [
      '我正在处理您的请求...',
      '让我为您提供专业的解答...',
      '基于工作流配置，我来为您解决这个问题...'
    ];

    return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
            <div className="relative flex items-center justify-between p-8 border-b border-gray-200/50">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    {workflow.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                     <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0 font-medium">
                       {typeof workflow.category === 'object' ? workflow.category.name : workflow.category}
                     </Badge>
                    <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                      实时体验
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-full w-10 h-10 p-0 hover:bg-gray-100/80 transition-all duration-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </Button>
            </div>
          </div>

          {/* 消息区域 */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-gradient-to-b from-gray-50/30 to-white/50">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.1,
                  type: "spring",
                  bounce: 0.1
                }}
                className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'bot' && (
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                )}
                
                <div className={`max-w-[75%] ${message.type === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`relative p-4 rounded-3xl shadow-sm ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white ml-auto'
                        : 'bg-white/80 backdrop-blur-sm text-gray-800 border border-gray-200/50'
                    }`}
                  >
                    <p className="text-sm leading-relaxed font-medium">{message.content}</p>
                    {message.type === 'user' && (
                      <div className="absolute -bottom-2 -right-2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-purple-600" />
                    )}
                    {message.type === 'bot' && (
                      <div className="absolute -bottom-2 -left-2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-white" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 px-4 font-medium">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                
                {message.type === 'user' && (
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 justify-start"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-3xl border border-gray-200/50 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-sm text-gray-600 font-medium">AI正在思考中...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-transparent" />
            <div className="relative p-8 border-t border-gray-200/50">
              <div className="flex gap-4 items-end">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入您的问题或需求..."
                    className="w-full pl-4 pr-12 py-4 text-base border-2 border-gray-200/50 rounded-2xl bg-white/80 backdrop-blur-sm focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 shadow-sm"
                    disabled={isLoading}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                      <ArrowUp className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="h-12 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
              
              <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <MessageSquare className="w-4 h-4" />
                  <span className="font-medium">这是一个演示环境，实际效果可能有所不同</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Enter</kbd>
                  <span>发送消息</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
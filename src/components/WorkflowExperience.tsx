'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Workflow } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import Image from 'next/image';

interface WorkflowExperienceProps {
  workflow: Workflow;
  isOpen: boolean;
  onClose: () => void;
}

export function WorkflowExperience({ workflow, isOpen, onClose }: WorkflowExperienceProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 检查用户登录状态
  const isLoggedIn = isClient && typeof window !== 'undefined' ? localStorage.getItem('isLoggedIn') === 'true' : false;
  
  // 根据登录状态选择URL
  const getTargetUrl = () => {
    if (isLoggedIn && workflow.no_login_url) {
      return workflow.no_login_url;
    } else if (workflow.demo_url) {
      return workflow.demo_url;
    }
    return null;
  };
  
  const targetUrl = getTargetUrl();
  
  const handleOpenInNewTab = () => {
    if (targetUrl) {
      window.open(targetUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 10 }}
          transition={{ type: "spring", duration: 0.3, bounce: 0.05 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200/80 w-full max-w-[90vw] h-[85vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50/50 to-blue-50/30">
            <div className="flex-1"></div>
            <div className="flex items-center justify-center">
              <Image
                src="/fastgpt-withtext.svg"
                alt="FastGPT"
                width={160}
                height={42}
                className="object-contain"
              />
            </div>
            <div className="flex-1 flex justify-end">
              <div className="flex items-center gap-2">
                {targetUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenInNewTab}
                    className="rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors duration-200 border-gray-200"
                  >
                    <ExternalLink className="w-4 h-4 mr-1.5" />
                    新窗口打开
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="rounded-lg w-8 h-8 p-0 hover:bg-gray-100 transition-colors duration-200"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </Button>
              </div>
            </div>
          </div>

          {/* iframe 内容区域 */}
          <div className="flex-1 p-4 bg-gray-50/30">
            {targetUrl ? (
              <div className="w-full h-full rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-white">
                <iframe 
                  src={targetUrl}
                  style={{ width: '100%', height: '100%' }}
                  frameBorder="0"
                  allow="microphone *; camera *; geolocation *; autoplay *"
                  className="bg-white"
                  title={`${workflow.title} - 工作流体验`}
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white rounded-xl border border-gray-200">
                <div className="text-center space-y-3 p-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-700 mb-1">暂无体验链接</h3>
                    <p className="text-gray-500 text-sm max-w-sm">
                      该工作流暂时没有配置体验链接，请联系管理员添加演示URL或免登录链接。
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
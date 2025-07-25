'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FastGPTWorkflowConfig } from '@/lib/types';
import { motion } from 'framer-motion';

interface JsonViewerProps {
  config: FastGPTWorkflowConfig;
  title?: string;
}

export function JsonViewer({ config, title = "工作流配置" }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const jsonString = JSON.stringify(config, null, 2);
  const previewLines = jsonString.split('\n').slice(0, 10);
  const isLongContent = jsonString.split('\n').length > 10;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const downloadJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              JSON
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {jsonString.length} 字符
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 配置统计 */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{config.nodes?.length || 0}</div>
            <div className="text-sm text-gray-600">节点</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{config.edges?.length || 0}</div>
            <div className="text-sm text-gray-600">连接</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{config.variables?.length || 0}</div>
            <div className="text-sm text-gray-600">变量</div>
          </div>
        </div>

        {/* JSON 代码展示 */}
        <div className="relative">
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
            <code>
              {isExpanded || !isLongContent 
                ? jsonString 
                : previewLines.join('\n') + '\n...'}
            </code>
          </pre>
          
          {/* 展开/收起按钮 */}
          {isLongContent && (
            <div className="absolute bottom-4 right-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                {isExpanded ? '收起' : '展开全部'}
              </Button>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1"
          >
            <Button 
              onClick={copyToClipboard}
              className="w-full"
              variant={copied ? "secondary" : "default"}
            >
              {copied ? (
                <>
                  <span className="mr-2">✓</span>
                  已复制
                </>
              ) : (
                <>
                  <span className="mr-2">📋</span>
                  复制 JSON
                </>
              )}
            </Button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              onClick={downloadJson}
              variant="outline"
            >
              <span className="mr-2">💾</span>
              下载
            </Button>
          </motion.div>
        </div>

        {/* 使用提示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 使用提示</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 复制JSON配置到FastGPT平台导入</li>
            <li>• 可以修改变量值来适配你的需求</li>
            <li>• 建议在测试环境先验证配置</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
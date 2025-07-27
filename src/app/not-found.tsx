'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Home, Search } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl mx-auto"
        >
          {/* 404 图标 */}
          <div className="mb-8">
            <div className="text-8xl mb-4">🤖</div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
              404
            </h1>
          </div>
          
          {/* 错误信息 */}
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            页面未找到
          </h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            抱歉，您访问的页面不存在或已被删除。
            让我们帮您找到正确的方向！
          </p>
          
          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/">
              <Button size="lg" className="px-8 py-3 text-lg">
                <Home className="w-5 h-5 mr-2" />
                返回首页
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                <Search className="w-5 h-5 mr-2" />
                浏览工作流
              </Button>
            </Link>
          </div>
          
          {/* 建议链接 */}
          <div className="mt-12 p-6 bg-white/50 rounded-xl border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              您可能在寻找：
            </h3>
            <div className="grid sm:grid-cols-2 gap-3 text-left">
              <Link href="/" className="flex items-center gap-2 p-3 rounded-lg hover:bg-white/70 transition-colors">
                <span className="text-2xl">🤖</span>
                <div>
                  <div className="font-medium text-gray-800">智能客服助手</div>
                  <div className="text-sm text-gray-600">热门工作流</div>
                </div>
              </Link>
              <Link href="/" className="flex items-center gap-2 p-3 rounded-lg hover:bg-white/70 transition-colors">
                <span className="text-2xl">✍️</span>
                <div>
                  <div className="font-medium text-gray-800">内容创作助手</div>
                  <div className="text-sm text-gray-600">创意工具</div>
                </div>
              </Link>
              <Link href="/" className="flex items-center gap-2 p-3 rounded-lg hover:bg-white/70 transition-colors">
                <span className="text-2xl">📊</span>
                <div>
                  <div className="font-medium text-gray-800">数据分析工具</div>
                  <div className="text-sm text-gray-600">分析助手</div>
                </div>
              </Link>
              <Link href="/" className="flex items-center gap-2 p-3 rounded-lg hover:bg-white/70 transition-colors">
                <span className="text-2xl">⚡</span>
                <div>
                  <div className="font-medium text-gray-800">自动化流程</div>
                  <div className="text-sm text-gray-600">效率工具</div>
                </div>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* 装饰性背景 */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>
    </div>
  );
}
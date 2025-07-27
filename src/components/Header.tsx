'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Search, Star } from 'lucide-react';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [starCount, setStarCount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  const fetchGitHubStars = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://api.github.com/repos/labring/FastGPT');
      if (response.ok) {
        const data = await response.json();
        const stars = data.stargazers_count;
        // 格式化星数显示
        if (stars >= 1000) {
          setStarCount(`${(stars / 1000).toFixed(1)}k`);
        } else {
          setStarCount(stars.toString());
        }
      }
    } catch (error) {
      console.error('Failed to fetch GitHub stars:', error);
      // 保持默认值
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchGitHubStars();
    // 每5分钟更新一次星数
    const interval = setInterval(fetchGitHubStars, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 防止水合不匹配 - 在客户端挂载前显示静态版本
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image
              src="/fastgpt-withtext.svg"
              alt="FastGPT"
              width={140}
              height={36}
              className="h-8 sm:h-9 w-auto object-contain"
              priority
              suppressHydrationWarning
            />
          </Link>

          {/* 中间搜索栏 - 在小屏幕上隐藏 */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="搜索 AI 工作流模板..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 text-sm"
              />
            </div>
          </div>

          {/* 右侧按钮 */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* GitHub按钮 - 在小屏幕上简化显示 */}
            <Button variant="ghost" size="sm" asChild>
              <a href="https://github.com/labring/FastGPT" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 hover:bg-gray-100 hover:scale-105 transition-all duration-200 rounded-md group">
                <Image
                  src="/github.png"
                  alt="GitHub"
                  width={18}
                  height={18}
                  className="w-4 h-4 sm:w-5 sm:h-5 opacity-80 group-hover:opacity-100 transition-opacity duration-200"
                  suppressHydrationWarning
                />
                <span className="hidden sm:inline text-sm sm:text-base font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">GitHub</span>
              </a>
            </Button>
            <Button size="sm" asChild className="bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg px-3 sm:px-4 text-sm">
              <a href="https://cloud.fastgpt.cn/login" target="_blank" rel="noopener noreferrer">
                <span className="hidden sm:inline">开始使用</span>
                <span className="sm:hidden">使用</span>
              </a>
            </Button>
          </div>
        </div>
        
        {/* 移动端搜索栏 */}
        <div className="md:hidden border-t bg-white/95 backdrop-blur">
          <div className="container mx-auto px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="搜索 AI 工作流模板..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 text-sm"
              />
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <Image
            src="/fastgpt-withtext.svg"
            alt="FastGPT"
            width={140}
            height={36}
            className="h-8 sm:h-9 w-auto object-contain"
            priority
            suppressHydrationWarning
          />
        </Link>

        {/* 中间搜索栏 - 在小屏幕上隐藏 */}
        <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="搜索 AI 工作流模板..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 text-sm"
            />
          </div>
        </div>

        {/* 右侧按钮 */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* GitHub按钮 - 在小屏幕上简化显示 */}
          <Button variant="ghost" size="sm" asChild>
            <a href="https://github.com/labring/FastGPT" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 hover:bg-gray-100 hover:scale-105 transition-all duration-200 rounded-md group">
              <Image
                src="/github.png"
                alt="GitHub"
                width={18}
                height={18}
                className="w-4 h-4 sm:w-5 sm:h-5 opacity-80 group-hover:opacity-100 transition-opacity duration-200"
                suppressHydrationWarning
              />
              <span className="hidden sm:inline text-sm sm:text-base font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">GitHub</span>
              {mounted && (
                <div className="hidden sm:flex items-center gap-1 ml-1">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 group-hover:text-yellow-500 transition-colors duration-200" />
                  <span className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
                    {!isLoading && starCount ? starCount : '...'}
                  </span>
                </div>
              )}
            </a>
          </Button>
          <Button size="sm" asChild className="bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg px-3 sm:px-4 text-sm">
            <a href="https://cloud.fastgpt.cn/login" target="_blank" rel="noopener noreferrer">
              <span className="hidden sm:inline">开始使用</span>
              <span className="sm:hidden">使用</span>
            </a>
          </Button>
        </div>
      </div>
      
      {/* 移动端搜索栏 */}
      <div className="md:hidden border-t bg-white/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="搜索 AI 工作流模板..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 text-sm"
            />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
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
    fetchGitHubStars();
    // 每5分钟更新一次星数
    const interval = setInterval(fetchGitHubStars, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60"
    >
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/fastgpt-withtext.svg"
            alt="FastGPT"
            width={140}
            height={36}
            className="h-13 w-auto object-contain"
          />
        </Link>

        {/* 中间搜索栏 */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="搜索 AI 工作流模板..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10"
            />
          </div>
        </div>

        {/* 右侧按钮 */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" asChild>
            <a href="https://github.com/labring/FastGPT" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 hover:scale-105 transition-all duration-200 rounded-md group">
              <Image
                src="/github.png"
                alt="GitHub"
                width={18}
                height={18}
                className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity duration-200"
              />
              <span className="text-base font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">GitHub</span>
              {!isLoading && starCount && (
                <div className="flex items-center gap-1 ml-1">
                  <Star className="w-4 h-4 text-gray-600 group-hover:text-yellow-500 transition-colors duration-200" />
                  <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors duration-200">{starCount}</span>
                </div>
              )}
            </a>
          </Button>
          <Button size="sm" asChild className="bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg">
            <a href="https://cloud.fastgpt.cn/login" target="_blank" rel="noopener noreferrer">
              开始使用
            </a>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
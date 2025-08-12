'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClientOnlyWrapper, useSafeEventHandler } from '@/components/HydrationSafeWrapper';
import { motion } from 'framer-motion';
import { Search, Star, LogIn, User, LogOut, UserPlus } from 'lucide-react';
import { HeaderBackground } from './HeaderBackground';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [starCount, setStarCount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  const handleSearchChange = useSafeEventHandler((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  }, [onSearch]);

  const fetchGitHubStars = async () => {
    try {
      setIsLoading(true);
      
      // 检查本地缓存
      const cachedData = localStorage.getItem('github-stars-cache');
      const cacheTime = localStorage.getItem('github-stars-cache-time');
      const now = Date.now();
      
      // 如果缓存存在且未过期（30分钟），使用缓存数据
      if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 30 * 60 * 1000) {
        setStarCount(cachedData);
        setIsLoading(false);
        return;
      }
      
      const response = await fetch('https://api.github.com/repos/labring/FastGPT', {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const stars = data.stargazers_count;
        
        // 格式化星数显示
        const formattedStars = stars >= 1000 
          ? `${(stars / 1000).toFixed(1)}k` 
          : stars.toString();
        
        setStarCount(formattedStars);
        
        // 缓存数据
        localStorage.setItem('github-stars-cache', formattedStars);
        localStorage.setItem('github-stars-cache-time', now.toString());
      } else if (response.status === 403) {
        // API速率限制，使用缓存或默认值
        console.warn('GitHub API rate limit exceeded');
        setStarCount(cachedData || '25.2k');
      } else {
        // 其他API错误
        console.warn(`GitHub API error: ${response.status}`);
        setStarCount(cachedData || '25.2k');
      }
    } catch (error) {
      console.error('Failed to fetch GitHub stars:', error);
      
      // 尝试使用缓存数据
      const cachedData = localStorage.getItem('github-stars-cache');
      setStarCount(cachedData || '25.2k');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGitHubStars();
    // 每30分钟更新一次星数，减少API请求频率
    const interval = setInterval(fetchGitHubStars, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('注销失败:', error);
    }
  };

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full border-b border-blue-200/30 bg-gradient-to-r from-slate-50/95 via-blue-50/95 to-slate-50/95 backdrop-blur-xl supports-[backdrop-filter]:bg-gradient-to-r supports-[backdrop-filter]:from-slate-50/80 supports-[backdrop-filter]:via-blue-50/80 supports-[backdrop-filter]:to-slate-50/80 shadow-lg shadow-blue-100/20 relative overflow-hidden"
    >
      <HeaderBackground />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 h-16 flex items-center justify-between relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <Image
            src="/fastgpt-withtext.svg"
            alt="FastGPT"
            width={180}
            height={46}
            className="h-10 sm:h-11 lg:h-12 w-auto object-contain"
            priority
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
              <ClientOnlyWrapper fallback={null}>
                <div className="hidden sm:flex items-center gap-1 ml-1">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 group-hover:text-yellow-500 transition-colors duration-200" />
                  <span className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
                    {isLoading ? '...' : starCount}
                  </span>
                </div>
              </ClientOnlyWrapper>
            </a>
          </Button>
          <Button size="sm" asChild className="bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg px-3 sm:px-4 text-sm">
            <a href="https://cloud.fastgpt.cn/login" target="_blank" rel="noopener noreferrer">
              <span className="hidden sm:inline">开始使用</span>
              <span className="sm:hidden">使用</span>
            </a>
          </Button>
          
          <ClientOnlyWrapper fallback={
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                asChild
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 hover:bg-gray-100 hover:scale-105 transition-all duration-200 rounded-md text-gray-700 hover:text-gray-900"
              >
                <Link href="/login">
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">登录</span>
                </Link>
              </Button>

            </div>
          }>
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-sm text-gray-700">欢迎, {user?.username}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 hover:bg-gray-100 hover:scale-105 transition-all duration-200 rounded-md text-gray-700 hover:text-gray-900"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">登出</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 hover:bg-gray-100 hover:scale-105 transition-all duration-200 rounded-md text-gray-700 hover:text-gray-900"
                >
                  <Link href="/login">
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm">登录</span>
                  </Link>
                </Button>

              </div>
            )}
          </ClientOnlyWrapper>
        </div>
      </div>
      
      {/* 移动端搜索栏 */}
      <div className="md:hidden border-t border-blue-200/30 bg-gradient-to-r from-slate-50/95 via-blue-50/95 to-slate-50/95 backdrop-blur-xl relative">
        <HeaderBackground />
        <div className="container mx-auto px-4 py-3 relative z-10">
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
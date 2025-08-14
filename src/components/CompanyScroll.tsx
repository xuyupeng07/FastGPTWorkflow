'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

// 公司数据接口
interface Company {
  id: string;
  name: string;
  logo: string;
  website: string;
}

// 公司数据
const companies: Company[] = [
  {
    id: 'xiwang',
    name: '希望软件',
    logo: '/companies/希望软件.svg',
    website: ''
  },
  {
    id: 'alibaba',
    name: '阿里巴巴',
    logo: '/companies/阿里巴巴.svg',
    website: 'https://www.alibaba.com'
  },
  {
    id: 'ningde',
    name: '宁德时代',
    logo: '/companies/宁德时代.svg',
    website: 'https://www.catl.com'
  },
  {
    id: 'china-tobacco',
    name: '中国烟草',
    logo: '/companies/中国烟草logo.svg',
    website: '#'
  },
  {
    id: 'china-telecom',
    name: '中国电信',
    logo: '/companies/中国电信.svg',
    website: 'https://www.chinatelecom.com.cn'
  },
  {
    id: 'china-unicom',
    name: '中国联通',
    logo: '/companies/中国联通.svg',
    website: 'https://www.chinaunicom.com.cn'
  },
  {
    id: 'hikvision',
    name: '中电海康',
    logo: '/companies/中电海康.png',
    website: 'https://www.hikvision.com'
  },
  {
    id: 'beijing-electric',
    name: '北京电建',
    logo: '/companies/北京电建.png',
    website: '#'
  },
  {
    id: 'crb',
    name: '华润啤酒',
    logo: '/companies/华润啤酒.png',
    website: 'https://www.crbeer.com.cn'
  },
  {
    id: 'tianli-education',
    name: '天立教育',
    logo: '/companies/天立教育.png',
    website: 'https://www.tianlieducation.com/about.html'
  },
  {
    id: 'guangzhou-college',
    name: '广州华商学院',
    logo: '/companies/广州华商学院.png',
    website: 'https://www.gdhsc.edu.cn/'
  },
  {
    id: 'ao-smith',
    name: 'AO史密斯',
    logo: '/companies/AO史密斯.png',
    website: 'https://www.aosmith.com.cn'
  },
  {
    id: 'eduhk',
    name: '香港教育大学',
    logo: '/companies/香港教育大学.png',
    website: 'https://www.eduhk.hk'
  }
];

interface CompanyScrollProps {
  direction?: 'left' | 'right';
  speed?: number; // 滚动速度（像素/秒）
  className?: string;
}

export function CompanyScroll({ 
  direction = 'right', 
  speed = 30,
  className = '' 
}: CompanyScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 状态管理 - 参考test.md的优化实现
  const stateRef = useRef({
    speed: speed / 10,  // 滚动速度，将传入的speed除以10以适配动画帧率
    isRunning: true,    // 是否运行
    direction: direction === 'left' ? -1 : 1, // 1: 向右, -1: 向左
    position: 0,        // 当前位置
    itemWidth: 120,     // 单个项目宽度
    itemsCount: companies.length, // 项目数量
    totalWidth: 0,      // 总宽度(原始项目)
    lastFrameTime: 0,   // 上一帧时间戳
    isInitialized: false // 是否完成初始化
  });

  // 入场动画检测
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // 渐进式创建公司项 - 避免一次性DOM操作过多
  const createItemsProgressive = useCallback((index = 0) => {
    const track = scrollRef.current;
    if (!track) return;
    
    if (index >= companies.length * 2) { // 原始项+复制项
      // 所有项目创建完成后计算尺寸并开始动画
      const firstItem = track.querySelector('.company-item') as HTMLElement;
      if (firstItem) {
        stateRef.current.itemWidth = firstItem.offsetWidth + 32; // 包含margin
        stateRef.current.totalWidth = stateRef.current.itemWidth * stateRef.current.itemsCount;
        stateRef.current.isInitialized = true;
      }
      return;
    }
    
    // 创建单个项目
    const company = companies[index % companies.length];
    const item = document.createElement('div');
    item.className = 'company-item flex-shrink-0 flex items-center justify-center p-3 mx-4 rounded-lg';
    item.innerHTML = `
      <div class="w-24 h-12 relative">
        <img
          src="${company.logo}"
          alt="${company.name}"
          class="w-full h-full object-contain filter"
          loading="lazy"
        />
      </div>
    `;
    track.appendChild(item);
    
    // 下一帧继续创建，避免阻塞主线程
    requestAnimationFrame(() => createItemsProgressive(index + 1));
  }, []);

  // 优化的动画循环
  const animate = useCallback((timestamp: number) => {
    const state = stateRef.current;
    const track = scrollRef.current;
    
    // 未初始化完成不执行动画
    if (!state.isInitialized || !track) {
      requestAnimationFrame(animate);
      return;
    }
    
    // 计算时间差
    if (!state.lastFrameTime) state.lastFrameTime = timestamp;
    const deltaTime = timestamp - state.lastFrameTime;
    const frameInterval = 16; // 约60fps
    
    if (deltaTime >= frameInterval) {
      if (state.isRunning) {
        // 计算移动距离
        const moveDistance = (state.speed * deltaTime) / frameInterval;
        state.position += state.direction * moveDistance;
        
        // 循环逻辑
        if (state.position >= state.totalWidth) {
          state.position -= state.totalWidth;
        } else if (state.position <= 0) {
          state.position += state.totalWidth;
        }
        
        // 应用位置
        track.style.transform = `translateX(-${state.position}px)`;
      }
      // 无论是否运行都要更新时间戳，避免暂停后恢复时跳跃
      state.lastFrameTime = timestamp;
    }
    
    requestAnimationFrame(animate);
  }, []);

  // 初始化和动画启动
  useEffect(() => {
    if (!isVisible || !scrollRef.current) return;
    
    // 清空容器
    scrollRef.current.innerHTML = '';
    stateRef.current.isInitialized = false;
    stateRef.current.position = 0;
    stateRef.current.lastFrameTime = 0;
    
    // 使用requestIdleCallback在浏览器空闲时开始创建
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        createItemsProgressive();
        requestAnimationFrame(animate);
      });
    } else {
      // 降级处理
      setTimeout(() => {
        createItemsProgressive();
        requestAnimationFrame(animate);
      }, 100);
    }
  }, [isVisible, createItemsProgressive, animate]);

  // 窗口大小变化处理
  useEffect(() => {
    const handleResize = () => {
      const state = stateRef.current;
      const track = scrollRef.current;
      if (!state.isInitialized || !track) return;
      
      const ratio = state.position / state.totalWidth;
      // 清空并重新渐进式创建项目
      track.innerHTML = '';
      state.isInitialized = false;
      createItemsProgressive();
      // 恢复位置比例
      state.position = ratio * state.totalWidth;
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [createItemsProgressive]);

  // 鼠标悬停暂停功能
  const handleMouseEnter = () => {
    stateRef.current.isRunning = false;
  };
  
  const handleMouseLeave = () => {
    stateRef.current.isRunning = true;
  };

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden w-4/5 mx-auto ${className} ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-600`}
    >
      {/* 渐变遮罩层 */}
      <div className="absolute left-0 top-0 w-8 sm:w-12 lg:w-16 xl:w-20 h-full bg-gradient-to-r from-gray-50 via-gray-50/80 via-gray-50/40 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 w-8 sm:w-12 lg:w-16 xl:w-20 h-full bg-gradient-to-l from-gray-50 via-gray-50/80 via-gray-50/40 to-transparent z-10 pointer-events-none"></div>
      
      {/* 滚动容器 */}
      <div 
        ref={scrollRef}
        className="flex px-4"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          perspective: '1000px',
          transform: 'translateZ(0)' // 强制硬件加速
        }}
      >
        {/* 项目将通过JavaScript动态生成 */}
      </div>
    </div>
  );
}

// 导出预设配置的组件 - 从环境变量读取速度
export const CompanyScrollLeft = () => {
  const speed = parseInt(process.env.NEXT_PUBLIC_CARROUSEL_SCROLL_SPEED_LEFT || '20');
  return <CompanyScroll direction="left" speed={speed} />;
};

export const CompanyScrollRight = () => {
  const speed = parseInt(process.env.NEXT_PUBLIC_CARROUSEL_SCROLL_SPEED_RIGHT || '18');
  return <CompanyScroll direction="right" speed={speed} />;
};
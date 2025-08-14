'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface CarouselItem {
  id: number;
  name: string;
  logo: string;
  website?: string;
}

interface CarouselProps {
  items: CarouselItem[];
  speed?: number; // 滚动速度
  direction?: 'left' | 'right';
  className?: string;
  itemWidth?: number; // 每个项目的宽度（像素）
  gap?: number; // 项目间距（像素）
}

const Carousel: React.FC<CarouselProps> = ({
  items,
  speed = 2,
  direction = 'left',
  className = '',
  itemWidth = 120,
  gap = 16
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // 状态管理
  const stateRef = useRef({
    speed,
    isRunning: true,
    direction: direction === 'left' ? 1 : -1,
    position: 0,
    itemWidth: 0,
    itemsCount: items.length,
    totalWidth: 0,
    lastFrameTime: 0,
    isInitialized: false
  });

  // 渐进式创建项目
  const createItems = () => {
    if (!trackRef.current || items.length === 0) return;
    
    const track = trackRef.current;
    track.innerHTML = '';
    
    // 创建双倍项目以实现无缝循环
    const totalItems = items.length * 2;
    
    for (let i = 0; i < totalItems; i++) {
      const item = items[i % items.length];
      const itemElement = document.createElement('div');
      itemElement.className = 'flex-shrink-0 flex items-center justify-center';
      itemElement.style.width = `${itemWidth}px`;
      itemElement.style.paddingLeft = `${gap / 2}px`;
      itemElement.style.paddingRight = `${gap / 2}px`;
      
      itemElement.innerHTML = `
        <div class="w-24 h-12 relative">
          <img 
            src="${item.logo}" 
            alt="${item.name}" 
            class="w-full h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
            loading="lazy"
          />
        </div>
      `;
      
      track.appendChild(itemElement);
    }
    
    // 计算尺寸
    const firstItem = track.querySelector('div');
    if (firstItem) {
      stateRef.current.itemWidth = firstItem.offsetWidth;
      stateRef.current.totalWidth = stateRef.current.itemWidth * stateRef.current.itemsCount;
      stateRef.current.isInitialized = true;
    }
  };

  // 动画循环
  const animate = (timestamp: number) => {
    const state = stateRef.current;
    
    if (!state.isInitialized || !trackRef.current) {
      requestAnimationFrame(animate);
      return;
    }
    
    if (!state.lastFrameTime) state.lastFrameTime = timestamp;
    const deltaTime = timestamp - state.lastFrameTime;
    const frameInterval = 16; // 约60fps
    
    if (deltaTime >= frameInterval && state.isRunning && isVisible) {
      const moveDistance = (state.speed * deltaTime) / frameInterval;
      state.position += state.direction * moveDistance;
      
      // 循环逻辑
      if (state.position >= state.totalWidth) {
        state.position -= state.totalWidth;
      } else if (state.position <= 0) {
        state.position += state.totalWidth;
      }
      
      // 应用位置
      trackRef.current.style.transform = `translateX(-${state.position}px)`;
      state.lastFrameTime = timestamp;
    }
    
    requestAnimationFrame(animate);
  };

  // 可见性监听
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // 初始化
  useEffect(() => {
    if (items.length === 0) return;
    
    // 更新状态
    stateRef.current.speed = speed;
    stateRef.current.direction = direction === 'left' ? 1 : -1;
    stateRef.current.itemsCount = items.length;
    
    // 使用 requestIdleCallback 或 setTimeout 进行初始化
    const initializeCarousel = () => {
      createItems();
      requestAnimationFrame(animate);
    };
    
    if ('requestIdleCallback' in window) {
      requestIdleCallback(initializeCarousel);
    } else {
      setTimeout(initializeCarousel, 100);
    }
  }, [items, speed, direction]);

  // 窗口大小变化处理
  useEffect(() => {
    const handleResize = () => {
      if (!stateRef.current.isInitialized) return;
      
      const ratio = stateRef.current.position / stateRef.current.totalWidth;
      stateRef.current.isInitialized = false;
      createItems();
      stateRef.current.position = ratio * stateRef.current.totalWidth;
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden w-4/5 mx-auto ${className} ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } transition-opacity duration-600`}
    >
      {/* 渐变遮罩层 */}
      <div className="absolute left-0 top-0 w-16 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      
      {/* 轮播容器 */}
      <div className="border rounded-xl p-4 bg-white shadow-sm">
        <div 
          ref={trackRef}
          className="flex"
          style={{
            willChange: 'transform'
          }}
        >
          {/* 项目将通过 JavaScript 动态生成 */}
        </div>
      </div>
    </div>
  );
};

export default Carousel;

// 预设组件
export const CompanyCarouselLeft: React.FC<{ items: CarouselItem[] }> = ({ items }) => (
  <Carousel items={items} speed={2.8} direction="left" />
);

export const CompanyCarouselRight: React.FC<{ items: CarouselItem[] }> = ({ items }) => (
  <Carousel items={items} speed={3.2} direction="right" />
);

export const PartnersCarousel: React.FC<{ items: CarouselItem[] }> = ({ items }) => (
  <Carousel 
    items={items} 
    speed={2.5} 
    direction="left" 
    className="mb-8"
  />
);
'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  
  // 创建五倍内容确保完全无缝滚动
  const scrollCompanies = [...companies, ...companies, ...companies, ...companies, ...companies];
  
  // 计算单个项目的宽度
  const itemWidth = 120; // 96px width + 24px margin
  const singleSetWidth = companies.length * itemWidth;
  const totalWidth = scrollCompanies.length * itemWidth;

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

  // 真正无缝的无限滚动逻辑
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || !isVisible) return;

    let animationId: number;
    // 从中间位置开始，确保两边都有足够的内容
    let currentTranslate = direction === 'left' ? -singleSetWidth * 2 : -singleSetWidth * 2;
    let lastTime = 0;
    
    // 预计算移动步长
    const moveStep = speed / 60;
    
    // 设置初始位置
    scrollContainer.style.transform = `translate3d(${currentTranslate}px, 0, 0)`;

    const animate = (currentTime: number) => {
      // 使用时间差来确保稳定的帧率
      if (currentTime - lastTime >= 16.67) { // 约60fps
        if (direction === 'left') {
          currentTranslate -= moveStep;
          
          // 向左滚动：当移动到最左边时，无缝重置到右边的等效位置
          if (currentTranslate <= -singleSetWidth * 3) {
            currentTranslate = -singleSetWidth * 2;
          }
        } else {
          currentTranslate += moveStep;
          
          // 向右滚动：当移动到最右边时，无缝重置到左边的等效位置
          if (currentTranslate >= -singleSetWidth) {
            currentTranslate = -singleSetWidth * 2;
          }
        }
        
        // 使用transform3d启用硬件加速
        scrollContainer.style.transform = `translate3d(${currentTranslate}px, 0, 0)`;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [direction, speed, singleSetWidth, isVisible]);

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
        style={{
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          perspective: '1000px',
          transform: 'translateZ(0)' // 强制硬件加速
        }}
      >
        {scrollCompanies.map((company, index) => {
          return (
            <div
              key={`${company.id}-${Math.floor(index / companies.length)}-${index % companies.length}`}
              className="flex-shrink-0 flex items-center justify-center p-3 mx-4 rounded-lg"
            >
              <div className="w-24 h-12 relative">
                <Image
                  src={company.logo}
                  alt={company.name}
                  fill
                  className="object-contain filter"
                  sizes="96px"
                  unoptimized
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 导出预设配置的组件 - 调整速度
export const CompanyScrollLeft = () => <CompanyScroll direction="left" speed={35} />; // 从60降低到35
export const CompanyScrollRight = () => <CompanyScroll direction="right" speed={30} />; // 从50降低到30
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, Variants } from 'framer-motion';

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
    id: 'lynxai',
    name: 'LynxAI',
    logo: '/companies/lynxAI.svg',
    website: '#'
  },
  {
    id: 'xiwang',
    name: '希望软件',
    logo: '/companies/希望软件.svg',
    website: '#'
  },
  {
    id: 'alibaba',
    name: '阿里巴巴',
    logo: '/companies/阿里巴巴.svg',
    website: 'https://www.alibaba.com'
  },
  {
    id: 'dingding',
    name: '钉钉',
    logo: '/companies/钉钉.svg',
    website: 'https://www.dingtalk.com'
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
    id: 'eduhk',
    name: '香港教育大学',
    logo: '/companies/香港教育大学.png',
    website: 'https://www.eduhk.hk'
  },
  {
    id: 'crb',
    name: '华润啤酒',
    logo: '/companies/华润啤酒.png',
    website: 'https://www.crbeer.com.cn'
  }
];

interface CompanyScrollProps {
  direction?: 'left' | 'right';
  speed?: number; // 滚动速度（像素/秒）
  className?: string;
}

export function CompanyScroll({ 
  direction = 'right', 
  speed = 30, // 速度
  className = '' 
}: CompanyScrollProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 创建双倍内容确保无缝滚动
  const scrollCompanies = [...companies, ...companies];
  
  // 计算单组内容的宽度 - 调整为新的图标尺寸
  const itemWidth = 120; // 96px width + 24px margin (缩小后的尺寸)
  const singleSetWidth = companies.length * itemWidth;

  // 使用CSS动画实现无缝滚动
  const animationDuration = singleSetWidth / speed; // 计算动画持续时间

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

  // 容器动画变体
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  // 公司项目动画变体
  const itemVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  // 悬停动画变体 - 完整修复版本
  const hoverVariants: Variants = {
    initial: {
      scale: 1,
      y: 0
    },
    hover: {
      scale: 1.1,
      y: -8,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  // 图片旋转动画变体 - 独立处理
  const imageRotateVariants: Variants = {
    initial: {
      rotate: 0
    },
    hover: {
      rotate: [0, -2, 2, -2, 0],
      transition: {
        duration: 0.4,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div 
      ref={containerRef}
      className={`relative overflow-hidden w-4/5 mx-auto ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
    >
      {/* 增强的渐变遮罩层 */}
      <div className="absolute left-0 top-0 w-8 sm:w-12 lg:w-16 xl:w-20 h-full bg-gradient-to-r from-gray-50 via-gray-50/80 via-gray-50/40 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 w-8 sm:w-12 lg:w-16 xl:w-20 h-full bg-gradient-to-l from-gray-50 via-gray-50/80 via-gray-50/40 to-transparent z-10 pointer-events-none"></div>
      
      {/* 滚动容器 */}
      <div 
        className="flex px-4 will-change-transform"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          animation: isPaused ? 'none' : `scroll-${direction} ${animationDuration}s linear infinite`,
        }}
      >
        {scrollCompanies.map((company, index) => {
          const originalIndex = index % companies.length;
          return (
            <motion.a
              key={`${company.id}-${Math.floor(index / companies.length)}-${index % companies.length}`}
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex-shrink-0 flex items-center justify-center p-3 mx-4 rounded-lg transition-colors duration-300 hover:bg-white/50"
              variants={itemVariants}
              custom={originalIndex}
              style={{
                animationDelay: `${originalIndex * 0.1}s`
              }}
            >
              <motion.div 
                className="w-24 h-12 relative" // 缩小图标：从w-32 h-16改为w-24 h-12
                variants={hoverVariants}
                initial="initial"
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
                style={{
                  transformOrigin: "center center",
                  position: "relative",
                  zIndex: 1
                }}
              >
                <motion.div
                  className="w-full h-full relative"
                  variants={imageRotateVariants}
                  initial="initial"
                  whileHover="hover"
                  style={{
                    transformOrigin: "center center"
                  }}
                >
                  <Image
                    src={company.logo}
                    alt={company.name}
                    fill
                    className="object-contain filter transition-all duration-300 group-hover:brightness-110 group-hover:contrast-110"
                    sizes="96px" // 调整sizes属性匹配新尺寸
                    unoptimized
                  />
                </motion.div>
              </motion.div>
            </motion.a>
          );
        })}
      </div>

      {/* 优化的CSS动画样式 - 确保无限滚动 */}
      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-${singleSetWidth}px);
          }
        }
        
        @keyframes scroll-right {
          0% {
            transform: translateX(-${singleSetWidth}px);
          }
          100% {
            transform: translateX(0%);
          }
        }
        
        /* 确保动画无缝循环 */
        .animate-infinite-scroll {
          animation-iteration-count: infinite;
          animation-timing-function: linear;
        }
      `}</style>
    </motion.div>
  );
}

// 导出预设配置的组件 - 调整速度
export const CompanyScrollLeft = () => <CompanyScroll direction="left" speed={35} />; // 从60降低到35
export const CompanyScrollRight = () => <CompanyScroll direction="right" speed={30} />; // 从50降低到30
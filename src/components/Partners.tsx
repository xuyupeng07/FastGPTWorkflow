'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ExternalLink, Users, Award, Zap } from 'lucide-react';
import { partners, categoryIcons, categoryLabels, type Partner } from '@/data/partners';
import { CompanyScrollRight } from './CompanyScroll';

// 图标映射
const iconMap = {
  technology: Zap,
  enterprise: Award,
  education: Users,
  startup: ExternalLink
};

interface PartnersProps {
  variant?: 'full' | 'compact' | 'featured';
  showCategories?: boolean;
  maxItems?: number;
}

export function Partners({ 
  variant = 'full', 
  showCategories = true, 
  maxItems 
}: PartnersProps) {
  const displayPartners = maxItems ? partners.slice(0, maxItems) : partners;
  const featuredPartners = partners.filter(p => p.featured);
  
  // Add this missing state declaration
  const [isPaused, setIsPaused] = useState(false);
  
  const partnersToShow = variant === 'featured' ? featuredPartners : displayPartners;

  if (variant === 'compact') {
    // 创建五倍的合作伙伴数组以实现完全无缝滚动
    const scrollPartners = [...partnersToShow, ...partnersToShow, ...partnersToShow, ...partnersToShow, ...partnersToShow];
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    
    // 计算单个项目的宽度
    const itemWidth = 120; // 96px width + 24px margin
    const singleSetWidth = partnersToShow.length * itemWidth;
    const speed = 40; // 滚动速度

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
      let currentTranslate = -singleSetWidth * 2;
      let lastTime = 0;
      
      // 预计算移动步长
      const moveStep = speed / 60;
      
      // 设置初始位置
      scrollContainer.style.transform = `translate3d(${currentTranslate}px, 0, 0)`;

      const animate = (currentTime: number) => {
         // 使用时间差来确保稳定的帧率
        if (currentTime - lastTime >= 16.67) { // 约60fps
          // 每帧向左移动
          currentTranslate -= moveStep;
          
          // 向左滚动：当移动到最左边时，无缝重置到右边的等效位置
          if (currentTranslate <= -singleSetWidth * 3) {
            currentTranslate = -singleSetWidth * 2;
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
    }, [singleSetWidth, speed, isVisible]);
    
    return (
      <section className="py-8 bg-gradient-to-r from-gray-50 to-blue-50/30 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">生态集成伙伴</h3>
            <p className="text-sm text-gray-600">携手全球领先科技企业，共建开放AI技术生态体系</p>
          </div>
        </div>
        
        {/* 合作伙伴滚动区域 */}
        <div 
          ref={containerRef}
          className={`relative overflow-hidden w-4/5 mx-auto mb-8 ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-600`}
        >
          {/* 遮罩层 */}
          <div className="absolute left-0 top-0 w-4 sm:w-6 lg:w-8 xl:w-12 h-full bg-gradient-to-r from-gray-50 via-gray-50 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 w-4 sm:w-6 lg:w-8 xl:w-12 h-full bg-gradient-to-l from-gray-50 via-gray-50 to-transparent z-10 pointer-events-none"></div>
          
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
            {scrollPartners.map((partner, index) => (
              <div
                key={`${partner.id}-${Math.floor(index / partners.length)}-${index % partners.length}`}
                className="flex-shrink-0 flex items-center justify-center p-3 mx-4 rounded-lg"
              >
                <div className="w-24 h-12 relative">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    fill
                    className="object-contain filter"
                    sizes="96px"
                    unoptimized
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 公司图标滚动区域 - 使用独立组件 */}
        <CompanyScrollRight />
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              合作伙伴
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              与全球领先的技术公司和企业合作，共同推动AI技术的发展和应用
            </p>
          </motion.div>
        </div>

        {/* 特色合作伙伴 */}
        {variant === 'full' && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">核心合作伙伴</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPartners.map((partner, index) => (
                <motion.div
                  key={partner.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
                >
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 relative mr-4">
                        <Image
                          src={partner.logo}
                          alt={partner.name}
                          fill
                          className="object-contain"
                          sizes="48px"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {partner.name}
                        </h4>
                        <div className="flex items-center mt-1">
                          {React.createElement(iconMap[partner.category], {
                            className: "w-3 h-3 text-gray-400 mr-1"
                          })}
                          <span className="text-xs text-gray-500">
                            {categoryLabels[partner.category]}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {partner.description}
                    </p>
                  </a>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* 所有合作伙伴网格 */}
        {variant === 'full' && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">生态伙伴</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {partners.filter(p => !p.featured).map((partner, index) => (
                <motion.a
                  key={partner.id}
                  href={partner.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="group bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
                >
                  <div className="w-full h-16 relative mb-3 transition-all duration-300">
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                      unoptimized
                    />
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 text-center group-hover:text-blue-600 transition-colors">
                    {partner.name}
                  </h4>
                </motion.a>
              ))}
            </div>
          </div>
        )}

        {/* 简化版本 - 仅显示logo */}
        {variant === 'featured' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPartners.map((partner, index) => (
              <motion.a
                key={partner.id}
                href={partner.website}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 text-center"
              >
                <div className="w-20 h-20 relative mx-auto mb-4 transition-all duration-300">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    fill
                    className="object-contain"
                    sizes="80px"
                    unoptimized
                  />
                </div>
                <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {partner.name}
                </h4>
                <p className="text-sm text-gray-600 mt-2">
                  {partner.description}
                </p>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// 导出默认配置的组件变体
export const PartnersCompact = () => <Partners variant="compact" maxItems={6} />;
export const PartnersFeatured = () => <Partners variant="featured" />;
export const PartnersFull = () => <Partners variant="full" />;
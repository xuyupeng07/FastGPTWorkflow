'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function HeaderBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 预定义的固定值数组，避免使用 Math.random()
  const squarePositions = [
    { top: 25, rotate: 15 },
    { top: 45, rotate: 30 },
    { top: 35, rotate: 10 },
    { top: 55, rotate: 25 },
    { top: 40, rotate: 20 },
    { top: 60, rotate: 35 }
  ];

  const particlePositions = [
    { left: 10, top: 20 },
    { left: 25, top: 70 },
    { left: 40, top: 30 },
    { left: 60, top: 80 },
    { left: 75, top: 15 },
    { left: 85, top: 50 },
    { left: 15, top: 90 },
    { left: 95, top: 40 }
  ];

  const animationDelays = [0, 0.5, 1, 1.5, 0.3, 0.8, 1.2, 0.2];
  const durations = [8, 10, 9, 11, 8.5, 9.5, 10.5, 8.8];

  if (!mounted) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* 科技网格背景 */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" className="text-blue-300">
            <defs>
              <pattern id="headerGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
                <circle cx="20" cy="20" r="0.5" fill="currentColor" opacity="0.6"/>
              </pattern>
              <pattern id="headerSmallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#headerGrid)" />
            <rect width="100%" height="100%" fill="url(#headerSmallGrid)" />
          </svg>
        </div>
      </div>
    );
  }
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* 科技网格背景 */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" className="text-blue-300">
          <defs>
            <pattern id="headerGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
              <circle cx="20" cy="20" r="0.5" fill="currentColor" opacity="0.6"/>
            </pattern>
            <pattern id="headerSmallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#headerGrid)" />
          <rect width="100%" height="100%" fill="url(#headerSmallGrid)" />
        </svg>
      </div>
      
      {/* 浮动小方块 */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`header-square-${i}`}
            className="absolute w-2 h-2 border border-blue-300/30 bg-blue-100/20"
            style={{
              left: `${15 + i * 15}%`,
              top: `${squarePositions[i].top}%`,
              transform: `rotate(${squarePositions[i].rotate}deg)`
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1, 0.8, 1],
              opacity: [0, 0.6, 0.4, 0.5],
              rotate: [0, 90, 180, 270, 360]
            }}
            transition={{
              duration: durations[i],
              repeat: Infinity,
              delay: animationDelays[i],
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      {/* 浮动粒子 */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`header-particle-${i}`}
            className="absolute w-1 h-1 bg-blue-400/40 rounded-full"
            style={{
              left: `${particlePositions[i].left}%`,
              top: `${particlePositions[i].top}%`
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1, 0],
              opacity: [0, 0.8, 0],
              y: [-5, 5, -5],
              x: [-3, 3, -3]
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              delay: animationDelays[i],
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      {/* 左右两侧装饰 */}
      <div className="absolute left-0 top-0 bottom-0 w-20">
        {/* 左侧小三角形 */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`header-left-triangle-${i}`}
            className="absolute w-2 h-2"
            style={{
              left: `${5 + i * 5}px`,
              top: `${20 + i * 20}%`
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1, 0.7],
              opacity: [0, 0.5, 0.3],
              rotate: [0, 120, 240, 360]
            }}
            transition={{
              duration: 6 + (i % 2),
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeInOut"
            }}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full text-blue-400/40">
              <polygon points="12,2 22,20 2,20" fill="none" stroke="currentColor" strokeWidth="1"/>
            </svg>
          </motion.div>
        ))}
      </div>
      
      <div className="absolute right-0 top-0 bottom-0 w-20">
        {/* 右侧小圆点 */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`header-right-dot-${i}`}
            className="absolute w-1.5 h-1.5 bg-indigo-400/40 rounded-full"
            style={{
              right: `${5 + i * 5}px`,
              top: `${30 + i * 20}%`
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1, 0.5, 1],
              opacity: [0, 0.8, 0.4, 0.6],
              y: [-8, 8, -5]
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: i * 0.6,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      {/* 中心装饰线 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-32 h-0.5 bg-gradient-to-r from-transparent via-blue-300/20 to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: [0, 0.6, 0] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      {/* 角落六边形装饰 */}
      <motion.div
        className="absolute top-2 right-16 w-4 h-4"
        initial={{ rotate: 0, opacity: 0.3 }}
        animate={{ rotate: 360, opacity: [0.3, 0.6, 0.3] }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg viewBox="0 0 24 24" className="w-full h-full text-indigo-300/40">
          <polygon
            points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
      </motion.div>
      
      <motion.div
        className="absolute bottom-2 left-16 w-4 h-4"
        initial={{ rotate: 0, opacity: 0.3 }}
        animate={{ rotate: -360, opacity: [0.3, 0.6, 0.3] }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg viewBox="0 0 24 24" className="w-full h-full text-blue-300/40">
          <polygon
            points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
      </motion.div>
    </div>
  );
}
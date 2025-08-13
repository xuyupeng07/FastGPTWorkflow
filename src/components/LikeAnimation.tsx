'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

interface LikeAnimationProps {
  isTriggered: boolean;
  onComplete?: () => void;
}

export function LikeAnimation({ isTriggered, onComplete }: LikeAnimationProps) {
  const [hearts, setHearts] = useState<Array<{ id: number; delay: number; angle: number }>>([]);

  useEffect(() => {
    if (isTriggered) {
      // 生成多个爱心，随机角度和延迟
      const newHearts = Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + i,
        delay: i * 0.1,
        angle: (i * 60) + Math.random() * 30 - 15, // 每60度一个，加上随机偏移
      }));
      
      setHearts(newHearts);
      
      // 动画完成后清理
      const timer = setTimeout(() => {
        setHearts([]);
        onComplete?.();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isTriggered, onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{
              scale: 0,
              opacity: 0,
              x: 0,
              y: 0,
              rotate: 0,
            }}
            animate={{
              scale: [0, 1.2, 0.8],
              opacity: [0, 1, 0],
              x: Math.cos((heart.angle * Math.PI) / 180) * 40,
              y: Math.sin((heart.angle * Math.PI) / 180) * 40,
              rotate: heart.angle,
            }}
            exit={{
              scale: 0,
              opacity: 0,
            }}
            transition={{
              duration: 1.2,
              delay: heart.delay,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="absolute"
          >
            <Heart 
              className="w-4 h-4 text-red-500 fill-current drop-shadow-lg" 
              style={{
                filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))'
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* 中心爱心放大效果 */}
      <AnimatePresence>
        {isTriggered && (
          <motion.div
            initial={{ scale: 1 }}
            animate={{ 
              scale: [1, 1.3, 1],
            }}
            exit={{ scale: 1 }}
            transition={{
              duration: 0.6,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="absolute"
          >
            <Heart className="w-3 h-3 text-red-500 fill-current" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
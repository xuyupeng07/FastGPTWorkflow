'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  className?: string;
  delayDuration?: number;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

function Tooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  className,
  delayDuration = 300,
  anchorRef
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);



  const handleMouseEnter = () => {
     // 计算相对位置
     const targetEl = anchorRef?.current ?? triggerRef.current;
     if (targetEl) {
       const rect = targetEl.getBoundingClientRect();
       
       let x = rect.left;
       let y = rect.top;
       
       // 根据side设置相对位置
       switch (side) {
         case 'top':
           y = rect.top - 20; // 固定在元素上方20px，增加间距避免遮挡
           break;
         case 'bottom':
           y = rect.bottom + 10; // 固定在元素下方10px
           break;
         case 'left':
           x = rect.left - 10; // 固定在元素左侧10px
           break;
         case 'right':
           x = rect.right + 10; // 固定在元素右侧10px
           break;
       }
       
       // 根据对齐方式调整
       if (side === 'top' || side === 'bottom') {
         switch (align) {
           case 'start':
             x = rect.left; // 左对齐
             break;
           case 'center':
             x = rect.left + rect.width / 2; // 居中对齐
             break;
           case 'end':
             x = rect.right; // 右对齐
             break;
         }
       } else {
         switch (align) {
           case 'start':
             y = rect.top; // 顶部对齐
             break;
           case 'center':
             y = rect.top + rect.height / 2; // 垂直居中
             break;
           case 'end':
             y = rect.bottom; // 底部对齐
             break;
         }
       }
       
       setPosition({ x, y });
     }
     
     timeoutRef.current = window.setTimeout(() => {
        setIsVisible(true);
      }, delayDuration);
   };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (!isVisible) return;

    const calculatePosition = () => {
       const targetEl = anchorRef?.current ?? triggerRef.current;
       if (!targetEl) return;
       
       const rect = targetEl.getBoundingClientRect();
       
       let x = rect.left;
       let y = rect.top;
       
       // 根据side设置相对位置
       switch (side) {
         case 'top':
           y = rect.top - 20; // 固定在元素上方20px，增加间距避免遮挡
           break;
         case 'bottom':
           y = rect.bottom + 10; // 固定在元素下方10px
           break;
         case 'left':
           x = rect.left - 10; // 固定在元素左侧10px
           break;
         case 'right':
           x = rect.right + 10; // 固定在元素右侧10px
           break;
       }
       
       // 根据对齐方式调整
       if (side === 'top' || side === 'bottom') {
         switch (align) {
           case 'start':
             x = rect.left; // 左对齐
             break;
           case 'center':
             x = rect.left + rect.width / 2; // 居中对齐
             break;
           case 'end':
             x = rect.right; // 右对齐
             break;
         }
       } else {
         switch (align) {
           case 'start':
             y = rect.top; // 顶部对齐
             break;
           case 'center':
             y = rect.top + rect.height / 2; // 垂直居中
             break;
           case 'end':
             y = rect.bottom; // 底部对齐
             break;
         }
       }
       
       setPosition({ x, y });
     };

    const handleScroll = () => {
      calculatePosition();
    };

    const handleResize = () => {
      calculatePosition();
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isVisible, side, align, anchorRef]);

  const getArrowClasses = () => {
    // 根据className判断背景色，默认使用深色主题
    const isDarkTheme = className?.includes('bg-gray-900') || className?.includes('bg-black') || !className?.includes('bg-');
    const arrowBg = isDarkTheme ? 'bg-gray-900' : 'bg-white';
    const arrowBorder = isDarkTheme ? 'border-gray-900' : 'border-white';
    
    const baseClasses = `absolute w-3 h-3 ${arrowBg} ${arrowBorder} shadow-lg`;
    
    switch (side) {
      case 'top':
        return `${baseClasses} border-b border-r transform rotate-45 -bottom-1.5`;
      case 'bottom':
        return `${baseClasses} border-t border-l transform rotate-45 -top-1.5`;
      case 'left':
        return `${baseClasses} border-t border-r transform rotate-45 -right-1.5`;
      case 'right':
        return `${baseClasses} border-b border-l transform rotate-45 -left-1.5`;
      default:
        return baseClasses;
    }
  };

  const getArrowPosition = () => {
    if (side === 'top' || side === 'bottom') {
      switch (align) {
        case 'start':
          return 'left-3';
        case 'center':
          return 'left-1/2 transform -translate-x-1/2';
        case 'end':
          return 'right-3';
        default:
          return 'left-1/2 transform -translate-x-1/2';
      }
    } else {
      switch (align) {
        case 'start':
          return 'top-3';
        case 'center':
          return 'top-1/2 transform -translate-y-1/2';
        case 'end':
          return 'bottom-3';
        default:
          return 'top-1/2 transform -translate-y-1/2';
      }
    }
  };

  const getTooltipTransform = () => {
    const transforms: string[] = [];
    if (side === 'top') {
      transforms.push('-translate-y-full');
    }

    if (side === 'top' || side === 'bottom') {
      switch (align) {
        case 'start':
          // ensure transform class exists when we have vertical translation
          return `transform ${transforms.join(' ')}`.trim();
        case 'center':
          return `transform -translate-x-1/2 ${transforms.join(' ')}`.trim();
        case 'end':
          return `transform -translate-x-full ${transforms.join(' ')}`.trim();
        default:
          return `transform -translate-x-1/2 ${transforms.join(' ')}`.trim();
      }
    } else {
      switch (align) {
        case 'start':
          return transforms.length ? `transform ${transforms.join(' ')}`.trim() : '';
        case 'center':
          return `transform -translate-y-1/2 ${transforms.join(' ')}`.trim();
        case 'end':
          return `transform -translate-y-full ${transforms.join(' ')}`.trim();
        default:
          return `transform -translate-y-1/2 ${transforms.join(' ')}`.trim();
      }
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
      
      {mounted && createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`fixed z-[99999] px-3 py-2 text-sm rounded-lg shadow-xl border pointer-events-none backdrop-blur-sm ${
                 getTooltipTransform()
               } ${className || 'bg-gray-900 text-white border-gray-700'}`}
              style={{
                left: position.x,
                top: position.y,
                maxWidth: '400px',
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap'
              }}
            >
              {content}
              <div className={`${getArrowClasses()} ${getArrowPosition()}`} />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

export { Tooltip };
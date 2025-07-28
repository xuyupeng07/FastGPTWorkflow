'use client';

import React, { useState, useEffect, ReactNode } from 'react';

interface HydrationSafeWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

/**
 * HydrationSafeWrapper 组件用于防止Chrome浏览器插件和扩展导致的React水合错误
 * 通过延迟渲染客户端特定内容来确保服务端和客户端的一致性
 */
export function HydrationSafeWrapper({ 
  children, 
  fallback = null, 
  className 
}: HydrationSafeWrapperProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // 确保组件已经在客户端挂载
    setIsHydrated(true);
  }, []);

  // 在服务端渲染和客户端水合完成前显示fallback
  if (!isHydrated) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  // 客户端水合完成后显示实际内容
  return <div className={className}>{children}</div>;
}

/**
 * 用于包装可能受浏览器插件影响的动态内容
 */
export function ClientOnlyWrapper({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return fallback || null;
  }

  return <>{children}</>;
}

/**
 * 用于安全地访问localStorage等浏览器API
 */
export function useSafeLocalStorage(key: string, initialValue: string = '') {
  const [value, setValue] = useState<string>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setValue(item);
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    } finally {
      setIsLoaded(true);
    }
  }, [key]);

  const setStoredValue = (newValue: string) => {
    try {
      setValue(newValue);
      window.localStorage.setItem(key, newValue);
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [value, setStoredValue, isLoaded] as const;
}

/**
 * 防止浏览器插件干扰的安全渲染Hook
 */
export function useSafeRender() {
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    // 添加小延迟确保DOM完全稳定
    const timer = setTimeout(() => {
      setCanRender(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return canRender;
}

/**
 * 检测并处理可能的DOM污染
 */
export function useDOMProtection() {
  useEffect(() => {
    // 检测并清理可能的插件注入内容
    const cleanupExtensionArtifacts = () => {
      try {
        // 移除常见的浏览器插件注入的元素
        const selectors = [
          '[data-extension-id]',
          '[data-chrome-extension]',
          '.chrome-extension-mutahunter',
          '.extension-overlay',
          '[id*="extension"]',
          '[class*="extension"]'
        ];

        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            if (element.parentNode) {
              element.parentNode.removeChild(element);
            }
          });
        });
      } catch (error) {
        console.warn('DOM cleanup error:', error);
      }
    };

    // 初始清理
    cleanupExtensionArtifacts();

    // 监听DOM变化并清理
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // 检查是否是插件注入的元素
              if (element.hasAttribute('data-extension-id') || 
                  element.hasAttribute('data-chrome-extension') ||
                  element.className.includes('extension')) {
                try {
                  element.remove();
                } catch (error) {
                  console.warn('Failed to remove extension element:', error);
                }
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }, []);
}

/**
 * 安全的事件处理器，防止插件干扰
 */
export function useSafeEventHandler<T>(
  handler: (event: T) => void,
  dependencies: React.DependencyList = []
) {
  return React.useCallback((event: T) => {
    try {
      // 检查事件是否被插件修改
      if (typeof event === 'object' && event !== null && 'isTrusted' in event) {
        const domEvent = event as any;
        if (domEvent.isTrusted !== false) {
          handler(event);
        }
      } else {
        handler(event);
      }
    } catch (error) {
      console.warn('Event handler error:', error);
    }
  }, dependencies);
}
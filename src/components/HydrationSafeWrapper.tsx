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
  
  // 备用存储键名
  const backupKey = `backup_${key}`;

  useEffect(() => {
    try {
      // 检查localStorage是否可用
      if (typeof window === 'undefined' || !window.localStorage) {
        console.warn(`localStorage不可用，key: ${key}`);
        setValue(initialValue);
        setIsLoaded(true);
        return;
      }

      // 检查localStorage总体状态
       console.log(`localStorage总项目数: ${localStorage.length}`);

      let item = window.localStorage.getItem(key);
      console.log(`localStorage读取: ${key} = ${item}`);
      
      // 如果localStorage为空，尝试从sessionStorage恢复
      if ((item === null || item === '') && window.sessionStorage) {
        const backupItem = window.sessionStorage.getItem(backupKey);
        console.log(`sessionStorage备份读取: ${backupKey} = ${backupItem}`);
        if (backupItem !== null && backupItem !== '') {
          item = backupItem;
          // 恢复到localStorage
          try {
            window.localStorage.setItem(key, item);
            console.log(`从sessionStorage恢复到localStorage: ${key} = ${item}`);
          } catch (e) {
            console.warn(`恢复到localStorage失败: ${e}`);
          }
        }
      }
      
      if (item !== null && item !== '') {
        setValue(item);
        console.log(`存储恢复成功: ${key} = ${item}`);
      } else {
        setValue(initialValue);
        console.log(`存储为空，使用初始值: ${key} = ${initialValue}`);
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      setValue(initialValue);
    } finally {
      setIsLoaded(true);
    }
  }, [key, initialValue]);

  // 定期检查localStorage是否被清除，如果是则从sessionStorage恢复
  useEffect(() => {
    if (!isLoaded) return;

    const checkInterval = setInterval(() => {
      try {
        const currentItem = window.localStorage.getItem(key);
        // 如果localStorage中的值与React状态不一致，且React状态不为空
        if (value && value !== '' && (currentItem === null || currentItem === '')) {
          console.warn(`检测到localStorage数据丢失: ${key}`);
          
          // 尝试从sessionStorage恢复
          if (window.sessionStorage) {
            const backupItem = window.sessionStorage.getItem(backupKey);
            if (backupItem && backupItem === value) {
              try {
                window.localStorage.setItem(key, backupItem);
                console.log(`自动从sessionStorage恢复localStorage: ${key} = ${backupItem}`);
              } catch (e) {
                console.warn(`自动恢复失败: ${e}`);
              }
            }
          }
        }
      } catch (error) {
        console.warn(`定期检查localStorage失败: ${error}`);
      }
    }, 5000); // 每5秒检查一次

    return () => clearInterval(checkInterval);
  }, [key, value, isLoaded, backupKey]);

  const setStoredValue = (newValue: string) => {
    try {
      // 检查localStorage是否可用
      if (typeof window === 'undefined' || !window.localStorage) {
        console.warn(`localStorage不可用，无法设置 ${key}`);
        setValue(newValue); // 至少更新React状态
        return;
      }

      // 先写localStorage，成功后再更新React状态
       window.localStorage.setItem(key, newValue);
       
       // 同时写入sessionStorage作为备份
       if (window.sessionStorage) {
         try {
           window.sessionStorage.setItem(backupKey, newValue);
           console.log(`sessionStorage备份成功: ${backupKey} = ${newValue}`);
         } catch (e) {
           console.warn(`sessionStorage备份失败: ${e}`);
         }
       }
       
       // 验证写入是否成功
       const verifyValue = window.localStorage.getItem(key);
       if (verifyValue === newValue) {
         setValue(newValue);
         console.log(`localStorage设置并验证成功: ${key} = ${newValue}`);
       } else {
         console.error(`localStorage写入验证失败: ${key}, 期望: ${newValue}, 实际: ${verifyValue}`);
         setValue(newValue); // 仍然更新React状态
       }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
      setValue(newValue); // localStorage失败时仍更新React状态
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
                  (typeof element.className === 'string' && element.className.includes('extension'))) {
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
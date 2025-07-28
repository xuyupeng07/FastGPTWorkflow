'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * ErrorBoundary 组件用于捕获React组件树中的JavaScript错误
 * 特别是处理由Chrome插件和扩展引起的水合错误
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新state以显示错误UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // 检查是否是水合错误
    if (this.isHydrationError(error)) {
      console.warn('Hydration error detected, this might be caused by browser extensions');
      
      // 尝试清理可能的插件干扰
      this.cleanupExtensionArtifacts();
      
      // 延迟重试渲染
      setTimeout(() => {
        this.setState({ hasError: false });
      }, 100);
    }
  }

  /**
   * 检查是否是水合错误
   */
  private isHydrationError(error: Error): boolean {
    const hydrationKeywords = [
      'hydration',
      'server-rendered',
      'client-side',
      'mismatch',
      'expected server HTML',
      'suppressHydrationWarning'
    ];
    
    const errorMessage = error.message.toLowerCase();
    return hydrationKeywords.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * 清理可能的插件注入内容
   */
  private cleanupExtensionArtifacts() {
    try {
      // 移除常见的插件注入元素
      const selectors = [
        '[data-extension-id]',
        '[data-chrome-extension]',
        '.chrome-extension-mutahunter',
        '.extension-overlay',
        '[id*="extension"]',
        '[class*="extension"]',
        '[style*="z-index: 2147483647"]' // 常见的插件最高层级
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          try {
            element.remove();
          } catch (e) {
            console.warn('Failed to remove extension element:', e);
          }
        });
      });

      // 清理可能被插件修改的样式
      const style = document.createElement('style');
      style.textContent = `
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; }
        * { box-sizing: border-box !important; }
      `;
      document.head.appendChild(style);
      
      // 短暂延迟后移除临时样式
      setTimeout(() => {
        try {
          document.head.removeChild(style);
        } catch (e) {
          // 忽略移除错误
        }
      }, 1000);
    } catch (error) {
      console.warn('Error during cleanup:', error);
    }
  }

  /**
   * 重置错误状态
   */
  private handleReset = () => {
    this.setState({ hasError: false });
  };

  /**
   * 刷新页面
   */
  private handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              页面加载出错
            </h2>
            <p className="text-gray-600 mb-4">
              可能是浏览器插件导致的兼容性问题
            </p>
            
            {/* 开发环境显示详细错误信息 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-4 p-3 bg-gray-100 rounded text-sm">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  错误详情
                </summary>
                <pre className="whitespace-pre-wrap text-xs text-red-600">
                  {this.state.error.message}
                </pre>
                {this.state.errorInfo && (
                  <pre className="whitespace-pre-wrap text-xs text-gray-600 mt-2">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
            
            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </Button>
              <Button
                onClick={this.handleRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                刷新页面
              </Button>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              <p>建议：</p>
              <ul className="text-left mt-1 space-y-1">
                <li>• 尝试禁用浏览器插件</li>
                <li>• 使用无痕模式访问</li>
                <li>• 清除浏览器缓存</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 函数式错误边界Hook（用于函数组件）
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  return { captureError, resetError };
}

/**
 * 高阶组件：为组件添加错误边界
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
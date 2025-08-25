import type { Metadata } from "next";
import Script from "next/script";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import ChatBot from "@/components/ChatBot";
import "./globals.css";

export const metadata: Metadata = {
  title: "FastGPT解决方案中心",
  description: "FastGPT解决方案中心，发现和分享优质的AI工作流模板",
  icons: {
    icon: "/fastgpt.svg",
    shortcut: "/fastgpt.svg",
    apple: "/fastgpt.svg",
  },
  other: {
    'format-detection': 'telephone=no, date=no, email=no, address=no',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        {/* 防止插件干扰的安全策略 */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta name="referrer" content="origin-when-cross-origin" />
      </head>
      <body 
        className="antialiased" 
        suppressHydrationWarning
        data-app="fastgpt-workflow"
        style={{
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}
      >
        {/* 百度统计代码 */}
        <Script
          id="baidu-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var _hmt = _hmt || [];
              (function() {
                var hm = document.createElement("script");
                hm.src = "https://hm.baidu.com/hm.js?572e6459ef23c76f9336a9387bd794f7";
                var s = document.getElementsByTagName("script")[0];
                s.parentNode.insertBefore(hm, s);
              })();
            `
          }}
        />
        
        <AuthProvider>
          <div id="app-root" data-hydration-safe="true">
            {children}
          </div>
          <Toaster 
            position="top-center" 
            closeButton 
            expand={true}
            visibleToasts={5}
            toastOptions={{
              style: {
                backgroundColor: '#ffffff !important',
                color: '#000000 !important',
                border: '1px solid #e5e7eb !important',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15) !important',
                marginBottom: '8px !important',
              },
              className: '',
              duration: 4000,
              unstyled: false,
            }}
          />
        </AuthProvider>

        {/* FastGPT聊天机器人 - 根据路径条件性显示 */}
        <ChatBot />
        
        {/* 浏览器兼容性检测脚本 */}
        <script 
          dangerouslySetInnerHTML={{
            __html: `
              // 检测并清理可能的插件干扰
              (function() {
                try {
                  // 标记应用已加载
                  window.__FASTGPT_APP_LOADED__ = true;
                  
                  // 监听DOM变化，清理插件注入
                  if (typeof MutationObserver !== 'undefined') {
                    const observer = new MutationObserver(function(mutations) {
                      mutations.forEach(function(mutation) {
                        if (mutation.type === 'childList') {
                          mutation.addedNodes.forEach(function(node) {
                            if (node.nodeType === 1) { // Element node
                              const element = node;
                              // 检查是否是插件注入的元素
                              if (element.hasAttribute && (
                                element.hasAttribute('data-extension-id') ||
                                element.hasAttribute('data-chrome-extension') ||
                                (element.className && element.className.includes && element.className.includes('extension'))
                              )) {
                                try {
                                  element.remove();
                                } catch (e) {
                                  console.warn('Failed to remove extension element:', e);
                                }
                              }
                            }
                          });
                        }
                      });
                    });
                    
                    // 开始观察
                    observer.observe(document.body, {
                      childList: true,
                      subtree: true
                    });
                  }
                } catch (e) {
                  console.warn('Browser compatibility script error:', e);
                }
              })();
            `
          }}
        />
      </body>
    </html>
  );
}

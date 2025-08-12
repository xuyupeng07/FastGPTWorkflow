import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "FastGPT应用分享平台",
  description: "FastGPT工作流应用分享平台，发现和分享优质的AI工作流模板",
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

        {/* FastGPT聊天机器人 */}
        <script 
          type="text/javascript" 
          src="https://cloud.fastgpt.io/js/iframe.js" 
          id="chatbot-iframe" 
          data-bot-src="https://cloud.fastgpt.io/chat/share?shareId=tmwK0bv7ew5luTjxVHylcbi3" 
          data-default-open="false" 
          data-drag="false" 
          data-open-icon="data:image/svg+xml;base64,PHN2ZyB0PSIxNjkwNTMyNzg1NjY0IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjQxMzIiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48cGF0aCBkPSJNNTEyIDMyQzI0Ny4wNCAzMiAzMiAyMjQgMzIgNDY0QTQxMC4yNCA0MTAuMjQgMCAwIDAgMTcyLjQ4IDc2OEwxNjAgOTY1LjEyYTI1LjI4IDI1LjI4IDAgMCAwIDM5LjA0IDIyLjRsMTY4LTExMkE1MjguNjQgNTI4LjY0IDAgMCAwIDUxMiA4OTZjMjY0Ljk2IDAgNDgwLTE5MiA0ODAtNDMyUzc3Ni45NiAzMiA1MTIgMzJ6IG0yNDQuOCA0MTZsLTM2MS42IDMwMS43NmExMi40OCAxMi40OCAwIDAgMS0xOS44NC0xMi40OGw1OS4yLTIzMy45MmgtMTYwYTEyLjQ4IDEyLjQ4IDAgMCAxLTcuMzYtMjMuMzZsMzYxLjYtMzAxLjc2YTEyLjQ4IDEyLjQ4IDAgMCAxIDE5Ljg0IDEyLjQ4bC01OS4yIDIzMy45MmgxNjBhMTIuNDggMTIuNDggMCAwIDEgOCAyMi4wOHoiIGZpbGw9IiM0ZTgzZmQiIHAtaWQ9IjQxMzMiPjwvcGF0aD48L3N2Zz4=" 
          data-close-icon="data:image/svg+xml;base64,PHN2ZyB0PSIxNjkwNTM1NDQxNTI2IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjYzNjciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48cGF0aCBkPSJNNTEyIDEwMjRBNTEyIDUxMiAwIDEgMSA1MTIgMGE1MTIgNTEyIDAgMCAxIDAgMTAyNHpNMzA1Ljk1NjU3MSAzNzAuMzk1NDI5TDQ0Ny40ODggNTEyIDMwNS45NTY1NzEgNjUzLjYwNDU3MWE0NS41NjggNDUuNTY4IDAgMSAwIDY0LjQzODg1OCA2NC40Mzg4NThMNTEyIDU3Ni41MTJsMTQxLjYwNDU3MSAxNDEuNTMxNDI5YTQ1LjU2OCA0NS41NjggMCAwIDAgNjQuNDM4ODU4LTY0LjQzODg1OEw1NzYuNTEyIDUxMmwxNDEuNTMxNDI5LTE0MS42MDQ1NzFhNDUuNTY4IDQ1LjU2OCAwIDEgMC02NC40Mzg4NTgtNjQuNDM4ODU4TDUxMiA0NDcuNDg4IDM3MC4zOTU0MjkgMzA1Ljk1NjU3MWE0NS41NjggNDUuNTY4IDAgMCAwLTY0LjQzODg1OCA2NC40Mzg4NTh6IiBmaWxsPSIjNGU4M2ZkIiBwLWlkPSI2MzY4Ij48L3BhdGg+PC9zdmc+" 
          defer
        ></script>
        
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

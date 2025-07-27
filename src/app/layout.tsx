import type { Metadata } from "next";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "FastGPT案例分享",
  description: "FastGPT工作流案例分享平台，发现和分享优质的AI工作流模板",
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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
        <Toaster />
        {/* Hide Next.js development indicators */}
        {process.env.HIDE_DEV_INDICATORS === 'true' && (
          <Script
            id="hide-dev-indicators"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  'use strict';
                  
                  const selectors = [
                    '#__next-build-watcher',
                    '.__next-dev-overlay',
                    '[data-nextjs-toast-wrapper]',
                    '[data-nextjs-dialog]',
                    '[data-nextjs-dialog-overlay]',
                    '[data-nextjs-dialog-backdrop]',
                    '[data-nextjs-toast]',
                    '[data-nextjs-build-indicator]',
                    '[data-nextjs-dev-indicator]',
                    '[data-turbopack]',
                    '[data-turbopack-indicator]',
                    '[data-turbopack-toast]',
                    '[data-turbopack-overlay]',
                    '[class*="__next"][class*="indicator"]',
                    '[class*="__next"][class*="overlay"]',
                    '[class*="__next"][class*="toast"]',
                    '[class*="turbopack"][class*="indicator"]',
                    '[class*="turbopack"][class*="overlay"]',
                    '[class*="turbopack"][class*="toast"]'
                  ];
                  
                  function hideElements() {
                    selectors.forEach(selector => {
                      try {
                        const elements = document.querySelectorAll(selector);
                        elements.forEach(element => {
                          if (element) {
                            element.remove();
                          }
                        });
                      } catch (e) {}
                    });
                    
                    try {
                      const fixedElements = document.querySelectorAll('div[style*="position: fixed"]');
                      fixedElements.forEach(element => {
                        const style = element.getAttribute('style') || '';
                        if (style.includes('z-index') && 
                            (style.includes('bottom') || style.includes('top')) &&
                            (style.includes('left') || style.includes('right'))) {
                          const text = element.textContent || '';
                          if (text.includes('compiling') || 
                              text.includes('building') || 
                              text.includes('turbopack') ||
                              text.includes('next') ||
                              element.children.length === 0 ||
                              element.offsetWidth < 200) {
                            element.remove();
                          }
                        }
                      });
                    } catch (e) {}
                  }
                  
                  hideElements();
                  
                  if (typeof MutationObserver !== 'undefined') {
                    const observer = new MutationObserver(function(mutations) {
                      let shouldCheck = false;
                      mutations.forEach(function(mutation) {
                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                          shouldCheck = true;
                        }
                      });
                      if (shouldCheck) {
                        setTimeout(hideElements, 10);
                      }
                    });
                    
                    if (document.body) {
                      observer.observe(document.body, {
                        childList: true,
                        subtree: true
                      });
                    } else {
                      document.addEventListener('DOMContentLoaded', function() {
                        if (document.body) {
                          observer.observe(document.body, {
                            childList: true,
                            subtree: true
                          });
                        }
                      });
                    }
                  }
                  
                  setInterval(hideElements, 500);
                  
                  if (typeof window !== 'undefined') {
                    window.addEventListener('load', hideElements);
                    document.addEventListener('DOMContentLoaded', hideElements);
                  }
                })();
              `
            }}
          />
        )}
        
        <Script
          src="https://cloud.fastgpt.io/js/iframe.js"
          id="chatbot-iframe"
          strategy="afterInteractive"
          data-bot-src="https://cloud.fastgpt.io/chat/share?shareId=tmwK0bv7ew5luTjxVHylcbi3"
          data-default-open="false"
          data-drag="true"
          data-open-icon="data:image/svg+xml;base64,PHN2ZyB0PSIxNjkwNTMyNzg1NjY0IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjQxMzIiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48cGF0aCBkPSJNNTEyIDMyQzI0Ny4wNCAzMiAzMiAyMjQgMzIgNDY0QTQxMC4yNCA0MTAuMjQgMCAwIDAgMTcyLjQ4IDc2OEwxNjAgOTY1LjEyYTI1LjI4IDI1LjI4IDAgMCAwIDM5LjA0IDIyLjRsMTY4LTExMkE1MjguNjQgNTI4LjY0IDAgMCAwIDUxMiA4OTZjMjY0Ljk2IDAgNDgwLTE5MiA0ODAtNDMyUzc3Ni45NiAzMiA1MTIgMzJ6IG0yNDQuOCA0MTZsLTM2MS42IDMwMS43NmExMi40OCAxMi40OCAwIDAgMS0xOS44NC0xMi40OGw1OS4yLTIzMy45MmgtMTYwYTEyLjQ4IDEyLjQ4IDAgMCAxLTcuMzYtMjMuMzZsMzYxLjYtMzAxLjc2YTEyLjQ4IDEyLjQ4IDAgMCAxIDE5Ljg0IDEyLjQ4bC01OS4yIDIzMy45MmgxNjBhMTIuNDggMTIuNDggMCAwIDEgOCAyMi4wOHoiIGZpbGw9IiM0ZTgzZmQiIHAtaWQ9IjQxMzMiPjwvcGF0aD48L3N2Zz4="
          data-close-icon="data:image/svg+xml;base64,PHN2ZyB0PSIxNjkwNTM1NDQxNTI2IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjYzNjciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48cGF0aCBkPSJNNTEyIDEwMjRBNTEyIDUxMiAwIDEgMSA1MTIgMGE1MTIgNTEyIDAgMCAxIDAgMTAyNHpNMzA1Ljk1NjU3MSAzNzAuMzk1NDI5TDQ0Ny40ODggNTEyIDMwNS45NTY1NzEgNjUzLjYwNDU3MWE0NS41NjggNDUuNTY4IDAgMSAwIDY0LjQzODg1OCA2NC40Mzg4NThMNTEyIDU3Ni41MTJsMTQxLjYwNDU3MSAxNDEuNTMxNDI5YTQ1LjU2OCA0NS41NjggMCAwIDAgNjQuNDM4ODU4LTY0LjQzODg1OEw1NzYuNTEyIDUxMmwxNDEuNTMxNDI5LTE0MS42MDQ1NzFhNDUuNTY4IDQ1LjU2OCAwIDEgMC02NC40Mzg4NTgtNjQuNDM4ODU4TDUxMiA0NDcuNDg4IDM3MC4zOTU0MjkgMzA1Ljk1NjU3MWE0NS41NjggNDUuNTY4IDAgMCAwLTY0LjQzODg1OCA2NC40Mzg4NTh6IiBmaWxsPSIjNGU4M2ZkIiBwLWlkPSI2MzY4Ij48L3BhdGg+PC9zdmc+"
        />
      </body>
    </html>
  );
}

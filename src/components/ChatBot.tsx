'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function ChatBot() {
  const pathname = usePathname();
  
  // 检查是否在admin路径下
  const isAdminPath = pathname.startsWith('/admin');
  
  useEffect(() => {
    // 如果在admin路径下，隐藏聊天机器人
    if (isAdminPath) {
      const chatbotElement = document.querySelector('#chatbot-iframe');
      const chatbotContainer = document.querySelector('[data-chatbot-container]');
      
      if (chatbotElement) {
        (chatbotElement as HTMLElement).style.display = 'none';
      }
      if (chatbotContainer) {
        (chatbotContainer as HTMLElement).style.display = 'none';
      }
      
      // 隐藏可能已经创建的iframe容器
      const iframes = document.querySelectorAll('iframe[src*="fastgpt.io"]');
      iframes.forEach(iframe => {
        const container = iframe.parentElement;
        if (container) {
          (container as HTMLElement).style.display = 'none';
        }
      });
    } else {
      // 如果不在admin路径下，显示聊天机器人
      const chatbotElement = document.querySelector('#chatbot-iframe');
      const chatbotContainer = document.querySelector('[data-chatbot-container]');
      
      if (chatbotElement) {
        (chatbotElement as HTMLElement).style.display = '';
      }
      if (chatbotContainer) {
        (chatbotContainer as HTMLElement).style.display = '';
      }
      
      // 显示可能已经创建的iframe容器
      const iframes = document.querySelectorAll('iframe[src*="fastgpt.io"]');
      iframes.forEach(iframe => {
        const container = iframe.parentElement;
        if (container) {
          (container as HTMLElement).style.display = '';
        }
      });
    }
  }, [isAdminPath]);
  
  // 如果在admin路径下，不渲染聊天机器人脚本
  if (isAdminPath) {
    return null;
  }
  
  return (
    <>
      {/* FastGPT聊天机器人 */}
      <script 
        type="text/javascript" 
        src="https://cloud.fastgpt.io/js/iframe.js" 
        id="chatbot-iframe" 
        data-bot-src="https://cloud.fastgpt.io/chat/share?shareId=tmwK0bv7ew5luTjxVHylcbi3" 
        data-default-open="true" 
        data-drag="true" 
        data-open-icon="data:image/svg+xml;base64,PHN2ZyB0PSIxNjkwNTMyNzg1NjY0IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjQxMzIiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48cGF0aCBkPSJNNTEyIDMyQzI0Ny4wNCAzMiAzMiAyMjQgMzIgNDY0QTQxMC4yNCA0MTAuMjQgMCAwIDAgMTcyLjQ4IDc2OEwxNjAgOTY1LjEyYTI1LjI4IDI1LjI4IDAgMCAwIDM5LjA0IDIyLjRsMTY4LTExMkE1MjguNjQgNTI4LjY0IDAgMCAwIDUxMiA4OTZjMjY0Ljk2IDAgNDgwLTE5MiA0ODAtNDMyUzc3Ni45NiAzMiA1MTIgMzJ6IG0yNDQuOCA0MTZsLTM2MS42IDMwMS43NmExMi40OCAxMi40OCAwIDAgMS0xOS44NC0xMi40OGw1OS4yLTIzMy45MmgtMTYwYTEyLjQ4IDEyLjQ4IDAgMCAxLTcuMzYtMjMuMzZsMzYxLjYtMzAxLjc2YTEyLjQ4IDEyLjQ4IDAgMCAxIDE5Ljg0IDEyLjQ4bC01OS4yIDIzMy45MmgxNjBhMTIuNDggMTIuNDggMCAwIDEgOCAyMi4wOHoiIGZpbGw9IiM0ZTgzZmQiIHAtaWQ9IjQxMzMiPjwvcGF0aD48L3N2Zz4=" 
        data-close-icon="data:image/svg+xml;base64,PHN2ZyB0PSIxNjkwNTM1NDQxNTI2IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjYzNjciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48cGF0aCBkPSJNNTEyIDEwMjRBNTEyIDUxMiAwIDEgMSA1MTIgMGE1MTIgNTEyIDAgMCAxIDAgMTAyNHpNMzA1Ljk1NjU3MSAzNzAuMzk1NDI5TDQ0Ny40ODggNTEyIDMwNS45NTY1NzEgNjUzLjYwNDU3MWE0NS41NjggNDUuNTY4IDAgMSAwIDY0LjQzODg1OCA2NC40Mzg4NThMNTEyIDU3Ni41MTJsMTQxLjYwNDU3MSAxNDEuNTMxNDI5YTQ1LjU2OCA0NS41NjggMCAwIDAgNjQuNDM4ODU4LTY0LjQzODg1OEw1NzYuNTEyIDUxMmwxNDEuNTMxNDI5LTE0MS42MDQ1NzFhNDUuNTY4IDQ1LjU2OCAwIDEgMC02NC40Mzg4NTgtNjQuNDM4ODU4TDUxMiA0NDcuNDg4IDM3MC4zOTU0MjkgMzA1Ljk1NjU3MWE0NS41NjggNDUuNTY4IDAgMCAwLTY0LjQzODg1OCA2NC40Mzg4NTh6IiBmaWxsPSIjNGU4M2ZkIiBwLWlkPSI2MzY4Ij48L3BhdGg+PC9zdmc+" 
        defer
      />
    </>
  );
}
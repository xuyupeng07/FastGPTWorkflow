'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 默认管理员凭据（在生产环境中应该从环境变量或数据库获取）
const DEFAULT_ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// 从环境变量获取管理员凭据
const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME || DEFAULT_ADMIN_CREDENTIALS.username;
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || DEFAULT_ADMIN_CREDENTIALS.password;

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // 检查本地存储中的认证状态
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const authToken = localStorage.getItem('admin_auth_token');
        const authExpiry = localStorage.getItem('admin_auth_expiry');
        
        if (authToken && authExpiry) {
          const expiryTime = parseInt(authExpiry, 10);
          const currentTime = Date.now();
          
          if (currentTime < expiryTime) {
            setIsAuthenticated(true);
          } else {
            // Token已过期，清除存储
            localStorage.removeItem('admin_auth_token');
            localStorage.removeItem('admin_auth_expiry');
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('检查认证状态失败:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials: { username: string; password: string }): Promise<boolean> => {
    try {
      // 简单的用户名密码验证
      if (credentials.username === ADMIN_USERNAME && credentials.password === ADMIN_PASSWORD) {
        // 生成一个简单的token（在生产环境中应该使用更安全的方法）
        const token = btoa(`${credentials.username}:${Date.now()}`);
        const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24小时后过期
        
        localStorage.setItem('admin_auth_token', token);
        localStorage.setItem('admin_auth_expiry', expiryTime.toString());
        
        setIsAuthenticated(true);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('登录失败:', error);
      return false;
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('admin_auth_token');
      localStorage.removeItem('admin_auth_expiry');
      setIsAuthenticated(false);
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
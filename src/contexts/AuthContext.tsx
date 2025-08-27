'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

interface User {
  id: number;
  username: string;
  email?: string;
  role: string;
  last_login?: Date;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; message?: string }>;
  register: (credentials: { username: string; password: string; inviteCode: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const hasInitialized = useRef(false);

  // 直接使用localStorage，不依赖复杂的加载状态
  const getStorageValue = (key: string): string => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key) || '';
      }
    } catch (e) {
      console.warn(`读取localStorage失败 ${key}:`, e);
    }
    return '';
  };

  const setStorageValue = (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (value) {
          window.localStorage.setItem(key, value);
        } else {
          window.localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn(`设置localStorage失败 ${key}:`, e);
    }
  };

  // 简化的初始化逻辑
  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }

    const initializeAuth = async () => {
      console.log('开始初始化认证状态');
      hasInitialized.current = true;
      
      try {
        // 直接从localStorage读取数据
        const token = getStorageValue('auth_token');
        const storedUserData = getStorageValue('user_data');
        
        console.log('读取到的数据 - token:', token ? '存在' : '不存在', 'userData:', storedUserData);
        
        // 优先从本地存储恢复用户状态
        if (storedUserData && storedUserData.trim() !== '') {
          try {
            const parsedUser = JSON.parse(storedUserData);
            console.log('解析用户数据:', parsedUser);
            
            if (parsedUser && parsedUser.id) {
              setUser(parsedUser);
              setIsAuthenticated(true);
              console.log('从localStorage恢复登录状态成功');
              
              // 异步验证token但不阻塞状态恢复
              if (token && token.trim() !== '') {
                fetch('/api/auth/verify', {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                })
                .then(response => {
                  if (!response.ok) {
                    console.log('Token验证失败，清除认证状态');
                    setStorageValue('auth_token', '');
                    setStorageValue('user_data', '');
                    setIsAuthenticated(false);
                    setUser(null);
                  } else {
                    console.log('Token验证成功');
                  }
                })
                .catch(error => {
                  console.warn('Token验证网络错误，保持本地状态:', error);
                });
              }
            } else {
              console.log('用户数据无效，清除状态');
              setIsAuthenticated(false);
              setUser(null);
            }
          } catch (error) {
            console.error('解析用户数据失败:', error);
            setStorageValue('user_data', '');
            setIsAuthenticated(false);
            setUser(null);
          }
        } else if (token && token.trim() !== '') {
          console.log('只有token，尝试获取用户信息');
          // 只有token没有用户数据时，尝试通过API获取
          try {
            const response = await fetch('/api/auth/verify', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data.user) {
                console.log('通过token获取用户信息成功');
                setIsAuthenticated(true);
                setUser(result.data.user);
                setStorageValue('user_data', JSON.stringify(result.data.user));
              } else {
                console.log('token验证失败，清除token');
                setStorageValue('auth_token', '');
                setIsAuthenticated(false);
                setUser(null);
              }
            } else {
              console.log('token验证请求失败，清除token');
              setStorageValue('auth_token', '');
              setIsAuthenticated(false);
              setUser(null);
            }
          } catch (error) {
            console.error('token验证网络错误:', error);
            setStorageValue('auth_token', '');
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          console.log('无认证信息，设置为未登录状态');
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('初始化认证状态失败:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
        console.log('认证初始化完成');
      }
    };

    // 执行初始化
    initializeAuth();
  }, []); // 只在组件挂载时执行一次

  const login = async (credentials: { username: string; password: string }): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 登录成功，立即更新所有状态
        const token = result.data.token;
        const userData = result.data.user;
        
        // 同步更新localStorage
        setStorageValue('auth_token', token);
        setStorageValue('user_data', JSON.stringify(userData));
        
        // 立即更新React状态
        setIsAuthenticated(true);
        setUser(userData);
        
        // 重置初始化标志，允许下次刷新时重新初始化
        hasInitialized.current = false;
        
        console.log('登录成功，状态已更新:', { isAuthenticated: true, user: userData });
        return { success: true };
      } else {
        // 登录失败，返回服务器返回的错误消息
        const errorMessage = result.message || '用户名或密码错误';
        console.error('登录失败:', errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error('登录请求失败:', error);
      return { success: false, message: '登录失败，请稍后重试' };
    }
  };

  const register = async (credentials: { username: string; password: string; inviteCode: string }): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          message: result.message || '注册成功'
        };
      } else {
        return {
          success: false,
          message: result.message || '注册失败'
        };
      }
    } catch (error) {
      console.error('注册请求失败:', error);
      return {
        success: false,
        message: '注册失败，请稍后重试'
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // 调用注销API
      if (authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
      }
      
      // 清除本地存储 - 确保操作完成
      setStorageValue('auth_token', '');
      setStorageValue('user_data', '');
      
      // 等待一小段时间确保localStorage操作完成
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 验证localStorage确实被清空
      if (typeof window !== 'undefined' && window.localStorage) {
        const remainingToken = window.localStorage.getItem('auth_token');
        const remainingUserData = window.localStorage.getItem('user_data');
        
        if (remainingToken || remainingUserData) {
          console.warn('localStorage未完全清空，强制清除');
          try {
            window.localStorage.removeItem('auth_token');
            window.localStorage.removeItem('user_data');
            // 同时清除sessionStorage备份
            if (window.sessionStorage) {
              window.sessionStorage.removeItem('backup_auth_token');
              window.sessionStorage.removeItem('backup_user_data');
            }
          } catch (e) {
            console.error('强制清除localStorage失败:', e);
          }
        }
      }
      
      // 更新React状态
      setIsAuthenticated(false);
      setUser(null);
      
      // 重置初始化标志
      hasInitialized.current = false;
      
      console.log('登出完成，所有状态已清除');
    } catch (error) {
      console.error('登出失败:', error);
      // 即使API调用失败，也要清除本地状态
      setAuthToken('');
      setUserData('');
      
      // 强制清除localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.removeItem('auth_token');
          window.localStorage.removeItem('user_data');
          if (window.sessionStorage) {
            window.sessionStorage.removeItem('backup_auth_token');
            window.sessionStorage.removeItem('backup_user_data');
          }
        } catch (e) {
          console.error('强制清除localStorage失败:', e);
        }
      }
      
      setIsAuthenticated(false);
      setUser(null);
      
      // 重置初始化标志
      hasInitialized.current = false;
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    login,
    register,
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
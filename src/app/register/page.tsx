'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@radix-ui/react-label';
import { Eye, EyeOff, UserPlus, User, ArrowLeft, Key, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const [credentials, setCredentials] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { register, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 如果已经登录，重定向到主页
  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.username.trim()) {
      toast.error('请输入用户名');
      return;
    }

    if (!credentials.email.trim()) {
      toast.error('请输入邮箱');
      return;
    }
    
    if (!credentials.password.trim()) {
      toast.error('请输入密码');
      return;
    }

    if (!credentials.inviteCode.trim()) {
      toast.error('请输入邀请码');
      return;
    }

    if (credentials.username.length < 3) {
      toast.error('用户名至少3个字符');
      return;
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      toast.error('请输入有效的邮箱地址');
      return;
    }

    if (credentials.password.length < 6) {
      toast.error('密码至少6个字符');
      return;
    }

    if (credentials.password !== credentials.confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await register(credentials);
      if (result.success) {
        toast.success(result.message);
        // 注册成功后跳转到登录页面
        router.push('/login?message=注册成功，请登录');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('注册失败:', error);
      toast.error('注册失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <div className="max-w-md w-full space-y-8 px-4">
          <div className="text-center">
            <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              用户注册
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-6"
      >
        {/* 返回首页按钮 */}
        <div className="flex justify-start">
          <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="text-base font-medium">返回首页</span>
          </Link>
        </div>

        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <Image
              src="/fastgpt-withtext.svg"
              alt="FastGPT"
              width={180}
              height={46}
              className="h-12 w-auto object-contain mx-auto"
              priority
            />
          </Link>

        </div>
        
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">创建新账户</CardTitle>
            <CardDescription>
              请填写以下信息完成注册
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 用户名输入 */}
              <div>
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">用户名</Label>
                <div className="mt-1 relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入用户名（3-20个字符）"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                    minLength={3}
                    maxLength={20}
                  />
                </div>
              </div>

              {/* 邮箱输入 */}
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">邮箱地址</Label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入邮箱地址"
                    value={credentials.email}
                    onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* 密码输入 */}
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">密码</Label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码（至少6个字符）"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                    minLength={6}
                    maxLength={50}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" /> : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />}
                  </button>
                </div>
              </div>

              {/* 确认密码输入 */}
              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">确认密码</Label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="请再次输入密码"
                    value={credentials.confirmPassword}
                    onChange={(e) => setCredentials(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="pl-10 pr-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                    minLength={6}
                    maxLength={50}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" /> : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />}
                  </button>
                </div>
              </div>

              {/* 邀请码输入 */}
              <div>
                <Label htmlFor="inviteCode" className="text-sm font-medium text-gray-700">邀请码</Label>
                <div className="mt-1 relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="inviteCode"
                    type="text"
                    placeholder="请输入邀请码"
                    value={credentials.inviteCode}
                    onChange={(e) => setCredentials(prev => ({ ...prev, inviteCode: e.target.value }))}
                    className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full bg-black text-white hover:bg-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
                  disabled={isSubmitting}
                >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    注册中...
                  </div>
                ) : (
                  '创建账户'
                )}
                </Button>
              </div>
            </form>

          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-gray-500">
          <p>已有账户？<Link href="/login" className="text-blue-600 hover:text-blue-800 cursor-pointer transition-colors duration-200">立即登录</Link></p>
        </div>
      </motion.div>
    </div>
  );
}
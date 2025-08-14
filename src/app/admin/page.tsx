'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@radix-ui/react-label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// 从 shadcn/ui 组件库导入表格相关组件
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Search, Filter, Heart, Users, LogOut, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import Image from 'next/image';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import AdminLogin from '@/components/AdminLogin';
import { getApiUrl } from '@/lib/config';
import LinkManagement from '@/components/LinkManagement';

interface Workflow {
  id: string;
  title: string;
  description: string;
  category_id: string;
  category_name: string;
  author_id: number;
  author_name: string;
  thumbnail_image_id: string;
  usage_count: number;
  like_count: number;
  demo_url?: string;
  no_login_url?: string;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;

  json_source?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  workflow_count: number;
  sort_order?: number;
}

interface Author {
  id: number;
  name: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  website_url?: string;
  github_url?: string;
  is_verified: boolean;
}

interface SourceType {
  id: number;
  name: string;
  name_en: string;
}

interface Platform {
  id: number;
  name: string;
  abbreviation: string;
}

interface User {
  id: number;
  username: string;
  email?: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  login_attempts: number;
  locked_until?: string;
}



const API_BASE_URL = getApiUrl();

function AdminContent() {
  const { logout } = useAuth();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [activeTab, setActiveTab] = useState('workflows');
  const [uploading, setUploading] = useState(false);
  
  // 用户管理相关状态
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  
  // 用户分页状态
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userPageSize] = useState(20);
  const [userTotal, setUserTotal] = useState(0);
  
  // 用户表单数据
  const [userFormData, setUserFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    is_active: true
  });
  
  // 邮箱验证状态
  const [emailError, setEmailError] = useState('');
  // 密码验证状态
  const [passwordError, setPasswordError] = useState('');
  
  // 邮箱格式验证函数
  const validateEmail = (email: string) => {
    if (!email.trim()) {
      return '';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return '请输入有效的邮箱格式';
    }
    return '';
  };
  
  // 密码验证函数
  const validatePassword = (password: string) => {
    if (!password.trim()) {
      return '';
    }
    if (password.length < 6) {
      return '密码长度至少6个字符';
    }
    return '';
  };

  
  // 防抖搜索
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // 搜索时重置到第一页
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // 分类变化时重置分页
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);
  

  
  // 分类管理相关状态
  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] = useState(false);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  
  const [categoryFormData, setCategoryFormData] = useState<{
    name: string;
    description: string;
    sort_order?: number;
  }>({
    name: '',
    description: ''
  });

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    author_id: '',
    thumbnail_image_id: '',
    demo_url: '',
    no_login_url: '',
    is_featured: false,
    is_published: true,
    json_source: '',
    source_type: 'FastAgent',
    platform: 'FastAgent'
  });
  
  // urlgeneration相关状态
  const [sourceTypes, setSourceTypes] = useState<{id: number, sourcetype: string, en: string}[]>([]);
  const [platforms, setPlatforms] = useState<{id: number, platform: string, abbreviation: string}[]>([]);
  const [generatingDemoUrl, setGeneratingDemoUrl] = useState(false);
  
  // 添加本地图片预览状态
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 调试预览图片状态
  useEffect(() => {
    console.log('Preview image state changed:', !!previewImage, previewImage?.substring(0, 50) + '...');
  }, [previewImage]);

  // 优化的过滤逻辑
  const filteredWorkflows = useMemo(() => {
    let filtered = workflows;
    
    // 搜索过滤（使用防抖后的搜索词）
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(workflow => 
        workflow.title.toLowerCase().includes(term) ||
        workflow.description.toLowerCase().includes(term) ||
        workflow.author_name.toLowerCase().includes(term)
      );
    }
    
    // 分类过滤
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(workflow => workflow.category_id === selectedCategory);
    }
    
    return filtered;
  }, [workflows, debouncedSearchTerm, selectedCategory]);
  
  // 分页数据
  const paginatedWorkflows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredWorkflows.slice(startIndex, endIndex);
  }, [filteredWorkflows, currentPage, pageSize]);
  
  // 总页数
  const totalPages = Math.ceil(filteredWorkflows.length / pageSize);

  // 获取数据
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 优先加载关键数据 - 使用admin API获取所有工作流（包括未发布的）
      const workflowsRes = await fetch(`${API_BASE_URL}/admin/workflows?limit=50`);
      const workflowsData = await workflowsRes.json();
      if (workflowsData.success) {
        setWorkflows(workflowsData.data);
        setLoading(false); // 主要内容已加载
      }
      
      // 后台加载其他数据
      const [categoriesRes, authorsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/categories`),
        fetch(`${API_BASE_URL}/authors`)
      ]);

      const [categoriesData, authorsData] = await Promise.all([
        categoriesRes.json(),
        authorsRes.json()
      ]);

      if (categoriesData.success) setCategories(categoriesData.data);
      if (authorsData.success) setAuthors(authorsData.data);
      
      // 获取来源类型和平台数据
      try {
        const [sourceTypesRes, platformsRes] = await Promise.all([
          fetch('/api/sourcetypes'),
          fetch('/api/platforms')
        ]);
        
        if (sourceTypesRes.ok) {
          const sourceTypesData = await sourceTypesRes.json();
          if (sourceTypesData.success) {
            setSourceTypes(sourceTypesData.sourceTypes);
          }
        }
        
        if (platformsRes.ok) {
          const platformsData = await platformsRes.json();
          if (platformsData.success) {
            setPlatforms(platformsData.platforms);
          }
        }
      } catch (error) {
        console.error('获取urlgeneration数据失败:', error);
      }
      
      // 获取用户数据
      try {
        const usersRes = await fetch('/api/admin/users');
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (usersData.success) {
            setUsers(usersData.data.users);
            setUserTotal(usersData.data.total);
          }
        }
      } catch (error) {
        console.error('获取用户数据失败:', error);
      }
    } catch (_error) {
      console.error('获取数据失败:', _error);
      toast.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 用户管理相关函数
  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: userCurrentPage.toString(),
        limit: userPageSize.toString(),
        ...(userSearchTerm && { search: userSearchTerm }),
        ...(selectedRole && selectedRole !== 'all' && { role: selectedRole }),
        ...(selectedStatus && selectedStatus !== 'all' && { status: selectedStatus })
      });
      
      const response = await fetch(`${API_BASE_URL}/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.data.users);
          setUserTotal(data.data.total);
        }
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      toast.error('获取用户列表失败');
    }
  };

  const handleCreateUser = async () => {
    // 表单验证
    if (!userFormData.username.trim()) {
      toast.error('请输入用户名');
      return;
    }
    if (!userFormData.email.trim()) {
      toast.error('请输入邮箱');
      return;
    }
    
    // 验证邮箱格式
    const emailValidationError = validateEmail(userFormData.email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }
    
    if (!userFormData.password.trim()) {
      toast.error('请输入密码');
      return;
    }
    
    // 验证密码长度
    const passwordValidationError = validatePassword(userFormData.password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userFormData),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('用户创建成功');
        setIsCreateUserDialogOpen(false);
        setUserFormData({
          username: '',
          email: '',
          password: '',
          role: 'user',
          is_active: true
        });
        setEmailError('');
        setPasswordError('');
        fetchUsers();
      } else {
        // 显示后端返回的详细错误信息
        const errorMessage = data.error || data.message || '创建用户失败';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('创建用户失败:', error);
      toast.error('网络错误，请稍后重试');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      email: user.email || '',
      password: '',
      role: user.role,
      is_active: user.is_active
    });
    setEmailError(''); // 清除邮箱错误状态
    setIsEditUserDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    // 验证邮箱格式
    if (userFormData.email.trim()) {
      const emailValidationError = validateEmail(userFormData.email);
      if (emailValidationError) {
        setEmailError(emailValidationError);
        return;
      }
    }
    
    // 验证密码长度（如果提供了密码）
    if (userFormData.password.trim()) {
      const passwordValidationError = validatePassword(userFormData.password);
      if (passwordValidationError) {
        setPasswordError(passwordValidationError);
        return;
      }
    }
    
    try {
      const updateData = {
        username: userFormData.username,
        email: userFormData.email,
        role: userFormData.role,
        is_active: userFormData.is_active,
        ...(userFormData.password && { password: userFormData.password })
      };
      
      const response = await fetch(`${API_BASE_URL}/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('用户更新成功');
        setIsEditUserDialogOpen(false);
        setEditingUser(null);
        setUserFormData({
          username: '',
          email: '',
          password: '',
          role: 'user',
          is_active: true
        });
        setEmailError('');
        fetchUsers();
      } else {
        // 显示后端返回的详细错误信息
        const errorMessage = data.error || data.message || '更新用户失败';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('更新用户失败:', error);
      toast.error('网络错误，请稍后重试');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('用户删除成功');
        fetchUsers();
      } else {
        toast.error(data.message || '删除用户失败');
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      toast.error('删除用户失败');
    }
  };

  const handleBatchUpdateUsers = async (action: 'activate' | 'deactivate' | 'unlock') => {
    if (selectedUsers.length === 0) {
      toast.error('请选择要操作的用户');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userIds: selectedUsers
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        const actionText = {
          activate: '激活',
          deactivate: '禁用',
          unlock: '解锁'
        }[action];
        toast.success(`用户${actionText}成功`);
        setSelectedUsers([]);
        fetchUsers();
      } else {
        toast.error(data.message || '批量操作失败');
      }
    } catch (error) {
      console.error('批量操作失败:', error);
      toast.error('批量操作失败');
    }
  };

  // 生成登录跳转短链
  const generateDemoUrl = async () => {
    if (!formData.title || !formData.source_type || !formData.platform) {
      toast.error('请先填写工作流标题、来源类型和平台');
      return;
    }

    setGeneratingDemoUrl(true);
    try {
      let workflowUrl = null;
      
      // 无论是新建还是编辑模式，都需要确保workflow表中有正确的数据
      if (!formData.json_source) {
        toast.error('请先填写JSON源码');
        return;
      }
      
      // 1. 先在urlgeneration中创建或更新项目
      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectCode: formData.title,
          projectDescription: formData.description,
          workflow: JSON.parse(formData.json_source)
        }),
      });

      const projectResult = await projectResponse.json();
      if (!projectResult.success) {
        // 如果是工作流名称已存在的错误，需要更新现有项目
        if (projectResult.message && projectResult.message.includes('已存在')) {
          console.log('项目已存在，更新现有项目:', projectResult.message);
          
          // 更新现有项目的workflow数据
          try {
            const updateResponse = await fetch('/api/projects/update', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                projectCode: formData.title,
                projectDescription: formData.description,
                workflow: JSON.parse(formData.json_source)
              }),
            });
            
            const updateResult = await updateResponse.json();
            if (updateResult.success) {
              workflowUrl = updateResult.url;
            } else {
              // 如果更新失败，尝试获取现有项目的URL
              const existingProjectResponse = await fetch('/api/projects');
              const existingProjects = await existingProjectResponse.json();
              if (existingProjects.success) {
                const existingProject = existingProjects.projects.find((p: any) => p.project_code === formData.title);
                if (existingProject && existingProject.url) {
                  workflowUrl = existingProject.url;
                } else {
                  throw new Error('无法获取现有项目的URL');
                }
              } else {
                throw new Error('无法获取现有项目信息');
              }
            }
          } catch (updateError) {
            console.error('更新项目失败，尝试获取现有URL:', updateError);
            // 如果更新失败，尝试获取现有项目的URL
            const existingProjectResponse = await fetch('/api/projects');
            const existingProjects = await existingProjectResponse.json();
            if (existingProjects.success) {
              const existingProject = existingProjects.projects.find((p: any) => p.project_code === formData.title);
              if (existingProject && existingProject.url) {
                workflowUrl = existingProject.url;
              } else {
                throw new Error('无法获取现有项目的URL');
              }
            } else {
              throw new Error('无法获取现有项目信息');
            }
          }
        } else {
          throw new Error(projectResult.message || '创建项目失败');
        }
      } else {
        workflowUrl = projectResult.url;
      }

      // 2. 生成登录跳转短链
      const linkResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceType: formData.source_type,
          platform: formData.platform,
          projectCode: formData.title,
          workflow_url: workflowUrl
        }),
      });

      const linkResult = await linkResponse.json();
      if (linkResult.shortUrl) {
        setFormData({ ...formData, demo_url: linkResult.shortUrl });
        toast.success('登录跳转短链生成成功！');
      } else {
        throw new Error('生成短链失败');
      }
    } catch (error: any) {
      console.error('生成登录跳转短链失败:', error);
      toast.error(error.message || '生成登录跳转短链失败');
    } finally {
      setGeneratingDemoUrl(false);
    }
  };

  // 创建工作流
  const handleCreate = async () => {
    // 表单验证
    if (!formData.title.trim()) {
      toast.error('请输入工作流标题');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('请输入工作流描述');
      return;
    }
    if (!formData.category_id) {
      toast.error('请选择分类');
      return;
    }
    if (!formData.author_id) {
      toast.error('请选择作者');
      return;
    }
    // 检查是否正在上传图片
    if (uploading) {
      toast.error('图片正在上传中，请等待上传完成');
      return;
    }
    // 验证必须上传工作流Logo
    if (!formData.thumbnail_image_id) {
      toast.error('请上传工作流Logo');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.success) {
        // 如果有临时图片，确认图片关联
        if (formData.thumbnail_image_id) {
          try {
            const confirmResponse = await fetch('/api/images/confirm', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                imageId: formData.thumbnail_image_id,
                entityType: 'workflow',
                entityId: result.data.id,
                usageType: 'thumbnail',
                isPrimary: true
              }),
            });
            
            const confirmResult = await confirmResponse.json();
            if (!confirmResult.success) {
              console.warn('图片确认失败:', confirmResult.error);
            }
          } catch (error) {
            console.warn('图片确认失败:', error);
          }
        }
        
        toast.success('工作流创建成功');
        setIsCreateDialogOpen(false);
        await resetForm();
        fetchData();
      } else {
        toast.error(result.error || '创建失败');
      }
    } catch (_error) {
      console.error('创建失败:', _error);
      toast.error('创建失败: ' + (_error instanceof Error ? _error.message : '未知错误'));
    }
  };

  // 更新工作流
  const handleUpdate = async () => {
    if (!editingWorkflow) return;

    // 表单验证
    if (!formData.title.trim()) {
      toast.error('请输入工作流标题');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('请输入工作流描述');
      return;
    }
    if (!formData.category_id) {
      toast.error('请选择分类');
      return;
    }
    if (!formData.author_id) {
      toast.error('请选择作者');
      return;
    }
    if (!formData.thumbnail_image_id) {
      toast.error('请上传工作流Logo');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/workflows/${editingWorkflow.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('工作流更新成功');
        setIsEditDialogOpen(false);
        setEditingWorkflow(null);
        await resetForm();
        fetchData();
      } else {
        toast.error(result.error || '更新失败');
      }
    } catch (_error) {
      console.error('更新失败:', _error);
      toast.error('更新失败');
    }
  };

  // 删除工作流
  const handleDelete = async (id: string) => {
    confirm({
      title: '删除工作流',
      description: '确定要删除这个工作流吗？此操作无法撤销。',
      variant: 'destructive',
      confirmText: '删除',
      onConfirm: async () => {
        await deleteWorkflow(id);
      }
    });
  };

  const deleteWorkflow = async (id: string) => {

    try {
      // 先获取工作流信息，以便解除图片关联
      const getResponse = await fetch(`${API_BASE_URL}/admin/workflows/${id}`);
      const getResult = await getResponse.json();
      
      let thumbnailImageId = '';
      if (getResult.success && getResult.data.thumbnail_image_id) {
        thumbnailImageId = getResult.data.thumbnail_image_id;
      }

      // 删除工作流
      const response = await fetch(`${API_BASE_URL}/admin/workflows/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        // 如果工作流删除成功，且有缩略图，则强制删除图片
        if (thumbnailImageId) {
          try {
            await fetch(`/api/images/delete`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                imageId: thumbnailImageId,
                force: true  // 强制删除，确保图片被真正删除
              }),
            });
          } catch (error) {
            console.warn('删除图片失败:', error);
          }
        }
        
        toast.success('工作流删除成功');
        fetchData();
      } else {
        toast.error(result.error || '删除失败');
      }
    } catch (_error) {
      console.error('删除失败:', _error);
      toast.error('删除失败');
    }
  };

  // 清理临时图片
  const cleanupTempImage = async (imageId: string) => {
    if (!imageId) return;
    
    try {
      await fetch(`/api/images/temp-upload?imageId=${imageId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.warn('清理临时图片失败:', error);
    }
  };

  // 重置表单
  const resetForm = async () => {
    // 如果有临时图片，先清理
    if (formData.thumbnail_image_id) {
      await cleanupTempImage(formData.thumbnail_image_id);
    }
    
    setFormData({
      title: '',
      description: '',
      category_id: '',
      author_id: '',
      thumbnail_image_id: '',
      demo_url: '',
      no_login_url: '',
      is_featured: false,
      is_published: true,
      json_source: '',
      source_type: 'FastAgent',
      platform: 'FastAgent'
    });
    setPreviewImage(null); // 清除预览图片
  };

  // 处理文件上传 - 使用数据库存储
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 更精确的文件类型检查
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('请选择支持的图片格式：JPG、PNG、GIF、WebP、SVG');
      return;
    }

    // 检查文件大小（5MB限制）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('文件大小不能超过5MB');
      return;
    }

    // 创建本地预览
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      console.log('FileReader loaded, result length:', result?.length);
      setPreviewImage(result);
    };
    reader.onerror = (e) => {
      console.error('FileReader error:', e);
      toast.error('图片预览失败');
    };
    reader.readAsDataURL(file);
    console.log('Starting FileReader for file:', file.name, file.type, file.size);

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file); // API期望的字段名是'image'

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        toast.error('上传超时，请检查网络连接或尝试压缩图片后重新上传');
      }, 60000); // 增加到60秒超时

      // 添加上传进度提示
      toast.info('正在上传图片，请稍候...');

      const response = await fetch(`/api/images/temp-upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = '上传失败';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `服务器错误: ${response.status}`;
        } catch {
          errorMessage = `网络错误: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        setFormData(prev => ({ ...prev, thumbnail_image_id: result.data.imageId }));
        setPreviewImage(null); // 清除本地预览，让组件显示服务器图片
        toast.success(`Logo上传成功！文件大小: ${Math.round(result.data.fileSize / 1024)}KB`);
      } else {
        throw new Error(result.error || '上传处理失败');
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          toast.error('上传超时，请检查网络连接');
        } else {
          toast.error(error.message || '上传失败，请重试');
        }
      } else {
        toast.error('上传失败，请重试');
      }
      console.error('上传失败:', error);
    } finally {
      setUploading(false);
      // 清空input，允许重复选择同一文件
      event.target.value = '';
    }
  };

  // 删除数据库中的图片记录
  const handleDeleteImage = async (imageId: string) => {
    if (!imageId) return;
    
    try {
      // 对于新建工作流场景，我们希望强制删除图片
      // 因为用户明确点击了删除按钮
      const response = await fetch(`/api/images/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: imageId,
          force: true  // 强制删除，即使图片正在被使用
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '删除失败' }));
        throw new Error(errorData.error || '删除失败');
      }

      const result = await response.json();
      // 清空表单中的缩略图ID
      setFormData(prev => ({ ...prev, thumbnail_image_id: '' }));
      toast.success(result.message || '图片删除成功');
    } catch (error) {
      console.error('删除图片失败:', error);
      if (error instanceof Error) {
        toast.error(error.message || '删除失败');
      } else {
        toast.error('删除失败，请重试');
      }
      // 即使删除失败，也清空表单字段
      setFormData(prev => ({ ...prev, thumbnail_image_id: '' }));
    }
  };

  // 编辑工作流
  const handleEdit = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    
    setFormData({
      title: workflow.title,
      description: workflow.description,
      category_id: workflow.category_id,
      author_id: workflow.author_id.toString(),
      thumbnail_image_id: workflow.thumbnail_image_id || '',
      demo_url: workflow.demo_url || '',
      no_login_url: workflow.no_login_url || '',
      is_featured: workflow.is_featured,
      is_published: workflow.is_published,
      json_source: workflow.json_source || '',
      source_type: 'FastAgent',
      platform: 'FastAgent'
    });
    setIsEditDialogOpen(true);
  };



  // 分类管理函数
  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      description: ''
    });
  };

  // 创建分类
  const handleCreateCategory = async () => {
    // 表单验证
    if (!categoryFormData.name.trim()) {
      toast.error('请输入分类名称');
      return;
    }


    try {
      // 创建分类时不发送sort_order，让后端自动处理
      const createData = {
        name: categoryFormData.name,
        description: categoryFormData.description
      };
      const response = await fetch(`${API_BASE_URL}/admin/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createData),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('分类创建成功');
        setIsCreateCategoryDialogOpen(false);
        resetCategoryForm();
        fetchData();
      } else {
        toast.error(result.error || '创建失败');
      }
    } catch (_error) {
      console.error('创建分类失败:', _error);
      toast.error('创建失败');
    }
  };

  // 更新分类
  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    // 表单验证
    if (!categoryFormData.name.trim()) {
      toast.error('请输入分类名称');
      return;
    }


    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryFormData),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('分类更新成功');
        setIsEditCategoryDialogOpen(false);
        setEditingCategory(null);
        resetCategoryForm();
        fetchData();
      } else {
        toast.error(result.error || '更新失败');
      }
    } catch (_error) {
      console.error('更新分类失败:', _error);
      toast.error('更新失败');
    }
  };

  // 删除分类
  const handleDeleteCategory = async (id: string) => {
    confirm({
      title: '删除分类',
      description: '确定要删除这个分类吗？删除后相关的工作流将被移动到默认分类。',
      variant: 'destructive',
      confirmText: '删除',
      onConfirm: async () => {
        await deleteCategoryAction(id);
      }
    });
  };

  const deleteCategoryAction = async (id: string) => {

    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        toast.success('分类删除成功');
        fetchData();
      } else {
        toast.error(result.error || '删除失败');
      }
    } catch (_error) {
      console.error('删除分类失败:', _error);
      toast.error('删除失败');
    }
  };

  // 编辑分类
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      sort_order: category.sort_order || 0
    });
    setIsEditCategoryDialogOpen(true);
  };

  // 过滤工作流逻辑已移至useMemo优化版本

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">工作流管理后台</h1>
            <p className="text-gray-600">管理工作流卡片的增删改查操作</p>
          </div>
          <Button
          onClick={logout}
          className="bg-black text-white hover:bg-gray-800 flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          登出
        </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="workflows">工作流管理</TabsTrigger>
            <TabsTrigger value="categories">分类管理</TabsTrigger>
            <TabsTrigger value="authors">作者管理</TabsTrigger>
            <TabsTrigger value="stats">统计信息</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>工作流列表</CardTitle>
                <CardDescription>管理所有工作流卡片</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="搜索工作流..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        disabled
                      />
                    </div>
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled>
                    <SelectTrigger className="w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">所有分类</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button disabled>
                    <Plus className="h-4 w-4 mr-2" />
                    新建工作流
                  </Button>
                </div>
                
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <div className="text-lg text-gray-600">正在加载工作流数据...</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>分类管理</CardTitle>
                <CardDescription>管理工作流分类</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <div className="text-lg text-gray-600">正在加载分类数据...</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="authors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>作者管理</CardTitle>
                <CardDescription>管理工作流作者</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <div className="text-lg text-gray-600">正在加载作者数据...</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>统计信息</CardTitle>
                <CardDescription>查看系统统计数据</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <div className="text-lg text-gray-600">正在加载统计数据...</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">工作流管理后台</h1>
          <p className="text-sm sm:text-base text-gray-600">管理工作流卡片的增删改查操作</p>
        </div>
        <Button
          onClick={logout}
          className="bg-black text-white hover:bg-gray-800 flex items-center gap-2 w-fit"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">登出</span>
          <span className="sm:hidden">退出</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 w-full overflow-x-auto scrollbar-hide">
          <TabsTrigger value="workflows" className="rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-white/70 data-[state=inactive]:hover:scale-105 data-[state=inactive]:hover:shadow-sm">工作流管理</TabsTrigger>
          <TabsTrigger value="categories" className="rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-white/70 data-[state=inactive]:hover:scale-105 data-[state=inactive]:hover:shadow-sm">分类管理</TabsTrigger>
          <TabsTrigger value="authors" className="rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-white/70 data-[state=inactive]:hover:scale-105 data-[state=inactive]:hover:shadow-sm">作者管理</TabsTrigger>
          <TabsTrigger value="users" className="rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-white/70 data-[state=inactive]:hover:scale-105 data-[state=inactive]:hover:shadow-sm">用户管理</TabsTrigger>
          <TabsTrigger value="links" className="rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-white/70 data-[state=inactive]:hover:scale-105 data-[state=inactive]:hover:shadow-sm">链接管理</TabsTrigger>
          <TabsTrigger value="stats" className="rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-white/70 data-[state=inactive]:hover:scale-105 data-[state=inactive]:hover:shadow-sm">统计信息</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          {/* 工具栏 */}
          <Card>
            <CardHeader>
              <CardTitle>工作流列表</CardTitle>
              <CardDescription>管理所有工作流卡片</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="搜索工作流..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">所有分类</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={isCreateDialogOpen} onOpenChange={async (open) => {
          if (!open && formData.thumbnail_image_id) {
            // 对话框关闭时清理临时图片
            await cleanupTempImage(formData.thumbnail_image_id);
          }
          setIsCreateDialogOpen(open);
        }}>
                     <DialogTrigger asChild>
                       <Button 
                         onClick={async () => { await resetForm(); setIsCreateDialogOpen(true); }}
                         className="bg-black text-white hover:bg-gray-800 w-full sm:w-auto"
                       >
                         <Plus className="h-4 w-4 mr-2" />
                         <span className="hidden sm:inline">新建工作流</span>
                         <span className="sm:hidden">新建</span>
                       </Button>
                     </DialogTrigger>
                     <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white scrollbar-custom">
                    <DialogHeader>
                      <DialogTitle>创建新工作流</DialogTitle>
                      <DialogDescription>
                        填写工作流的基本信息
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="title">标题</Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="工作流标题"
                          />
                        </div>
                        <div>
                          <Label htmlFor="category">分类</Label>
                          <Select value={formData.category_id} onValueChange={(value: string) => setFormData({ ...formData, category_id: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="选择分类" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              {categories.filter(category => category.id !== 'all').map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="description">工作流描述</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="工作流的描述，将展示在前端的工作流卡片上"
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="author">作者</Label>
                          <Select value={formData.author_id} onValueChange={(value: string) => setFormData({ ...formData, author_id: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="选择作者" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              {authors.map((author) => (
                                <SelectItem key={author.id} value={author.id.toString()}>
                                  {author.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="json_source">JSON源码</Label>
                          <Textarea
                            id="json_source"
                            value={formData.json_source}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, json_source: e.target.value })}
                            placeholder="请粘贴工作流的JSON源码"
                            rows={4}
                          />
                        </div>
                      </div>

                      {/* 登录跳转短链生成相关字段 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="source_type">来源类型</Label>
                          <Select value={formData.source_type} onValueChange={(value) => setFormData({ ...formData, source_type: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="选择来源类型" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              {sourceTypes.map((sourceType: any) => (
                                <SelectItem key={sourceType.id} value={sourceType.name}>
                                  {sourceType.name} ({sourceType.name_en})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="platform">媒体平台</Label>
                          <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="选择媒体平台" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              {platforms.map((platform: any) => (
                                <SelectItem key={platform.id} value={platform.name}>
                                  {platform.name} ({platform.abbreviation})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="thumbnail_image_id">工作流Logo</Label>
                        <div className="space-y-3">
                          {/* 文件上传 */}
                          <div className="flex items-center space-x-3">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              disabled={uploading}
                              className="hidden"
                              id="logo-upload"
                            />
                            <label
                              htmlFor="logo-upload"
                              className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                uploading ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              {uploading ? '上传中...' : '选择图片'}
                            </label>
                            <span className="text-sm text-gray-500">支持 JPG、PNG、GIF，最大5MB</span>
                          </div>
                          
                          {/* 图片预览 */}
                          {(previewImage || formData.thumbnail_image_id) && (
                            <div className="mt-2 relative inline-block">
                              {previewImage ? (
                                <img
                                  src={previewImage}
                                  alt="Logo预览"
                                  className="w-20 h-20 object-cover rounded border"
                                  onLoad={() => console.log('Preview image loaded successfully')}
                                  onError={(e) => {
                                    console.error('Preview image load error:', e);
                                    toast.error('预览图片加载失败');
                                  }}
                                />
                              ) : (
                                <div className="w-20 h-20 flex items-center justify-center overflow-hidden rounded border">
                                  <Image
                                    src={`/api/images/${formData.thumbnail_image_id}`}
                                    alt="Logo预览"
                                    width={80}
                                    height={80}
                                    className="max-w-full max-h-full object-contain"
                                    style={{
                                      imageRendering: 'auto'
                                    } as React.CSSProperties}
                                    unoptimized
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                                    }}
                                  />
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  if (previewImage) {
                                    setPreviewImage(null);
                                  } else {
                                    handleDeleteImage(formData.thumbnail_image_id);
                                  }
                                }}
                                className="absolute -top-2 -right-2 bg-black text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
                                title="删除图片"
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="demo_url">登录跳转短链</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="demo_url"
                            value={formData.demo_url}
                            onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
                            placeholder="登录跳转短链（可选）"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            onClick={generateDemoUrl}
                            disabled={generatingDemoUrl || !formData.title || !formData.json_source || !formData.source_type || !formData.platform}
                            className="bg-blue-500 text-white hover:bg-blue-600 whitespace-nowrap"
                          >
                            {generatingDemoUrl ? '生成中...' : '生成链接'}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="no_login_url">免登录窗口链接</Label>
                        <Input
                          id="no_login_url"
                          value={formData.no_login_url}
                          onChange={(e) => setFormData({ ...formData, no_login_url: e.target.value })}
                          placeholder="免登录窗口链接（可选）"
                        />
                      </div>

                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.is_featured}
                            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                          />
                          <span>VIP</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.is_published}
                            onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                          />
                          <span>发布</span>
                        </label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={async () => {
                          // 清理临时图片
                          if (formData.thumbnail_image_id) {
                            await cleanupTempImage(formData.thumbnail_image_id);
                          }
                          setIsCreateDialogOpen(false);
                           await resetForm();
                        }}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        取消
                      </Button>
                      <Button 
                        onClick={handleCreate}
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        创建
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                 </div>
               </div>

              {/* 工作流表格 */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>标题</TableHead>
                      <TableHead>分类</TableHead>
                      <TableHead>作者</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>统计</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedWorkflows.map((workflow) => (
                      <TableRow key={workflow.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded">
                              <Image
                                src={workflow.thumbnail_image_id ? `/api/images/${workflow.thumbnail_image_id}` : '/placeholder.svg'}
                                alt={workflow.title}
                                width={40}
                                height={40}
                                className="max-w-full max-h-full object-contain"
                                style={{
                                  imageRendering: 'auto'
                                } as React.CSSProperties}
                                unoptimized={workflow.thumbnail_image_id ? true : false}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                                }}
                              />
                            </div>
                            <div>
                              <div className="font-medium">{workflow.title}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {workflow.description}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{workflow.category_name}</Badge>
                        </TableCell>
                        <TableCell>{workflow.author_name}</TableCell>

                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            {workflow.is_published ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                已发布
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-600 border-gray-600">
                                未发布
                              </Badge>
                            )}
                            {workflow.is_featured && (
                              <Badge variant="outline" className="text-blue-600 border-blue-600">
                                VIP
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1"><Heart className="w-3 h-3" /> {workflow.like_count || 0}</div>
                            <div className="flex items-center gap-1"><Users className="w-3 h-3" /> {workflow.usage_count || 0}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(workflow)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(workflow.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 分页控件 */}
              {filteredWorkflows.length > pageSize && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-gray-500">
                    显示 {Math.min((currentPage - 1) * pageSize + 1, filteredWorkflows.length)} - {Math.min(currentPage * pageSize, filteredWorkflows.length)} 条，共 {filteredWorkflows.length} 条
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      上一页
                    </Button>
                    <span className="text-sm">
                      第 {currentPage} 页，共 {totalPages} 页
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
              
              {filteredWorkflows.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  没有找到匹配的工作流
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>分类管理</CardTitle>
                <CardDescription>管理工作流分类</CardDescription>
              </div>
              <Button onClick={() => setIsCreateCategoryDialogOpen(true)} className="bg-black text-white hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                新建分类
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>分类</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>工作流数量</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {category.description || '-'}
                        </TableCell>
                        <TableCell>{category.workflow_count}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {categories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  暂无分类数据
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authors">
          <Card>
            <CardHeader>
              <CardTitle>作者管理</CardTitle>
              <CardDescription>管理工作流作者</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {authors.map((author) => (
                  <Card key={author.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-full flex-shrink-0">
                          <Image
                            src={author.avatar_url || '/default-avatar.svg'}
                            alt={author.name}
                            width={40}
                            height={40}
                            className="max-w-full max-h-full object-contain"
                            style={{
                              imageRendering: (author.avatar_url || '/default-avatar.svg').endsWith('.svg') ? 'auto' : 'crisp-edges'
                            } as React.CSSProperties}
                            unoptimized={(author.avatar_url || '/default-avatar.svg').endsWith('.svg')}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{author.name}</h3>
                            {author.is_verified && (
                              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          {author.email && (
                            <p className="text-sm text-gray-500">{author.email}</p>
                          )}
                        </div>
                      </div>
                      {author.bio && (
                        <p className="text-sm text-gray-600 mt-2">{author.bio}</p>
                      )}
                      <div className="flex space-x-2 mt-3">
                        {author.website_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={author.website_url} target="_blank" rel="noopener noreferrer">
                              网站
                            </a>
                          </Button>
                        )}
                        {author.github_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={author.github_url} target="_blank" rel="noopener noreferrer">
                              GitHub
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>用户管理</CardTitle>
                <CardDescription>管理系统用户</CardDescription>
              </div>
              <Button onClick={() => {
                setUserFormData({
                  username: '',
                  email: '',
                  password: '',
                  role: 'user',
                  is_active: true
                });
                setIsCreateUserDialogOpen(true);
              }} className="bg-black text-white hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                新建用户
              </Button>
            </CardHeader>
            <CardContent>
              {/* 搜索和筛选 */}
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="搜索用户名或邮箱..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="角色" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">全部角色</SelectItem>
                      <SelectItem value="admin">管理员</SelectItem>
                      <SelectItem value="user">普通用户</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="状态" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="active">激活</SelectItem>
                      <SelectItem value="inactive">禁用</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={fetchUsers} variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    筛选
                  </Button>
                </div>
              </div>

              {/* 批量操作 */}
              {selectedUsers.length > 0 && (
                <div className="flex gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700">已选择 {selectedUsers.length} 个用户</span>
                  <div className="flex gap-2 ml-auto">
                    <Button size="sm" onClick={() => handleBatchUpdateUsers('activate')} className="bg-green-600 hover:bg-green-700">
                      批量激活
                    </Button>
                    <Button size="sm" onClick={() => handleBatchUpdateUsers('deactivate')} className="bg-red-600 hover:bg-red-700">
                      批量禁用
                    </Button>
                    <Button size="sm" onClick={() => handleBatchUpdateUsers('unlock')} className="bg-blue-600 hover:bg-blue-700">
                      批量解锁
                    </Button>
                  </div>
                </div>
              )}

              {/* 用户表格 */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(users.map(u => u.id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>用户名</TableHead>
                      <TableHead>邮箱</TableHead>
                      <TableHead>角色</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>最后登录</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? '管理员' : '普通用户'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={user.is_active ? 'default' : 'destructive'}>
                              {user.is_active ? '激活' : '禁用'}
                            </Badge>
                            {user.locked_until && new Date(user.locked_until) > new Date() && (
                              <Badge variant="destructive" className="text-xs">
                                <Lock className="w-3 h-3 mr-1" />
                                已锁定
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(user.created_at).toLocaleDateString('zh-CN')}
                        </TableCell>
                        <TableCell className="text-sm">
                          {user.last_login ? new Date(user.last_login).toLocaleDateString('zh-CN') : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                confirm({
                                  title: '删除用户',
                                  description: `确定要删除用户 "${user.username}" 吗？此操作无法撤销。`,
                                  variant: 'destructive',
                                  confirmText: '删除',
                                  onConfirm: () => handleDeleteUser(user.id)
                                });
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 分页 */}
              {userTotal > userPageSize && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    共 {userTotal} 个用户
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={userCurrentPage === 1}
                    >
                      上一页
                    </Button>
                    <span className="text-sm">
                      第 {userCurrentPage} 页，共 {Math.ceil(userTotal / userPageSize)} 页
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserCurrentPage(prev => Math.min(prev + 1, Math.ceil(userTotal / userPageSize)))}
                      disabled={userCurrentPage === Math.ceil(userTotal / userPageSize)}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
              
              {users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  没有找到匹配的用户
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-6">
          <LinkManagement />
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总工作流数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workflows.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总点赞数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {workflows.reduce((sum, w) => sum + w.like_count, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总使用量</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {workflows.reduce((sum, w) => sum + w.usage_count, 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


      </Tabs>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white scrollbar-custom">
          <DialogHeader>
            <DialogTitle>编辑工作流</DialogTitle>
            <DialogDescription>
              修改工作流信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">标题</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="工作流标题"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">分类</Label>
                <Select value={formData.category_id} onValueChange={(value: string) => setFormData({ ...formData, category_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {categories.filter(category => category.id !== 'all').map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">工作流描述</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="工作流的描述，将展示在前端的工作流卡片上"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-author">作者</Label>
                <Select value={formData.author_id} onValueChange={(value: string) => setFormData({ ...formData, author_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择作者" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {authors.map((author) => (
                      <SelectItem key={author.id} value={author.id.toString()}>
                        {author.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-json-source">JSON源码</Label>
                <Textarea
                  id="edit-json-source"
                  value={formData.json_source}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, json_source: e.target.value })}
                  placeholder="请粘贴工作流的JSON源码"
                  rows={4}
                />
              </div>
            </div>

            {/* 登录跳转短链生成相关字段 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-source-type">来源类型</Label>
                <Select value={formData.source_type} onValueChange={(value) => setFormData({ ...formData, source_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择来源类型" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {sourceTypes.map((sourceType: any) => (
                      <SelectItem key={sourceType.id} value={sourceType.name}>
                        {sourceType.name} ({sourceType.name_en})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-platform">媒体平台</Label>
                <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择媒体平台" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {platforms.map((platform: any) => (
                      <SelectItem key={platform.id} value={platform.name}>
                        {platform.name} ({platform.abbreviation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-thumbnail-url">工作流Logo</Label>
              <div className="space-y-3">
                {/* 文件上传 */}
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                    id="edit-logo-upload"
                  />
                  <label
                    htmlFor="edit-logo-upload"
                    className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      uploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploading ? '上传中...' : '选择图片'}
                  </label>
                  <span className="text-sm text-gray-500">支持 JPG、PNG、GIF，最大5MB</span>
                </div>
                
                {/* 图片预览 */}
                {(previewImage || formData.thumbnail_image_id) && (
                  <div className="mt-2 relative inline-block">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Logo预览"
                        className="w-20 h-20 object-cover rounded border"
                      />
                    ) : (
                      <Image
                         src={`/api/images/${formData.thumbnail_image_id}`}
                         alt="Logo预览"
                         width={80}
                         height={80}
                         className="w-20 h-20 object-contain rounded border"
                         style={{
                           imageRendering: 'auto'
                         } as React.CSSProperties}
                         unoptimized
                         onError={(e) => {
                           (e.target as HTMLImageElement).src = '/placeholder.svg';
                         }}
                       />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (previewImage) {
                          setPreviewImage(null);
                        } else {
                          handleDeleteImage(formData.thumbnail_image_id);
                        }
                      }}
                      className="absolute -top-2 -right-2 bg-black text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
                      title="删除图片"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-demo-url">登录跳转短链</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-demo-url"
                  value={formData.demo_url}
                  onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
                  placeholder="登录跳转短链（可选）"
                />
                <Button
                  type="button"
                  onClick={generateDemoUrl}
                  disabled={generatingDemoUrl || !formData.title || !formData.json_source || !formData.source_type || !formData.platform}
                  className="bg-blue-500 text-white hover:bg-blue-600 whitespace-nowrap"
                >
                  {generatingDemoUrl ? '生成中...' : '生成链接'}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-no-login-url">免登录窗口链接</Label>
              <Input
                id="edit-no-login-url"
                value={formData.no_login_url}
                onChange={(e) => setFormData({ ...formData, no_login_url: e.target.value })}
                placeholder="免登录窗口链接（可选）"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                />
                <span>VIP</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                />
                <span>发布</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              取消
            </Button>
            <Button 
              onClick={handleUpdate}
              className="bg-black text-white hover:bg-gray-800"
            >
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 创建用户对话框 */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={(open) => {
        setIsCreateUserDialogOpen(open);
        if (!open) {
          setEmailError(''); // 关闭对话框时清除邮箱错误状态
        }
      }}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>创建新用户</DialogTitle>
            <DialogDescription>
              添加一个新的系统用户
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="user-username">用户名</Label>
              <Input
                id="user-username"
                value={userFormData.username}
                onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                placeholder="请输入用户名"
              />
            </div>
            <div>
              <Label htmlFor="user-email">邮箱</Label>
              <Input
                id="user-email"
                type="email"
                value={userFormData.email}
                onChange={(e) => {
                  const email = e.target.value;
                  setUserFormData({ ...userFormData, email });
                  // 实时验证邮箱格式
                  const error = validateEmail(email);
                  setEmailError(error);
                }}
                placeholder="请输入邮箱地址"
                className={emailError ? 'border-red-500 focus:border-red-500' : ''}
              />
              {emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
              )}
            </div>
            <div>
              <Label htmlFor="user-password">密码</Label>
              <Input
                id="user-password"
                type="password"
                value={userFormData.password}
                onChange={(e) => {
                  const password = e.target.value;
                  setUserFormData({ ...userFormData, password });
                  // 实时验证密码长度
                  const error = validatePassword(password);
                  setPasswordError(error);
                }}
                placeholder="请输入密码（至少6个字符）"
                className={passwordError ? 'border-red-500 focus:border-red-500' : ''}
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>
            <div>
              <Label htmlFor="user-role">角色</Label>
              <Select value={userFormData.role} onValueChange={(value: 'admin' | 'user') => setUserFormData({ ...userFormData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择用户角色" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="user">普通用户</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="user-active"
                checked={userFormData.is_active}
                onChange={(e) => setUserFormData({ ...userFormData, is_active: e.target.checked })}
              />
              <Label htmlFor="user-active">激活用户</Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateUserDialogOpen(false);
                setEmailError('');
                setPasswordError('');
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              取消
            </Button>
            <Button 
              onClick={handleCreateUser}
              className="bg-black text-white hover:bg-gray-800"
            >
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑用户对话框 */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={(open) => {
        setIsEditUserDialogOpen(open);
        if (!open) {
          setEmailError(''); // 关闭对话框时清除邮箱错误状态
        }
      }}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>
              修改用户信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit-user-username">用户名</Label>
              <Input
                id="edit-user-username"
                value={userFormData.username}
                onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                placeholder="请输入用户名"
              />
            </div>
            <div>
              <Label htmlFor="edit-user-email">邮箱</Label>
              <Input
                id="edit-user-email"
                type="email"
                value={userFormData.email}
                onChange={(e) => {
                  const email = e.target.value;
                  setUserFormData({ ...userFormData, email });
                  // 实时验证邮箱格式
                  const error = validateEmail(email);
                  setEmailError(error);
                }}
                placeholder="请输入邮箱地址"
                className={emailError ? 'border-red-500 focus:border-red-500' : ''}
              />
              {emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-user-password">密码</Label>
              <Input
                id="edit-user-password"
                type="password"
                value={userFormData.password}
                onChange={(e) => {
                  const password = e.target.value;
                  setUserFormData({ ...userFormData, password });
                  // 实时验证密码长度（仅在有输入时验证）
                  if (password.trim()) {
                    const error = validatePassword(password);
                    setPasswordError(error);
                  } else {
                    setPasswordError('');
                  }
                }}
                placeholder="留空则不修改密码（至少6个字符）"
                className={passwordError ? 'border-red-500 focus:border-red-500' : ''}
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-user-role">角色</Label>
              <Select value={userFormData.role} onValueChange={(value: 'admin' | 'user') => setUserFormData({ ...userFormData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择用户角色" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="user">普通用户</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-user-active"
                checked={userFormData.is_active}
                onChange={(e) => setUserFormData({ ...userFormData, is_active: e.target.checked })}
              />
              <Label htmlFor="edit-user-active">激活用户</Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditUserDialogOpen(false);
                setEmailError('');
                setPasswordError('');
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              取消
            </Button>
            <Button 
              onClick={handleUpdateUser}
              className="bg-black text-white hover:bg-gray-800"
            >
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 创建分类对话框 */}
      <Dialog open={isCreateCategoryDialogOpen} onOpenChange={setIsCreateCategoryDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>创建新分类</DialogTitle>
            <DialogDescription>
              添加一个新的工作流分类
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">

            <div>
              <Label htmlFor="category-name">分类名称</Label>
              <Input
                id="category-name"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                placeholder="例如: 数据分析"
              />
            </div>

            <div>
              <Label htmlFor="category-description">描述</Label>
              <Input
                id="category-description"
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                placeholder="分类描述（可选）"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateCategoryDialogOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              取消
            </Button>
            <Button 
              onClick={handleCreateCategory}
              className="bg-black text-white hover:bg-gray-800"
            >
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑分类对话框 */}
      <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>编辑分类</DialogTitle>
            <DialogDescription>
              修改分类信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">

            <div>
              <Label htmlFor="edit-category-name">分类名称</Label>
              <Input
                id="edit-category-name"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                placeholder="例如: 数据分析"
              />
            </div>

            <div>
              <Label htmlFor="edit-category-description">描述</Label>
              <Input
                id="edit-category-description"
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                placeholder="分类描述（可选）"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditCategoryDialogOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              取消
            </Button>
            <Button 
              onClick={handleUpdateCategory}
              className="bg-black text-white hover:bg-gray-800"
            >
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ConfirmDialog />
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthProvider>
      <AdminPageWithAuth />
    </AuthProvider>
  );
}

function AdminPageWithAuth() {
  const { isAuthenticated, user, login, loading } = useAuth();
  
  // 适配器函数，将login结果传递给AdminLogin组件
  const handleAdminLogin = async (credentials: { username: string; password: string }): Promise<{ success: boolean; message?: string }> => {
    const result = await login(credentials);
    return result;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Lock className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              管理员后台
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              正在验证身份信息...
            </p>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <div className="text-lg text-gray-600">加载中...</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleAdminLogin} />;
  }

  // 检查用户角色，只有管理员才能访问
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Lock className="mx-auto h-12 w-12 text-red-400" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              访问被拒绝
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              你不是管理员，无法访问此页面
            </p>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="text-lg text-red-600 font-medium">
                  权限不足
                </div>
                <p className="text-gray-600">
                  当前用户：{user?.username}<br/>
                  用户角色：{user?.role}<br/>
                  需要角色：管理员
                </p>
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                >
                  返回首页
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <AdminContent />;
}
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Plus, Edit, Trash2, Eye, Search, Filter, Heart, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Workflow {
  id: string;
  title: string;
  description: string;
  category_id: string;
  category_name: string;
  author_id: number;
  author_name: string;
  thumbnail_url: string;
  usage_count: number;
  like_count: number;
  view_count: number;
  demo_url?: string;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  tags: string[];
  json_source?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
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



const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api';

export default function AdminPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);

  const [loading, setLoading] = useState(true);
  const [workflowsLoading, setWorkflowsLoading] = useState(true);
  const [secondaryDataLoading, setSecondaryDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [activeTab, setActiveTab] = useState('workflows');
  const [uploading, setUploading] = useState(false);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalWorkflows, setTotalWorkflows] = useState(0);
  
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

  
  const [categoryFormData, setCategoryFormData] = useState({
    id: '',
    name: '',
    icon: 'Grid3X3',
    color: '#6b7280',
    description: '',
    sort_order: 0
  });

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    author_id: '',
    thumbnail_url: '',
    demo_url: '',
    is_featured: false,
    is_published: true,
    json_source: ''
  });

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
      setWorkflowsLoading(true);
      setSecondaryDataLoading(true);
      
      // 优先加载关键数据
      const workflowsRes = await fetch(`${API_BASE_URL}/workflows?limit=50`);
      const workflowsData = await workflowsRes.json();
      if (workflowsData.success) {
        setWorkflows(workflowsData.data);
        setWorkflowsLoading(false);
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
      setSecondaryDataLoading(false);
    } catch (error) {
      console.error('获取数据失败:', error);
      toast.error('获取数据失败');
    } finally {
      setLoading(false);
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
    if (!formData.thumbnail_url.trim()) {
      toast.error('请输入缩略图URL');
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
        toast.success('工作流创建成功');
        setIsCreateDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        toast.error(result.error || '创建失败');
      }
    } catch (error) {
      console.error('创建失败:', error);
      toast.error('创建失败');
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
    if (!formData.thumbnail_url.trim()) {
      toast.error('请输入缩略图URL');
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
        resetForm();
        fetchData();
      } else {
        toast.error(result.error || '更新失败');
      }
    } catch (error) {
      console.error('更新失败:', error);
      toast.error('更新失败');
    }
  };

  // 删除工作流
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个工作流吗？')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/workflows/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        toast.success('工作流删除成功');
        fetchData();
      } else {
        toast.error(result.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category_id: '',
      author_id: '',
      thumbnail_url: '',
      demo_url: '',
      is_featured: false,
      is_published: true,
      json_source: ''
    });
  };

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 检查文件大小（5MB限制）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('文件大小不能超过5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch(`${API_BASE_URL}/upload/logo`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        // 更新表单数据中的缩略图URL
        setFormData(prev => ({ ...prev, thumbnail_url: result.data.url }));
        toast.success('Logo上传成功');
      } else {
        toast.error(result.error || '上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      toast.error('上传失败');
    } finally {
      setUploading(false);
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
      thumbnail_url: workflow.thumbnail_url,
      demo_url: workflow.demo_url || '',
      is_featured: workflow.is_featured,
      is_published: workflow.is_published,
      json_source: workflow.json_source || ''
    });
    setIsEditDialogOpen(true);
  };



  // 分类管理函数
  const resetCategoryForm = () => {
    setCategoryFormData({
      id: '',
      name: '',
      icon: 'Grid3X3',
      color: '#6b7280',
      description: '',
      sort_order: 0
    });
  };

  // 创建分类
  const handleCreateCategory = async () => {
    // 表单验证
    if (!categoryFormData.id.trim()) {
      toast.error('请输入分类ID');
      return;
    }
    if (!categoryFormData.name.trim()) {
      toast.error('请输入分类名称');
      return;
    }
    if (!categoryFormData.icon.trim()) {
      toast.error('请输入分类图标');
      return;
    }
    if (!categoryFormData.color.trim()) {
      toast.error('请输入分类颜色');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryFormData),
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
    } catch (error) {
      console.error('创建分类失败:', error);
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
    if (!categoryFormData.icon.trim()) {
      toast.error('请输入分类图标');
      return;
    }
    if (!categoryFormData.color.trim()) {
      toast.error('请输入分类颜色');
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
    } catch (error) {
      console.error('更新分类失败:', error);
      toast.error('更新失败');
    }
  };

  // 删除分类
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('确定要删除这个分类吗？删除后相关的工作流将被移动到默认分类。')) return;

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
    } catch (error) {
      console.error('删除分类失败:', error);
      toast.error('删除失败');
    }
  };

  // 编辑分类
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      description: category.description || '',
      sort_order: category.sort_order || 0
    });
    setIsEditCategoryDialogOpen(true);
  };

  // 过滤工作流逻辑已移至useMemo优化版本

  // Difficulty functions removed

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">工作流管理后台</h1>
        <p className="text-gray-600">管理工作流卡片的增删改查操作</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="workflows">工作流管理</TabsTrigger>
          <TabsTrigger value="categories">分类管理</TabsTrigger>
          <TabsTrigger value="authors">作者管理</TabsTrigger>
          
          <TabsTrigger value="stats">统计信息</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          {/* 工具栏 */}
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
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有分类</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      新建工作流
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
                            <SelectContent>
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
                            <SelectContent>
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

                      <div>
                        <Label htmlFor="thumbnail_url">工作流Logo</Label>
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
                          
                          {/* URL输入框 */}
                          <Input
                            id="thumbnail_url"
                            value={formData.thumbnail_url}
                            onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                            placeholder="或直接输入图片链接"
                          />
                          
                          {/* 图片预览 */}
                          {formData.thumbnail_url && (
                            <div className="mt-2">
                              <img
                                src={formData.thumbnail_url}
                                alt="Logo预览"
                                className="w-20 h-20 object-cover rounded border"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="demo_url">演示URL</Label>
                        <Input
                          id="demo_url"
                          value={formData.demo_url}
                          onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
                          placeholder="演示链接（可选）"
                        />
                      </div>

                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.is_featured}
                            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                          />
                          <span>推荐</span>
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
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleCreate}>
                        创建
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
                            <img
                              src={workflow.thumbnail_url}
                              alt={workflow.title}
                              className="w-10 h-10 rounded object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
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
                            {workflow.is_published && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                已发布
                              </Badge>
                            )}
                            {workflow.is_featured && (
                              <Badge variant="outline" className="text-blue-600 border-blue-600">
                                推荐
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1"><Heart className="w-3 h-3" /> {workflow.like_count}</div>
                            <div className="flex items-center gap-1"><Users className="w-3 h-3" /> {workflow.usage_count}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/workflow/${workflow.id}`, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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
              <Button onClick={() => setIsCreateCategoryDialogOpen(true)}>
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
                      <TableHead>颜色</TableHead>
                      <TableHead>图标</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>工作流数量</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-sm text-gray-500">{category.color}</span>
                          </div>
                        </TableCell>
                        <TableCell>{category.icon}</TableCell>
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
                        <img
                          src={author.avatar_url || '/default-avatar.svg'}
                          alt={author.name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
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
                <CardTitle className="text-sm font-medium">总浏览量</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {workflows.reduce((sum, w) => sum + w.view_count, 0)}
                </div>
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
                  <SelectContent>
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
                  <SelectContent>
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
                
                {/* URL输入框 */}
                <Input
                  id="edit-thumbnail-url"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="或直接输入图片链接"
                />
                
                {/* 图片预览 */}
                {formData.thumbnail_url && (
                  <div className="mt-2">
                    <img
                      src={formData.thumbnail_url}
                      alt="Logo预览"
                      className="w-20 h-20 object-cover rounded border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-demo-url">演示URL</Label>
              <Input
                id="edit-demo-url"
                value={formData.demo_url}
                onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
                placeholder="演示链接（可选）"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                />
                <span>推荐</span>
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
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdate}>
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* 创建分类对话框 */}
      <Dialog open={isCreateCategoryDialogOpen} onOpenChange={setIsCreateCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新分类</DialogTitle>
            <DialogDescription>
              添加一个新的工作流分类
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="category-id">分类ID</Label>
              <Input
                id="category-id"
                value={categoryFormData.id}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, id: e.target.value })}
                placeholder="例如: data-analysis"
              />
            </div>
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
              <Label htmlFor="category-icon">图标</Label>
              <Input
                id="category-icon"
                value={categoryFormData.icon}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
                placeholder="例如: BarChart3"
              />
            </div>
            <div>
              <Label htmlFor="category-color">颜色</Label>
              <div className="flex space-x-2">
                <Input
                  id="category-color"
                  type="color"
                  value={categoryFormData.color}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={categoryFormData.color}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                  placeholder="#6b7280"
                  className="flex-1"
                />
              </div>
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
            <Button variant="outline" onClick={() => setIsCreateCategoryDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateCategory}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑分类对话框 */}
      <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑分类</DialogTitle>
            <DialogDescription>
              修改分类信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit-category-id">分类ID</Label>
              <Input
                id="edit-category-id"
                value={categoryFormData.id}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, id: e.target.value })}
                placeholder="例如: data-analysis"
                disabled
              />
            </div>
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
              <Label htmlFor="edit-category-icon">图标</Label>
              <Input
                id="edit-category-icon"
                value={categoryFormData.icon}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
                placeholder="例如: BarChart3"
              />
            </div>
            <div>
              <Label htmlFor="edit-category-color">颜色</Label>
              <div className="flex space-x-2">
                <Input
                  id="edit-category-color"
                  type="color"
                  value={categoryFormData.color}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={categoryFormData.color}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                  placeholder="#6b7280"
                  className="flex-1"
                />
              </div>
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
            <Button variant="outline" onClick={() => setIsEditCategoryDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateCategory}>
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
"use client";

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@radix-ui/react-label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, Filter, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';

// 定义链接信息的类型
type LinkInfo = {
    id: number;
    createdAt: string;
    sourceType: string;
    platform: string;
    projectCode: string;
    description: string;
    shortUrl: string;
    longUrl: string;
};

// 定义平台信息的类型
type PlatformInfo = {
    id: number;
    platform: string;
    abbreviation: string;
};

// 定义来源类型的类型
type SourceTypeInfo = {
    id: number;
    sourcetype: string;
    en: string;
};

interface Project {
    id: number;
    project_code: string;
    url: string;
}

// 定义筛选状态类型
type FilterState = {
    sourceType: string | null;
    platform: string | null;
    projectCode: string | null;
    description: string | null;
};

const LinkManagement: React.FC = () => {
    const [links, setLinks] = useState<LinkInfo[]>([]);
    const [platforms, setPlatforms] = useState<PlatformInfo[]>([]);
    const [sourceTypes, setSourceTypes] = useState<SourceTypeInfo[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [generatedLink, setGeneratedLink] = useState<string>('');

    // 表单状态
    const [sourceType, setSourceType] = useState<string>('');
    const [platform, setPlatform] = useState<string>('');
    const [selectedProject, setSelectedProject] = useState<string>('');

    // 模态框状态
    const [showAddPlatform, setShowAddPlatform] = useState<boolean>(false);
    const [showAddSourceType, setShowAddSourceType] = useState<boolean>(false);
    const [showAddProject, setShowAddProject] = useState<boolean>(false);

    // 添加平台表单
    const [newPlatform, setNewPlatform] = useState<string>('');
    const [newAbbreviation, setNewAbbreviation] = useState<string>('');
    const [addingPlatform, setAddingPlatform] = useState<boolean>(false);
    const [addPlatformError, setAddPlatformError] = useState<string>('');

    // 添加来源类型表单
    const [newSourceType, setNewSourceType] = useState<string>('');
    const [newSourceTypeEn, setNewSourceTypeEn] = useState<string>('');
    const [addingSourceType, setAddingSourceType] = useState<boolean>(false);
    const [addSourceTypeError, setAddSourceTypeError] = useState<string>('');

    // 添加项目表单
    const [newProjectCode, setNewProjectCode] = useState<string>('');
    const [newProjectUrl, setNewProjectUrl] = useState<string>('');
    const [newProjectWorkflow, setNewProjectWorkflow] = useState<string>('');
    const [addingProject, setAddingProject] = useState<boolean>(false);
    const [addProjectError, setAddProjectError] = useState<string>('');

    // 筛选相关状态
    const [filters, setFilters] = useState<FilterState>({
        sourceType: null,
        platform: null,
        projectCode: null,
        description: null
    });
    const [searchTerm, setSearchTerm] = useState<string>('');

    // 获取数据
    useEffect(() => {
        fetchPlatforms();
        fetchSourceTypes();
        fetchProjects();
        fetchLinks();
    }, []);

    // 获取链接列表
    const fetchLinks = async () => {
        try {
            setLoading(true);
            const response = await axios.get<LinkInfo[]>('/api/linkmanagelists');
            setLinks(response.data);
            setError('');
        } catch (error) {
            console.error('获取链接失败:', error);
            setError('获取链接失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    // 获取平台列表
    const fetchPlatforms = async () => {
        try {
            const response = await axios.get('/api/platforms');
            if (response.data.success && response.data.platforms) {
                // 转换数据格式以匹配PlatformInfo接口
                const platforms = response.data.platforms.map((item: any) => ({
                    id: item.id,
                    platform: item.name || item.platform,
                    abbreviation: item.abbreviation
                }));
                setPlatforms(platforms);
            }
        } catch (error) {
            console.error('获取平台列表失败:', error);
        }
    };

    // 获取来源类型列表
    const fetchSourceTypes = async () => {
        try {
            const response = await axios.get('/api/sourcetypes');
            if (response.data.success && response.data.sourceTypes) {
                // 转换数据格式以匹配SourceTypeInfo接口
                const sourceTypes = response.data.sourceTypes.map((item: any) => ({
                    id: item.id,
                    sourcetype: item.name || item.sourcetype,
                    en: item.name_en || item.en
                }));
                setSourceTypes(sourceTypes);
            }
        } catch (error) {
            console.error('获取来源类型列表失败:', error);
        }
    };

    // 获取项目列表
    const fetchProjects = async () => {
        try {
            const response = await axios.get('/api/projects');
            if (response.data.success && response.data.projects) {
                setProjects(response.data.projects);
            }
        } catch (error) {
            console.error('获取项目列表失败:', error);
        }
    };

    // 删除平台
    const deletePlatform = async (platformId: number) => {
        if (!confirm('确定要删除这个平台吗？')) return;
        
        try {
            const response = await axios.delete('/api/platforms', {
                data: { id: platformId }
            });
            
            if (response.data.success) {
                toast.success('平台删除成功');
                fetchPlatforms(); // 重新获取平台列表
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || '删除平台失败';
            toast.error(errorMessage);
        }
    };

    // 删除来源类型
    const deleteSourceType = async (sourceTypeId: number) => {
        if (!confirm('确定要删除这个来源类型吗？')) return;
        
        try {
            const response = await axios.delete('/api/sourcetypes', {
                data: { id: sourceTypeId }
            });
            
            if (response.data.success) {
                toast.success('来源类型删除成功');
                fetchSourceTypes(); // 重新获取来源类型列表
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || '删除来源类型失败';
            toast.error(errorMessage);
        }
    };

    // 删除项目
    const deleteProject = async (projectId: number) => {
        if (!confirm('确定要删除这个项目吗？')) return;
        
        try {
            const response = await axios.delete('/api/projects', {
                data: { id: projectId }
            });
            
            if (response.data.success) {
                toast.success('项目删除成功');
                fetchProjects(); // 重新获取项目列表
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || '删除项目失败';
            toast.error(errorMessage);
        }
    };

    // 生成链接
    const handleGenerate = async () => {
        if (!sourceType || !platform || !selectedProject) {
            setError('请选择来源类型、发布平台和项目代号');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const response = await axios.post('/api/generate', {
                sourceType,
                platform,
                projectCode: selectedProject
            });
            
            setGeneratedLink(response.data.shortUrl);
            setSuccessMessage('链接生成成功！');
            
            // 刷新链接列表
            fetchLinks();
            
            // 重置表单
            setSourceType('');
            setPlatform('');
            setSelectedProject('');
        } catch (error: any) {
            console.error('生成链接失败:', error);
            setError(error.response?.data?.error || '生成链接失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    // 添加平台
    const handleAddPlatform = async () => {
        if (!newPlatform.trim() || !newAbbreviation.trim()) {
            setAddPlatformError('平台名称和缩写不能为空');
            return;
        }

        try {
            setAddingPlatform(true);
            setAddPlatformError('');
            
            const response = await axios.post<PlatformInfo>('/api/platforms', {
                platform: newPlatform,
                abbreviation: newAbbreviation
            });
            
            setPlatforms(prev => [...prev, response.data]);
            setNewPlatform('');
            setNewAbbreviation('');
            setShowAddPlatform(false);
            toast.success('平台添加成功');
        } catch (error: any) {
            console.error('添加平台失败:', error);
            setAddPlatformError(error.response?.data?.error || '添加平台失败，请稍后重试');
        } finally {
            setAddingPlatform(false);
        }
    };

    // 添加来源类型
    const handleAddSourceType = async () => {
        if (!newSourceType.trim() || !newSourceTypeEn.trim()) {
            setAddSourceTypeError('类型名称和英文不能为空');
            return;
        }

        try {
            setAddingSourceType(true);
            setAddSourceTypeError('');
            
            const response = await axios.post<SourceTypeInfo>('/api/sourcetypes', {
                sourcetype: newSourceType,
                en: newSourceTypeEn
            });
            
            setSourceTypes(prev => [...prev, response.data]);
            setNewSourceType('');
            setNewSourceTypeEn('');
            setShowAddSourceType(false);
            toast.success('来源类型添加成功');
        } catch (error: any) {
            console.error('添加来源类型失败:', error);
            setAddSourceTypeError(error.response?.data?.error || '添加来源类型失败，请稍后重试');
        } finally {
            setAddingSourceType(false);
        }
    };

    // 添加项目
    const handleAddProject = async () => {
        if (!newProjectCode.trim()) {
            setAddProjectError('工作流名称不能为空');
            return;
        }

        // 验证JSON格式（如果有输入）
        if (newProjectWorkflow.trim()) {
            try {
                JSON.parse(newProjectWorkflow);
            } catch (error) {
                setAddProjectError('Workflow数据格式不正确，请输入有效的JSON格式');
                return;
            }
        }

        try {
            setAddingProject(true);
            setAddProjectError('');
            
            const requestData: any = {
                projectCode: newProjectCode,
                projectDescription: newProjectUrl
            };
            
            // 只有当workflow有内容时才添加到请求中
            if (newProjectWorkflow.trim()) {
                requestData.workflow = newProjectWorkflow.trim();
            }
            
            const response = await axios.post<Project>('/api/projects', requestData);
            
            // 刷新项目列表
            await fetchProjects();
            setNewProjectCode('');
            setNewProjectUrl('');
            setNewProjectWorkflow('');
            setShowAddProject(false);
            toast.success('项目添加成功');
        } catch (error: any) {
            console.error('添加项目失败:', error);
            setAddProjectError(error.response?.data?.message || '添加项目失败，请稍后重试');
        } finally {
            setAddingProject(false);
        }
    };

    // 复制链接
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success('链接已复制到剪贴板');
        }).catch(() => {
            toast.error('复制失败');
        });
    };

    // 删除链接
    const handleDeleteLink = async (linkId: number) => {
        if (!confirm('确定要删除这个链接吗？此操作不可撤销。')) {
            return;
        }

        try {
            const response = await axios.delete(`/api/linkmanagelists/${linkId}`);
            
            if (response.data.success) {
                toast.success('链接删除成功');
                // 刷新链接列表
                fetchLinks();
            } else {
                toast.error(response.data.error || '删除失败');
            }
        } catch (error: any) {
            console.error('删除链接失败:', error);
            toast.error(error.response?.data?.error || '删除链接失败，请稍后重试');
        }
    };

    // 过滤链接
    const filteredLinks = links.filter(link => {
        const matchesSearch = searchTerm === '' || 
            link.shortUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
            link.longUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
            link.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            link.sourceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            link.platform.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* 链接生成器 */}
            <Card>
                <CardHeader>
                    <CardTitle>FastGPT 营销链接生成器</CardTitle>
                    <CardDescription>生成带有UTM参数的营销链接</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* 来源类型 */}
                        <div>
                            <Label className="block mb-2">来源类型</Label>
                            <div className="flex gap-2">
                                <Select value={sourceType} onValueChange={setSourceType} disabled={loading}>
                                    <SelectTrigger className="flex-grow">
                                        <SelectValue placeholder="选择来源类型" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sourceTypes.map(st => (
                                            <div key={st.id} className="flex items-center justify-between px-2 py-1 hover:bg-gray-100">
                                                <SelectItem value={st.sourcetype} className="flex-grow border-0 p-0">
                                                    {st.sourcetype} ({st.en})
                                                </SelectItem>
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteSourceType(st.id);
                                                    }}
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={() => setShowAddSourceType(true)}
                                    className="bg-green-500 text-white hover:bg-green-600"
                                    size="sm"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* 发布平台 */}
                        <div>
                            <Label className="block mb-2">发布平台</Label>
                            <div className="flex gap-2">
                                <Select value={platform} onValueChange={setPlatform} disabled={loading}>
                                    <SelectTrigger className="flex-grow">
                                        <SelectValue placeholder="选择发布平台" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {platforms.map(p => (
                                            <div key={p.id} className="flex items-center justify-between px-2 py-1 hover:bg-gray-100">
                                                <SelectItem value={p.platform} className="flex-grow border-0 p-0">
                                                    {p.platform} ({p.abbreviation})
                                                </SelectItem>
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deletePlatform(p.id);
                                                    }}
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={() => setShowAddPlatform(true)}
                                    className="bg-green-500 text-white hover:bg-green-600"
                                    size="sm"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* 工作流详情 */}
                         <div>
                             <Label className="block mb-2">工作流详情</Label>
                             <div className="flex gap-2">
                                 <Select value={selectedProject} onValueChange={setSelectedProject} disabled={loading}>
                                     <SelectTrigger className="flex-grow">
                                         <SelectValue placeholder="选择工作流详情" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map(project => (
                                            <div key={project.id} className="flex items-center justify-between px-2 py-1 hover:bg-gray-100">
                                                <SelectItem value={project.project_code} className="flex-grow border-0 p-0">
                                                    {project.project_code}
                                                </SelectItem>
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteProject(project.id);
                                                    }}
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={() => setShowAddProject(true)}
                                    className="bg-green-500 text-white hover:bg-green-600"
                                    size="sm"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleGenerate}
                        className="bg-blue-500 text-white hover:bg-blue-600"
                        disabled={loading}
                    >
                        {loading ? '处理中...' : '生成链接'}
                    </Button>
                    
                    {successMessage && generatedLink && (
                        <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                            <div className="flex justify-between items-center">
                                <p>{successMessage}</p>
                                <button 
                                    onClick={() => setSuccessMessage('')}
                                    className="text-green-700"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <span>生成的短链接:</span>
                                <a 
                                    href={generatedLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blue-500 hover:underline"
                                >
                                    {generatedLink}
                                </a>
                                <Button
                                    onClick={() => copyToClipboard(generatedLink)}
                                    size="sm"
                                    variant="outline"
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 链接管理列表 */}
            <Card>
                <CardHeader>
                    <CardTitle>链接管理</CardTitle>
                    <CardDescription>查看和管理已生成的链接</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* 搜索框 */}
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="搜索链接..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* 链接列表 */}
                    <div className="rounded-md border overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[120px]">创建时间</TableHead>
                                        <TableHead className="min-w-[80px] whitespace-nowrap">来源类型</TableHead>
                                        <TableHead className="min-w-[80px]">平台</TableHead>
                                        <TableHead className="min-w-[100px]">项目代号</TableHead>
                                        <TableHead className="min-w-[200px]">短链接</TableHead>
                                        <TableHead className="min-w-[150px] max-w-[300px]">长链接</TableHead>
                                        <TableHead className="min-w-[120px]">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                            <TableBody>
                                {filteredLinks.map((link) => (
                                    <TableRow key={link.id}>
                                        <TableCell className="text-sm">
                                            {new Date(link.createdAt).toLocaleDateString('zh-CN', {
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <Badge variant="outline" className="text-xs">{link.sourceType}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">{link.platform}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">{link.projectCode}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 min-w-0">
                                                <a 
                                                    href={link.shortUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 hover:underline text-sm whitespace-nowrap"
                                                    title={link.shortUrl}
                                                >
                                                    {link.shortUrl}
                                                </a>
                                                <Button
                                                    onClick={() => copyToClipboard(link.shortUrl)}
                                                    size="sm"
                                                    variant="ghost"
                                                    className="flex-shrink-0 h-6 w-6 p-0"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[300px]">
                                            <div className="flex items-center gap-1 min-w-0">
                                                <a 
                                                    href={link.longUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 hover:underline text-sm truncate"
                                                    title={link.longUrl}
                                                >
                                                    {link.longUrl}
                                                </a>
                                                <Button
                                                    onClick={() => copyToClipboard(link.longUrl)}
                                                    size="sm"
                                                    variant="ghost"
                                                    className="flex-shrink-0 h-6 w-6 p-0"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    onClick={() => window.open(link.shortUrl, '_blank')}
                                                    size="sm"
                                                    variant="outline"
                                                    title="访问链接"
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    onClick={() => handleDeleteLink(link.id)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    title="删除链接"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                        
                        {filteredLinks.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                没有找到匹配的链接
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 添加平台对话框 */}
            <Dialog open={showAddPlatform} onOpenChange={setShowAddPlatform}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>添加新平台</DialogTitle>
                        <DialogDescription>添加一个新的发布平台</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="platform-name">平台名称</Label>
                            <Input
                                id="platform-name"
                                value={newPlatform}
                                onChange={(e) => setNewPlatform(e.target.value)}
                                placeholder="例如：微信公众号"
                            />
                        </div>
                        <div>
                            <Label htmlFor="platform-abbreviation">平台缩写</Label>
                            <Input
                                id="platform-abbreviation"
                                value={newAbbreviation}
                                onChange={(e) => setNewAbbreviation(e.target.value)}
                                placeholder="例如：wechat"
                            />
                        </div>
                        {addPlatformError && (
                            <div className="text-red-500 text-sm">{addPlatformError}</div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddPlatform(false)}>
                            取消
                        </Button>
                        <Button onClick={handleAddPlatform} disabled={addingPlatform}>
                            {addingPlatform ? '添加中...' : '添加'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 添加来源类型对话框 */}
            <Dialog open={showAddSourceType} onOpenChange={setShowAddSourceType}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>添加新来源类型</DialogTitle>
                        <DialogDescription>添加一个新的来源类型</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="sourcetype-name">类型名称</Label>
                            <Input
                                id="sourcetype-name"
                                value={newSourceType}
                                onChange={(e) => setNewSourceType(e.target.value)}
                                placeholder="例如：社交媒体"
                            />
                        </div>
                        <div>
                            <Label htmlFor="sourcetype-en">英文名称</Label>
                            <Input
                                id="sourcetype-en"
                                value={newSourceTypeEn}
                                onChange={(e) => setNewSourceTypeEn(e.target.value)}
                                placeholder="例如：social_media"
                            />
                        </div>
                        {addSourceTypeError && (
                            <div className="text-red-500 text-sm">{addSourceTypeError}</div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddSourceType(false)}>
                            取消
                        </Button>
                        <Button onClick={handleAddSourceType} disabled={addingSourceType}>
                            {addingSourceType ? '添加中...' : '添加'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 添加项目对话框 */}
            <Dialog open={showAddProject} onOpenChange={setShowAddProject}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>添加新工作流</DialogTitle>
                        <DialogDescription>添加一个新的工作流详情</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="project-code">工作流名称</Label>
                            <Input
                                id="project-code"
                                value={newProjectCode}
                                onChange={(e) => setNewProjectCode(e.target.value)}
                                placeholder="例如：fastgpt-demo"
                            />
                        </div>
                        <div>
                            <Label htmlFor="project-url">工作流描述</Label>
                            <Input
                                id="project-url"
                                value={newProjectUrl}
                                onChange={(e) => setNewProjectUrl(e.target.value)}
                                placeholder="例如：https://fastgpt.in/app/detail?appId=xxx"
                            />
                        </div>
                        <div>
                            <Label htmlFor="project-workflow">Workflow数据 (JSON格式)</Label>
                            <textarea
                                id="project-workflow"
                                value={newProjectWorkflow}
                                onChange={(e) => setNewProjectWorkflow(e.target.value)}
                                placeholder="请输入有效的JSON数据，将用于存储工作流程配置。如不需要可留空。"
                                className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md resize-vertical"
                            />
                        </div>
                        {addProjectError && (
                            <div className="text-red-500 text-sm">{addProjectError}</div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddProject(false)}>
                            取消
                        </Button>
                        <Button onClick={handleAddProject} disabled={addingProject}>
                            {addingProject ? '添加中...' : '添加'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LinkManagement;
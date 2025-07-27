// 统一的配置管理

/**
 * 获取API基础URL
 * 优先级：环境变量 > 生产环境默认值 > 开发环境默认值
 */
export function getApiBaseUrl(): string {
  // 如果设置了NEXT_PUBLIC_API_URL环境变量，直接使用
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 生产环境使用相对路径
  if (process.env.NODE_ENV === 'production') {
    return '';
  }
  
  // 开发环境默认值
  return 'http://localhost:3002';
}

/**
 * 获取完整的API URL（包含/api路径）
 */
export function getApiUrl(): string {
  const baseUrl = getApiBaseUrl();
  return baseUrl ? `${baseUrl}/api` : '/api';
}

/**
 * 应用配置
 */
export const appConfig = {
  // API配置
  api: {
    baseUrl: getApiBaseUrl(),
    url: getApiUrl(),
    timeout: parseInt(process.env.API_TIMEOUT || '10000'),
  },
  
  // 前端配置
  frontend: {
    port: parseInt(process.env.FRONTEND_PORT || '3000'),
  },
  
  // 文件上传配置
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880'), // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
  
  // 分页配置
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  
  // 缓存配置
  cache: {
    ttl: 5 * 60 * 1000, // 5分钟
  },
  
  // 健康检查配置
  healthCheck: {
    interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
  },
  
  // 数据查询限制
  query: {
    limit: parseInt(process.env.DATA_QUERY_LIMIT || '3000'),
  },
};

/**
 * 环境检查
 */
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

/**
 * 调试模式
 */
export const isDebugMode = isDevelopment || process.env.DEBUG === 'true';

/**
 * 获取环境变量（带默认值）
 */
export function getEnvVar(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

/**
 * 获取数字类型的环境变量
 */
export function getEnvNumber(key: string, defaultValue: number = 0): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

/**
 * 获取布尔类型的环境变量
 */
export function getEnvBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}
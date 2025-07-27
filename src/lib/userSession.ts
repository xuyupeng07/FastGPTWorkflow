// 用户会话管理工具

/**
 * 生成用户会话ID
 * 结合时间戳、随机数和简单的设备指纹
 */
export function generateUserSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  const deviceInfo = getDeviceFingerprint();
  
  return `${timestamp}-${random}-${deviceInfo}`;
}

/**
 * 获取简单的设备指纹
 */
function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }
  
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('fingerprint', 10, 10);
    const canvasFingerprint = canvas.toDataURL().slice(-10);
    
    const fingerprint = [
      navigator.userAgent.slice(-10),
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.language,
      canvasFingerprint
    ].join('|');
    
    // 简单哈希
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    return Math.abs(hash).toString(36).substring(0, 8);
  } catch {
    // 如果获取设备指纹失败，返回固定字符串
    return 'fallback';
  }
}

/**
 * 获取或创建用户会话ID
 */
export function getUserSessionId(): string {
  if (typeof window === 'undefined') {
    return ''; // 服务端渲染时返回空字符串
  }
  
  try {
    const storageKey = 'fastgpt_user_session_id';
    let sessionId = localStorage.getItem(storageKey);
    
    if (!sessionId) {
      sessionId = generateUserSessionId();
      localStorage.setItem(storageKey, sessionId);
    }
    
    return sessionId;
  } catch {
    // 如果localStorage不可用，返回空字符串而不是生成临时ID
    console.warn('localStorage不可用，返回空会话ID');
    return '';
  }
}

/**
 * 清除用户会话ID（用于测试或重置）
 */
export function clearUserSessionId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('fastgpt_user_session_id');
  }
}

/**
 * 验证会话ID格式
 */
export function isValidSessionId(sessionId: string): boolean {
  if (!sessionId) return false;
  
  // 检查格式：timestamp-random-deviceInfo
  const parts = sessionId.split('-');
  return parts.length === 3 && parts.every(part => part.length > 0);
}
import { useState } from 'react';
import useSWR from 'swr';

interface ImageUploadOptions {
  entityType: 'workflow' | 'author' | 'category';
  entityId: string;
  usageType?: string;
  isPrimary?: boolean;
  onSuccess?: (imageId: string) => void;
  onError?: (error: string) => void;
}

interface ImageUploadState {
  isUploading: boolean;
  progress: number;
  imageId: string | null;
  error: string | null;
}

export function useImageUpload(options: ImageUploadOptions) {
  const [state, setState] = useState<ImageUploadState>({
    isUploading: false,
    progress: 0,
    imageId: null,
    error: null
  });

  const uploadImage = async (file: File) => {
    if (!file) return;

    setState(prev => ({ ...prev, isUploading: true, error: null, progress: 0 }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', options.entityType);
      formData.append('entityId', options.entityId);
      formData.append('usageType', options.usageType || 'main');
      formData.append('isPrimary', String(options.isPrimary || false));

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '上传失败');
      }

      setState(prev => ({ ...prev, imageId: result.imageId, isUploading: false }));
      options.onSuccess?.(result.imageId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传失败';
      setState(prev => ({ ...prev, error: errorMessage, isUploading: false }));
      options.onError?.(errorMessage);
    }
  };

  const reset = () => {
    setState({
      isUploading: false,
      progress: 0,
      imageId: null,
      error: null
    });
  };

  return {
    ...state,
    uploadImage,
    reset
  };
}

// 获取图片URL的Hook
export function useImageUrl(imageId: string | null, variant?: string) {
  if (!imageId) return null;
  
  const url = `/api/images/${imageId}`;
  return variant && variant !== 'original' ? `${url}?variant=${variant}` : url;
}

// 获取实体图片的Hook
export function useEntityImages(entityType: string, entityId: string) {
  const { data, error, isLoading } = useSWR(
    entityId ? `/api/images/entity/${entityType}/${entityId}` : null,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('获取图片失败');
      }
      return response.json();
    }
  );

  return {
    images: data || [],
    isLoading,
    error
  };
}
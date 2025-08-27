import { PoolClient } from 'pg';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { pool } from './db';

// 图片存储类
class ImageStorage {
  async getClient(): Promise<PoolClient> {
    return pool.connect();
  }

  // 存储图片
  async storeImage(file: File, entityType: string, entityId: string, usageType: string = 'main', isPrimary: boolean = false): Promise<string> {
    const client = await this.getClient();
    
    try {
      const imageId = randomUUID();
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // 获取图片信息
      const metadata = await sharp(buffer).metadata();
      
      // 从文件名提取文件扩展名
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      
      // 生成唯一的文件名（如果重复）
      let uniqueFileName = file.name;
      let counter = 1;
      while (true) {
        try {
          // 尝试存储原始图片
          await client.query(
            `INSERT INTO images (id, file_name, file_type, file_size, mime_type, width, height, image_data, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
            [
              imageId,
              uniqueFileName,
              fileExtension,
              file.size,
              file.type, // mime_type
              metadata.width,
              metadata.height,
              buffer
            ]
          );
          break; // 插入成功，退出循环
        } catch (error: any) {
          if (error.code === '23505' && error.constraint === 'idx_unique_filename_type') {
            // 文件名重复，生成新的文件名
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            const ext = file.name.split('.').pop();
            uniqueFileName = `${nameWithoutExt}_${counter}.${ext}`;
            counter++;
          } else {
            throw error; // 其他错误，重新抛出
          }
        }
      }

      // 创建图片与实体的关联
      await this.linkImageToEntity(imageId, entityType, entityId, { usageType, isPrimary });

      // 生成缩略图变体
      await this.generateVariants(imageId, buffer, file.type);

      return imageId;
    } finally {
      client.release();
    }
  }

  // 生成图片变体（缩略图等）
  async generateVariants(imageId: string, buffer: Buffer, mimeType: string): Promise<void> {
    const client = await this.getClient();
    
    try {
      const variants = [
        { name: 'thumbnail', width: 150, height: 150 },
        { name: 'small', width: 300, height: 300 },
        { name: 'medium', width: 600, height: 600 }
      ];

      for (const variant of variants) {
        try {
          let processedBuffer;
          
          if (mimeType === 'image/svg+xml') {
            // SVG文件不需要处理，直接存储
            processedBuffer = buffer;
          } else {
            // 处理其他格式的图片
            processedBuffer = await sharp(buffer)
              .resize(variant.width, variant.height, {
                fit: 'cover',
                position: 'center'
              })
              .jpeg({ quality: 85 })
              .toBuffer();
          }

          await client.query(
            `INSERT INTO image_variants (original_image_id, variant_type, width, height, quality, file_size, image_data)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              imageId,
              variant.name,
              variant.width,
              variant.height,
              85, // quality
              processedBuffer.length,
              processedBuffer
            ]
          );
        } catch (variantError) {
          console.warn(`生成变体 ${variant.name} 失败:`, variantError);
        }
      }
    } finally {
      client.release();
    }
  }

  // 获取图片
  async getImage(imageId: string): Promise<any> {
    const client = await this.getClient();
    
    try {
      const result = await client.query(
        'SELECT * FROM images WHERE id = $1',
        [imageId]
      );
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // 获取图片变体
  async getImageVariant(imageId: string, variantName: string): Promise<any> {
    const client = await this.getClient();
    
    try {
      const result = await client.query(
        'SELECT * FROM image_variants WHERE original_image_id = $1 AND variant_type = $2',
        [imageId, variantName]
      );
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // 获取实体的所有图片
  async getEntityImages(entityType: string, entityId: string): Promise<any[]> {
    const client = await this.getClient();
    
    try {
      const result = await client.query(
        `SELECT i.id, i.file_name, i.file_size, i.mime_type, i.width, i.height, i.created_at,
         iu.entity_type, iu.entity_id, iu.usage_type, iu.is_primary, iu.sort_order
         FROM images i
         INNER JOIN image_usages iu ON i.id = iu.image_id 
         WHERE iu.entity_type = $1 AND iu.entity_id = $2 
         ORDER BY iu.is_primary DESC, iu.sort_order ASC, i.created_at DESC`,
        [entityType, entityId]
      );
      
      return result.rows;
    } finally {
      client.release();
    }
  }

  // 删除图片
  async deleteImage(imageId: string): Promise<any> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      
      // 删除图片变体
      await client.query(
        'DELETE FROM image_variants WHERE original_image_id = $1',
        [imageId]
      );
      
      // 删除图片使用记录
      await client.query(
        'DELETE FROM image_usages WHERE image_id = $1',
        [imageId]
      );
      
      // 清除所有引用该图片的外键关系
      await client.query(
        'UPDATE workflows SET thumbnail_image_id = NULL WHERE thumbnail_image_id = $1',
        [imageId]
      );
      
      // 删除主图片
      const result = await client.query(
        'DELETE FROM images WHERE id = $1 RETURNING *',
        [imageId]
      );
      
      await client.query('COMMIT');
      
      return result.rows[0] || null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 取消图片与实体的关联
  async unlinkImage(imageId: string, entityType: string, entityId: string): Promise<any> {
    const client = await this.getClient();
    
    try {
      const result = await client.query(
        `DELETE FROM image_usages 
         WHERE image_id = $1 AND entity_type = $2 AND entity_id = $3 
         RETURNING *`,
        [imageId, entityType, entityId]
      );
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // 解绑图片与实体的关联（通过实体信息）
  async unlinkImageFromEntity(entityType: string, entityId: string, usageType: string = 'main'): Promise<any> {
    const client = await this.getClient();
    
    try {
      const result = await client.query(
        `DELETE FROM image_usages 
         WHERE entity_type = $1 AND entity_id = $2 AND usage_type = $3 
         RETURNING *`,
        [entityType, entityId, usageType]
      );
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // 保存图片到数据库
  async saveImage(buffer: Buffer, options: { fileName: string; mimeType: string; metadata?: any }): Promise<string> {
    const client = await this.getClient();
    
    try {
      // 获取图片信息
      let metadata: any = {};
      
      if (options.mimeType === 'image/svg+xml') {
        // SVG文件不使用sharp处理，设置默认值
        metadata = { width: null, height: null };
      } else {
        // 其他格式使用sharp获取元数据
        metadata = await sharp(buffer).metadata();
      }
      
      // 从文件名提取文件扩展名
      const fileExtension = options.fileName.split('.').pop()?.toLowerCase() || 'jpg';
      
      // 生成唯一的文件名（如果重复）
      let uniqueFileName = options.fileName;
      let counter = 1;
      let insertedId: string;
      
      while (true) {
        try {
          // 尝试插入图片，让数据库自动生成id
          const result = await client.query(
            `INSERT INTO images (file_name, file_type, file_size, mime_type, width, height, image_data, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
             RETURNING id`,
            [
              uniqueFileName,
              fileExtension,
              buffer.length,
              options.mimeType,
              metadata.width,
              metadata.height,
              buffer
            ]
          );
          
          insertedId = result.rows[0].id.toString();
          break; // 插入成功，退出循环
        } catch (error: any) {
          if (error.code === '23505' && error.constraint === 'idx_unique_filename_type') {
            // 文件名重复，生成新的文件名
            const nameWithoutExt = options.fileName.replace(/\.[^/.]+$/, '');
            const ext = options.fileName.split('.').pop();
            uniqueFileName = `${nameWithoutExt}_${counter}.${ext}`;
            counter++;
          } else {
            throw error; // 其他错误，重新抛出
          }
        }
      }

      return insertedId;
    } finally {
      client.release();
    }
  }

  // 关联图片到实体
  async linkImageToEntity(imageId: string, entityType: string, entityId: string, options: { usageType?: string; isPrimary?: boolean } = {}): Promise<void> {
    const client = await this.getClient();
    
    try {
      const { usageType = 'main', isPrimary = false } = options;
      
      // 如果设置为主图片，先取消其他图片的主图片状态
      if (isPrimary) {
        await client.query(
          `UPDATE image_usages SET is_primary = false 
           WHERE entity_type = $1 AND entity_id = $2 AND usage_type = $3`,
          [entityType, entityId, usageType]
        );
      }
      
      // 创建图片与实体的关联
      // 先尝试查找是否已存在相同的记录
      const existingUsage = await client.query(
        `SELECT id FROM image_usages 
         WHERE entity_type = $1 AND entity_id = $2 AND usage_type = $3 AND is_primary = $4`,
        [entityType, entityId, usageType, isPrimary]
      );
      
      if (existingUsage.rows.length > 0) {
        // 如果存在，则更新
        await client.query(
          `UPDATE image_usages 
           SET image_id = $1, sort_order = 0 
           WHERE entity_type = $2 AND entity_id = $3 AND usage_type = $4 AND is_primary = $5`,
          [imageId, entityType, entityId, usageType, isPrimary]
        );
      } else {
        // 如果不存在，则插入（让数据库自动生成id）
        await client.query(
          `INSERT INTO image_usages (image_id, entity_type, entity_id, usage_type, is_primary, sort_order)
           VALUES ($1, $2, $3, $4, $5, 0)`,
          [imageId, entityType, entityId, usageType, isPrimary]
        );
      }
    } finally {
      client.release();
    }
  }

  // 创建图片变体
  async createImageVariant(imageId: string, variantName: string, options: { width?: number; height?: number; quality?: number } = {}): Promise<void> {
    const client = await this.getClient();
    
    try {
      // 获取原始图片
      const imageResult = await client.query(
        'SELECT image_data, mime_type FROM images WHERE id = $1',
        [imageId]
      );
      
      if (imageResult.rows.length === 0) {
        throw new Error('原始图片不存在');
      }
      
      const { image_data, mime_type } = imageResult.rows[0];
      const { width = 200, height = 200, quality = 85 } = options;
      
      let variantBuffer: Buffer;
      
      if (mime_type === 'image/svg+xml') {
        // SVG文件不需要处理，直接使用原始数据
        variantBuffer = image_data;
      } else {
        // 生成变体图片
        variantBuffer = await sharp(image_data)
          .resize(width, height, { fit: 'cover' })
          .jpeg({ quality })
          .toBuffer();
      }
      
      // 存储变体 - 注意：由于当前表结构没有image_data字段，暂时存储到file_path字段
      // TODO: 需要更新数据库表结构以支持直接存储图片数据
      await client.query(
        `INSERT INTO image_variants (original_image_id, variant_type, width, height, quality, file_size, image_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (original_image_id, variant_type) 
         DO UPDATE SET width = $3, height = $4, quality = $5, file_size = $6, image_data = $7, created_at = CURRENT_TIMESTAMP`,
        [imageId, variantName, width, height, 85, variantBuffer.length, variantBuffer]
      );
      
      // 注意：由于表结构限制，变体图片数据暂时无法直接存储到数据库
      // 建议更新表结构添加image_data BYTEA字段来存储图片二进制数据
    } finally {
      client.release();
    }
  }

  // 更新图片信息
  async updateImage(imageId: string, updates: Record<string, any>): Promise<any> {
    const client = await this.getClient();
    
    try {
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const values = [imageId, ...Object.values(updates)];
      
      const result = await client.query(
        `UPDATE images SET ${setClause}, updated_at = NOW() 
         WHERE id = $1 RETURNING *`,
        values
      );
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // 获取图片统计信息
  async getImageStats(): Promise<any> {
    const client = await this.getClient();
    
    try {
      const result = await client.query(`
        SELECT 
          COUNT(*) as total_images,
          SUM(file_size) as total_size,
          AVG(file_size) as avg_size,
          COUNT(DISTINCT entity_type) as entity_types
        FROM images
      `);
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}

// 导出单例实例
export const imageStorage = new ImageStorage();
export default imageStorage;
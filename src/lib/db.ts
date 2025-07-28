import { Pool } from 'pg';

// 数据库连接配置
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/fastgpt_workflow';

// 创建数据库连接池（单例模式）
class DatabasePool {
  private static instance: Pool;
  
  public static getInstance(): Pool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new Pool({
        connectionString: DATABASE_URL,
        ssl: false,
        max: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
        query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
      });
      
      // 测试数据库连接
      DatabasePool.instance.connect().then(async client => {
        console.log('✅ 数据库连接池创建成功');
        client.release();
        
        // 确保数据库表结构完整性
        const { ensureSchemaIntegrity } = await import('./ensure-schema');
        await ensureSchemaIntegrity();
      }).catch(err => {
        console.error('❌ 数据库连接失败:', err);
      });
    }
    
    return DatabasePool.instance;
  }
}

// 导出数据库连接池实例
export const pool = DatabasePool.getInstance();

// 导出便捷的查询函数
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('执行查询', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('数据库查询错误:', error);
    throw error;
  }
}

// 导出事务处理函数
export async function withTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
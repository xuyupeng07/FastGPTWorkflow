import { Pool } from 'pg';

// 数据库连接配置 - 必须从环境变量读取
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// 数据库schema配置 - 必须从环境变量读取
const DB_SCHEMA = process.env.DB_SCHEMA;
if (!DB_SCHEMA) {
  throw new Error('DB_SCHEMA environment variable is required');
}
const FALLBACK_SCHEMA = process.env.DB_FALLBACK_SCHEMA;

// 构建search_path
const getSearchPath = () => {
  if (DB_SCHEMA === 'public') {
    return 'public';
  }
  // 如果没有设置FALLBACK_SCHEMA，只使用主schema
  if (!FALLBACK_SCHEMA) {
    return DB_SCHEMA;
  }
  return `${DB_SCHEMA}, ${FALLBACK_SCHEMA}`;
};

// 创建数据库连接池（单例模式）
class DatabasePool {
  private static instance: Pool;
  
  public static getInstance(): Pool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new Pool({
        connectionString: DATABASE_URL,
        ssl: false,
        max: parseInt(process.env.DB_MAX_CONNECTIONS!),
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT!),
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT!),
        query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT!),
      });
      
      const searchPath = getSearchPath();
      
      // 设置默认schema
      DatabasePool.instance.on('connect', async (client) => {
        try {
          await client.query(`SET search_path TO ${searchPath}`);
          console.log(`✅ 已设置数据库schema为: ${searchPath}`);
        } catch (err) {
          console.error('❌ 设置schema失败:', err);
        }
      });
      
      // 测试数据库连接
      DatabasePool.instance.connect().then(async client => {
        console.log('✅ 数据库连接池创建成功');
        // 设置search_path
        await client.query(`SET search_path TO ${searchPath}`);
        console.log(`✅ 已设置数据库schema为: ${searchPath}`);
        console.log(`📋 当前schema配置: DB_SCHEMA=${DB_SCHEMA}, FALLBACK_SCHEMA=${FALLBACK_SCHEMA || '(未设置)'}`);
        client.release();
        
        // 数据库表结构已清理，不需要额外的结构检查
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
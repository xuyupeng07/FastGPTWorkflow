import mysql from 'mysql2/promise';

// 声明全局变量类型
declare global {
  // eslint-disable-next-line no-var
  var mysqlPool: mysql.Pool | undefined;
}

// 获取数据库配置
const getDbConfig = () => {
  // 使用 MYSQL_DATABASE_URL 环境变量
  const databaseUrl = process.env.MYSQL_DATABASE_URL;
  if (databaseUrl) {
    console.log('使用 MYSQL_DATABASE_URL 连接数据库');
    return { uri: databaseUrl };
  } else {
    console.error('错误: 未找到 MYSQL_DATABASE_URL 环境变量');
    console.error('请在 .env.local 文件中配置 MYSQL_DATABASE_URL');
    throw new Error('MySQL数据库连接字符串未配置');
  }
};

// 获取数据库连接池
const getPool = (): mysql.Pool => {
  // 检查全局变量中是否已存在连接池
  if (!global.mysqlPool) {
    console.log('创建新的MySQL数据库连接池...');
    
    const config = getDbConfig();
    
    // 根据配置类型创建连接池
    if ('uri' in config && config.uri) {
      console.log(`使用连接字符串连接MySQL数据库...`);
      global.mysqlPool = mysql.createPool(config.uri);
    }
  }
  
  return global.mysqlPool!;
};

// 测试数据库连接
async function testConnection(): Promise<boolean> {
  try {
    const pool = getPool();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('MySQL数据库连接测试成功');
    return true;
  } catch (error) {
    console.error('MySQL数据库连接测试失败:', error);
    return false;
  }
}

const pool = getPool();

export async function mysqlQuery(sql: string, params: any[] = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('MySQL查询执行失败:', error);
    throw error;
  }
}

export { pool as mysqlPool, testConnection };
export default pool;
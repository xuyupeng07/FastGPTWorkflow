const { Pool } = require('pg');

// 连接到默认数据库以创建新数据库
const adminPool = new Pool({
  connectionString: 'postgresql://postgres:mjns8kr8@dbconn.sealoshzh.site:47291/postgres?directConnection=true',
  ssl: false
});

// 连接到源数据库
const sourcePool = new Pool({
  connectionString: 'postgresql://postgres:mjns8kr8@dbconn.sealoshzh.site:47291/?directConnection=true',
  ssl: false
});

async function createFastAgentDatabase() {
  let targetPool = null;
  
  try {
    console.log('=== 开始创建FastAgent数据库并复制publiccopy数据 ===');
    
    // 1. 创建FastAgent数据库
    console.log('\n1. 创建FastAgent数据库...');
    try {
      await adminPool.query('CREATE DATABASE "FastAgent"');
      console.log('✅ FastAgent数据库创建成功');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('⚠️ FastAgent数据库已存在，将先删除后重新创建');
        await adminPool.query('DROP DATABASE "FastAgent"');
        await adminPool.query('CREATE DATABASE "FastAgent"');
        console.log('✅ FastAgent数据库重新创建成功');
      } else {
        throw error;
      }
    }
    
    // 2. 连接到目标数据库
    targetPool = new Pool({
      connectionString: 'postgresql://postgres:mjns8kr8@dbconn.sealoshzh.site:47291/FastAgent?directConnection=true',
      ssl: false
    });
    
    // 3. 设置源数据库的搜索路径
    await sourcePool.query('SET search_path TO publiccopy, public');
    
    console.log('\n2. 获取publiccopy schema的所有表...');
    
    // 获取所有表名（排除备份表）
    const tablesResult = await sourcePool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'publiccopy' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE '%backup%'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`发现 ${tables.length} 个表:`, tables);
    
    // 4. 先复制序列
    console.log('\n3. 复制序列...');
    
    const sequencesResult = await sourcePool.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'publiccopy'
    `);
    
    for (const seqRow of sequencesResult.rows) {
      const seqName = seqRow.sequence_name;
      
      try {
        // 获取序列的详细信息
        const seqInfoResult = await sourcePool.query(`
          SELECT start_value, minimum_value, maximum_value, increment
          FROM information_schema.sequences 
          WHERE sequence_schema = 'publiccopy' AND sequence_name = $1
        `, [seqName]);
        
        const seqInfo = seqInfoResult.rows[0];
        
        // 在目标数据库中创建序列
        await targetPool.query(`
          CREATE SEQUENCE "${seqName}" 
          START WITH ${seqInfo.start_value}
          INCREMENT BY ${seqInfo.increment}
          MINVALUE ${seqInfo.minimum_value}
          MAXVALUE ${seqInfo.maximum_value}
        `);
        
        // 获取序列的当前值
        const seqValueResult = await sourcePool.query(`SELECT last_value FROM publiccopy.${seqName}`);
        const lastValue = seqValueResult.rows[0].last_value;
        
        // 设置序列的当前值
        await targetPool.query(`SELECT setval('"${seqName}"', ${lastValue})`);
        
        console.log(`✅ 序列复制完成: ${seqName} (当前值: ${lastValue})`);
      } catch (error) {
        console.log(`⚠️ 序列复制失败: ${seqName} - ${error.message}`);
      }
    }
    
    // 5. 复制表结构
    console.log('\n4. 复制表结构...');
    
    for (const tableName of tables) {
      console.log(`正在复制表结构: ${tableName}`);
      
      try {
        // 使用pg_dump风格的方法来获取完整的表定义
        const tableDefResult = await sourcePool.query(`
          SELECT 
            'CREATE TABLE "' || table_name || '" (' ||
            string_agg(
              '"' || column_name || '" ' || 
              CASE 
                WHEN data_type = 'character varying' THEN 'varchar' || COALESCE('(' || character_maximum_length || ')', '')
                WHEN data_type = 'character' THEN 'char' || COALESCE('(' || character_maximum_length || ')', '')
                WHEN data_type = 'numeric' THEN 'numeric' || COALESCE('(' || numeric_precision || ',' || numeric_scale || ')', '')
                WHEN data_type = 'integer' THEN 'integer'
                WHEN data_type = 'bigint' THEN 'bigint'
                WHEN data_type = 'smallint' THEN 'smallint'
                WHEN data_type = 'boolean' THEN 'boolean'
                WHEN data_type = 'text' THEN 'text'
                WHEN data_type = 'timestamp without time zone' THEN 'timestamp'
                WHEN data_type = 'timestamp with time zone' THEN 'timestamptz'
                WHEN data_type = 'date' THEN 'date'
                WHEN data_type = 'time without time zone' THEN 'time'
                WHEN data_type = 'json' THEN 'json'
                WHEN data_type = 'jsonb' THEN 'jsonb'
                WHEN data_type = 'uuid' THEN 'uuid'
                ELSE data_type
              END ||
              CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
              CASE 
                 WHEN column_default IS NOT NULL AND column_default LIKE 'nextval%' THEN 
                   ' DEFAULT ' || replace(column_default, 'publiccopy.', '')
                 WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default 
                 ELSE '' 
               END,
              ', '
              ORDER BY ordinal_position
            ) || ');' as create_statement
          FROM information_schema.columns 
          WHERE table_schema = 'publiccopy' AND table_name = $1
          GROUP BY table_name
        `, [tableName]);
        
        if (tableDefResult.rows.length > 0) {
          await targetPool.query(tableDefResult.rows[0].create_statement);
          console.log(`✅ 表结构复制完成: ${tableName}`);
        }
      } catch (error) {
        console.log(`❌ 表结构复制失败: ${tableName} - ${error.message}`);
        // 尝试简化的方法
        try {
          await targetPool.query(`CREATE TABLE "${tableName}" AS SELECT * FROM publiccopy."${tableName}" WHERE 1=0`);
          console.log(`✅ 表结构复制完成(简化方法): ${tableName}`);
        } catch (fallbackError) {
          console.log(`❌ 表结构复制彻底失败: ${tableName} - ${fallbackError.message}`);
          continue;
        }
      }
    }
    
    // 6. 复制数据
    console.log('\n5. 复制数据...');
    
    for (const tableName of tables) {
      console.log(`正在复制数据: ${tableName}`);
      
      try {
        // 获取表的所有数据
        const dataResult = await sourcePool.query(`SELECT * FROM publiccopy."${tableName}"`);
        
        if (dataResult.rows.length > 0) {
          // 获取列名
          const columns = Object.keys(dataResult.rows[0]);
          const columnNames = columns.map(col => `"${col}"`).join(', ');
          const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
          
          // 批量插入数据
          for (const row of dataResult.rows) {
            const values = columns.map(col => row[col]);
            await targetPool.query(
              `INSERT INTO "${tableName}" (${columnNames}) VALUES (${placeholders})`,
              values
            );
          }
          
          console.log(`✅ 数据复制完成: ${tableName} (${dataResult.rows.length} 条记录)`);
        } else {
          console.log(`✅ 表为空: ${tableName}`);
        }
      } catch (error) {
        console.log(`❌ 数据复制失败: ${tableName} - ${error.message}`);
      }
    }
    
    // 7. 复制主键约束
    console.log('\n6. 复制主键约束...');
    
    for (const tableName of tables) {
      try {
        const pkResult = await sourcePool.query(`
          SELECT 
            'ALTER TABLE "' || tc.table_name || '"' || 
            ' ADD CONSTRAINT "' || tc.constraint_name || '"' || 
            ' PRIMARY KEY (' || string_agg('"' || kcu.column_name || '"', ', ' ORDER BY kcu.ordinal_position) || ');' as pk_statement
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name 
            AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY' 
            AND tc.table_schema = 'publiccopy' 
            AND tc.table_name = $1
          GROUP BY tc.table_name, tc.constraint_name
        `, [tableName]);
        
        if (pkResult.rows.length > 0) {
          await targetPool.query(pkResult.rows[0].pk_statement);
          console.log(`✅ 主键约束复制完成: ${tableName}`);
        }
      } catch (error) {
        console.log(`⚠️ 主键约束复制失败: ${tableName} - ${error.message}`);
      }
    }
    
    // 8. 复制外键约束
    console.log('\n7. 复制外键约束...');
    
    const fkResult = await sourcePool.query(`
      SELECT 
        'ALTER TABLE "' || tc.table_name || '"' || 
        ' ADD CONSTRAINT "' || tc.constraint_name || '"' || 
        ' FOREIGN KEY (' || string_agg('"' || kcu.column_name || '"', ', ' ORDER BY kcu.ordinal_position) || ')' ||
        ' REFERENCES "' || ccu.table_name || '"' || 
        ' (' || string_agg('"' || ccu.column_name || '"', ', ' ORDER BY kcu.ordinal_position) || ')' ||
        CASE WHEN rc.delete_rule != 'NO ACTION' THEN ' ON DELETE ' || rc.delete_rule ELSE '' END ||
        CASE WHEN rc.update_rule != 'NO ACTION' THEN ' ON UPDATE ' || rc.update_rule ELSE '' END || ';' as fk_statement
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name 
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name 
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints rc 
        ON tc.constraint_name = rc.constraint_name 
        AND tc.table_schema = rc.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'publiccopy'
        AND tc.table_name = ANY($1)
      GROUP BY tc.table_name, tc.constraint_name, ccu.table_name, rc.delete_rule, rc.update_rule
    `, [tables]);
    
    for (const fkRow of fkResult.rows) {
      try {
        await targetPool.query(fkRow.fk_statement);
        console.log(`✅ 外键约束复制完成`);
      } catch (error) {
        console.log(`⚠️ 外键约束复制失败: ${error.message}`);
      }
    }
    
    // 9. 复制索引
    console.log('\n8. 复制索引...');
    
    const indexResult = await sourcePool.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'publiccopy'
        AND indexname NOT LIKE '%_pkey'
        AND tablename = ANY($1)
    `, [tables]);
    
    for (const indexRow of indexResult.rows) {
      try {
        // 修改索引定义以适应新的schema
        let modifiedIndexDef = indexRow.indexdef
          .replace(/publiccopy\./g, 'public.')
          .replace(/ON publiccopy\./g, 'ON public.');
        
        await targetPool.query(modifiedIndexDef);
        console.log(`✅ 索引复制完成: ${indexRow.indexname}`);
      } catch (error) {
        console.log(`⚠️ 索引复制失败: ${indexRow.indexname} - ${error.message}`);
      }
    }
    
    // 10. 验证复制结果
    console.log('\n9. 验证复制结果...');
    
    let totalSourceRecords = 0;
    let totalTargetRecords = 0;
    
    for (const tableName of tables) {
      try {
        const sourceCount = await sourcePool.query(`SELECT COUNT(*) as count FROM publiccopy."${tableName}"`);
        const targetCount = await targetPool.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        
        const sourceNum = parseInt(sourceCount.rows[0].count);
        const targetNum = parseInt(targetCount.rows[0].count);
        
        totalSourceRecords += sourceNum;
        totalTargetRecords += targetNum;
        
        if (sourceNum === targetNum) {
          console.log(`✅ ${tableName}: ${targetNum} 条记录`);
        } else {
          console.log(`❌ ${tableName}: 源表 ${sourceNum} 条，目标表 ${targetNum} 条`);
        }
      } catch (error) {
        console.log(`⚠️ 验证失败: ${tableName} - ${error.message}`);
      }
    }
    
    console.log('\n=== FastAgent数据库创建和数据复制完成 ===');
    console.log('✅ 数据库名称: FastAgent');
    console.log('✅ 连接字符串: postgresql://postgres:mjns8kr8@dbconn.sealoshzh.site:47291/FastAgent?directConnection=true');
    console.log(`✅ 总记录数: 源数据库 ${totalSourceRecords} 条，目标数据库 ${totalTargetRecords} 条`);
    console.log('✅ 所有表结构、数据、约束和索引已尽可能完整复制');
    
  } catch (error) {
    console.error('创建FastAgent数据库失败:', error);
  } finally {
    await adminPool.end();
    await sourcePool.end();
    if (targetPool) {
      await targetPool.end();
    }
  }
}

createFastAgentDatabase();
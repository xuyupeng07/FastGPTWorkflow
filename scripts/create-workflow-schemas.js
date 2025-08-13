const { Pool } = require('pg');

// 连接到FastAgent数据库
const pool = new Pool({
  connectionString: 'postgresql://postgres:mjns8kr8@dbconn.sealoshzh.site:47291/FastAgent?directConnection=true',
  ssl: false
});

async function createWorkflowSchemas() {
  try {
    console.log('=== 在FastAgent数据库中创建workflow和workflow2 schema ===');
    
    // 1. 创建workflow和workflow2 schema
    console.log('\n1. 创建schema...');
    
    try {
      await pool.query('CREATE SCHEMA IF NOT EXISTS workflow');
      console.log('✅ workflow schema创建成功');
    } catch (error) {
      console.log(`⚠️ workflow schema创建失败: ${error.message}`);
    }
    
    try {
      await pool.query('CREATE SCHEMA IF NOT EXISTS workflow2');
      console.log('✅ workflow2 schema创建成功');
    } catch (error) {
      console.log(`⚠️ workflow2 schema创建失败: ${error.message}`);
    }
    
    // 2. 获取public schema的所有表
    console.log('\n2. 获取public schema的所有表...');
    
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`发现 ${tables.length} 个表:`, tables);
    
    if (tables.length === 0) {
      console.log('⚠️ public schema中没有找到任何表');
      return;
    }
    
    // 3. 复制序列到两个新schema
    console.log('\n3. 复制序列...');
    
    const sequencesResult = await pool.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
    `);
    
    for (const seqRow of sequencesResult.rows) {
      const seqName = seqRow.sequence_name;
      
      for (const targetSchema of ['workflow', 'workflow2']) {
        try {
          // 获取序列的详细信息
          const seqInfoResult = await pool.query(`
            SELECT start_value, minimum_value, maximum_value, increment
            FROM information_schema.sequences 
            WHERE sequence_schema = 'public' AND sequence_name = $1
          `, [seqName]);
          
          const seqInfo = seqInfoResult.rows[0];
          
          // 在目标schema中创建序列
          await pool.query(`
            CREATE SEQUENCE ${targetSchema}."${seqName}" 
            START WITH ${seqInfo.start_value}
            INCREMENT BY ${seqInfo.increment}
            MINVALUE ${seqInfo.minimum_value}
            MAXVALUE ${seqInfo.maximum_value}
          `);
          
          // 获取序列的当前值
          const seqValueResult = await pool.query(`SELECT last_value FROM public.${seqName}`);
          const lastValue = seqValueResult.rows[0].last_value;
          
          // 设置序列的当前值
          await pool.query(`SELECT setval('${targetSchema}."${seqName}"', ${lastValue})`);
          
          console.log(`✅ 序列复制完成: ${targetSchema}.${seqName} (当前值: ${lastValue})`);
        } catch (error) {
          console.log(`⚠️ 序列复制失败: ${targetSchema}.${seqName} - ${error.message}`);
        }
      }
    }
    
    // 4. 复制表结构到两个新schema
    console.log('\n4. 复制表结构...');
    
    for (const tableName of tables) {
      for (const targetSchema of ['workflow', 'workflow2']) {
        console.log(`正在复制表结构: ${targetSchema}.${tableName}`);
        
        try {
          // 使用CREATE TABLE AS SELECT来复制表结构（不包含数据）
          await pool.query(`CREATE TABLE ${targetSchema}."${tableName}" AS SELECT * FROM public."${tableName}" WHERE 1=0`);
          console.log(`✅ 表结构复制完成: ${targetSchema}.${tableName}`);
        } catch (error) {
          console.log(`❌ 表结构复制失败: ${targetSchema}.${tableName} - ${error.message}`);
          continue;
        }
      }
    }
    
    // 5. 复制数据到两个新schema
    console.log('\n5. 复制数据...');
    
    for (const tableName of tables) {
      for (const targetSchema of ['workflow', 'workflow2']) {
        console.log(`正在复制数据: ${targetSchema}.${tableName}`);
        
        try {
          // 获取表的所有数据
          const dataResult = await pool.query(`SELECT * FROM public."${tableName}"`);
          
          if (dataResult.rows.length > 0) {
            // 获取列名
            const columns = Object.keys(dataResult.rows[0]);
            const columnNames = columns.map(col => `"${col}"`).join(', ');
            const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
            
            // 批量插入数据
            for (const row of dataResult.rows) {
              const values = columns.map(col => row[col]);
              await pool.query(
                `INSERT INTO ${targetSchema}."${tableName}" (${columnNames}) VALUES (${placeholders})`,
                values
              );
            }
            
            console.log(`✅ 数据复制完成: ${targetSchema}.${tableName} (${dataResult.rows.length} 条记录)`);
          } else {
            console.log(`✅ 表为空: ${targetSchema}.${tableName}`);
          }
        } catch (error) {
          console.log(`❌ 数据复制失败: ${targetSchema}.${tableName} - ${error.message}`);
        }
      }
    }
    
    // 6. 复制主键约束到两个新schema
    console.log('\n6. 复制主键约束...');
    
    for (const tableName of tables) {
      for (const targetSchema of ['workflow', 'workflow2']) {
        try {
          const pkResult = await pool.query(`
            SELECT 
              'ALTER TABLE ${targetSchema}."' || tc.table_name || '"' || 
              ' ADD CONSTRAINT "' || tc.constraint_name || '"' || 
              ' PRIMARY KEY (' || string_agg('"' || kcu.column_name || '"', ', ' ORDER BY kcu.ordinal_position) || ');' as pk_statement
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
              ON tc.constraint_name = kcu.constraint_name 
              AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY' 
              AND tc.table_schema = 'public' 
              AND tc.table_name = $1
            GROUP BY tc.table_name, tc.constraint_name
          `, [tableName]);
          
          if (pkResult.rows.length > 0) {
            await pool.query(pkResult.rows[0].pk_statement);
            console.log(`✅ 主键约束复制完成: ${targetSchema}.${tableName}`);
          }
        } catch (error) {
          console.log(`⚠️ 主键约束复制失败: ${targetSchema}.${tableName} - ${error.message}`);
        }
      }
    }
    
    // 7. 复制外键约束到两个新schema
    console.log('\n7. 复制外键约束...');
    
    for (const targetSchema of ['workflow', 'workflow2']) {
      const fkResult = await pool.query(`
        SELECT 
          'ALTER TABLE ${targetSchema}."' || tc.table_name || '"' || 
          ' ADD CONSTRAINT "' || tc.constraint_name || '"' || 
          ' FOREIGN KEY (' || string_agg('"' || kcu.column_name || '"', ', ' ORDER BY kcu.ordinal_position) || ')' ||
          ' REFERENCES ${targetSchema}."' || ccu.table_name || '"' || 
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
          AND tc.table_schema = 'public'
          AND tc.table_name = ANY($1)
        GROUP BY tc.table_name, tc.constraint_name, ccu.table_name, rc.delete_rule, rc.update_rule
      `, [tables]);
      
      for (const fkRow of fkResult.rows) {
        try {
          await pool.query(fkRow.fk_statement);
          console.log(`✅ 外键约束复制完成: ${targetSchema}`);
        } catch (error) {
          console.log(`⚠️ 外键约束复制失败: ${targetSchema} - ${error.message}`);
        }
      }
    }
    
    // 8. 复制索引到两个新schema
    console.log('\n8. 复制索引...');
    
    for (const targetSchema of ['workflow', 'workflow2']) {
      const indexResult = await pool.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
          AND indexname NOT LIKE '%_pkey'
          AND tablename = ANY($1)
      `, [tables]);
      
      for (const indexRow of indexResult.rows) {
        try {
          // 修改索引定义以适应新的schema
          let modifiedIndexDef = indexRow.indexdef
            .replace(/public\./g, `${targetSchema}.`)
            .replace(/ON public\./g, `ON ${targetSchema}.`)
            .replace(new RegExp(`"${indexRow.indexname}"`, 'g'), `"${targetSchema}_${indexRow.indexname}"`);
          
          await pool.query(modifiedIndexDef);
          console.log(`✅ 索引复制完成: ${targetSchema}.${indexRow.indexname}`);
        } catch (error) {
          console.log(`⚠️ 索引复制失败: ${targetSchema}.${indexRow.indexname} - ${error.message}`);
        }
      }
    }
    
    // 9. 验证复制结果
    console.log('\n9. 验证复制结果...');
    
    let totalPublicRecords = 0;
    let totalWorkflowRecords = 0;
    let totalWorkflow2Records = 0;
    
    for (const tableName of tables) {
      try {
        const publicCount = await pool.query(`SELECT COUNT(*) as count FROM public."${tableName}"`);
        const workflowCount = await pool.query(`SELECT COUNT(*) as count FROM workflow."${tableName}"`);
        const workflow2Count = await pool.query(`SELECT COUNT(*) as count FROM workflow2."${tableName}"`);
        
        const publicNum = parseInt(publicCount.rows[0].count);
        const workflowNum = parseInt(workflowCount.rows[0].count);
        const workflow2Num = parseInt(workflow2Count.rows[0].count);
        
        totalPublicRecords += publicNum;
        totalWorkflowRecords += workflowNum;
        totalWorkflow2Records += workflow2Num;
        
        if (publicNum === workflowNum && publicNum === workflow2Num) {
          console.log(`✅ ${tableName}: public ${publicNum} = workflow ${workflowNum} = workflow2 ${workflow2Num}`);
        } else {
          console.log(`❌ ${tableName}: public ${publicNum}, workflow ${workflowNum}, workflow2 ${workflow2Num}`);
        }
      } catch (error) {
        console.log(`⚠️ 验证失败: ${tableName} - ${error.message}`);
      }
    }
    
    console.log('\n=== workflow和workflow2 schema创建和数据复制完成 ===');
    console.log('✅ 数据库名称: FastAgent');
    console.log('✅ 新创建的schema: workflow, workflow2');
    console.log(`✅ 表数量: ${tables.length} 个`);
    console.log(`✅ 总记录数: public ${totalPublicRecords} 条，workflow ${totalWorkflowRecords} 条，workflow2 ${totalWorkflow2Records} 条`);
    console.log('✅ 所有表结构、数据、约束和索引已尽可能完整复制');
    
  } catch (error) {
    console.error('创建workflow schema失败:', error);
  } finally {
    await pool.end();
  }
}

createWorkflowSchemas();
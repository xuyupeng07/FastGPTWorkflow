const { Pool } = require('pg');

// 连接到数据库
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/database_name?directConnection=true',
  ssl: false
});

async function copyWorkflowToSchemas() {
  try {
    console.log('=== 将workflow schema的数据完全复制到workflow2和public schema ===');
    
    // 1. 获取workflow schema的所有表
    console.log('\n1. 获取workflow schema的所有表...');
    
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'workflow' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`发现 ${tables.length} 个表:`, tables);
    
    if (tables.length === 0) {
      console.log('⚠️ workflow schema中没有找到任何表');
      return;
    }
    
    // 2. 对每个目标schema进行操作
    const targetSchemas = ['workflow2', 'public'];
    
    for (const targetSchema of targetSchemas) {
      console.log(`\n=== 开始处理目标schema: ${targetSchema} ===`);
      
      // 3. 创建目标schema（如果不存在）
      if (targetSchema !== 'public') {
        try {
          await pool.query(`CREATE SCHEMA IF NOT EXISTS ${targetSchema}`);
          console.log(`✅ ${targetSchema} schema确保存在`);
        } catch (error) {
          console.log(`⚠️ ${targetSchema} schema创建失败: ${error.message}`);
        }
      }
      
      // 4. 删除目标schema中的现有表
      console.log(`\n2. 删除${targetSchema} schema中的现有表...`);
      
      // 禁用外键约束检查
      await pool.query('SET session_replication_role = replica');
      
      for (const tableName of tables) {
        try {
          // 检查表是否存在
          const tableExistsResult = await pool.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = $1 AND table_name = $2
            )
          `, [targetSchema, tableName]);
          
          if (tableExistsResult.rows[0].exists) {
            // 删除表
            await pool.query(`DROP TABLE ${targetSchema}."${tableName}" CASCADE`);
            console.log(`✅ 删除表: ${targetSchema}.${tableName}`);
          }
        } catch (error) {
          console.log(`⚠️ 删除表失败: ${targetSchema}.${tableName} - ${error.message}`);
        }
      }
      
      // 重新启用外键约束检查
      await pool.query('SET session_replication_role = DEFAULT');
      
      // 5. 删除目标schema中的现有序列
      console.log(`\n3. 删除${targetSchema} schema中的现有序列...`);
      
      const existingSequencesResult = await pool.query(`
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = $1
      `, [targetSchema]);
      
      for (const seqRow of existingSequencesResult.rows) {
        try {
          await pool.query(`DROP SEQUENCE IF EXISTS ${targetSchema}."${seqRow.sequence_name}" CASCADE`);
          console.log(`✅ 删除序列: ${targetSchema}.${seqRow.sequence_name}`);
        } catch (error) {
          console.log(`⚠️ 删除序列失败: ${targetSchema}.${seqRow.sequence_name} - ${error.message}`);
        }
      }
      
      // 6. 复制序列
      console.log(`\n4. 复制序列到${targetSchema} schema...`);
      
      const sequencesResult = await pool.query(`
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'workflow'
      `);
      
      for (const seqRow of sequencesResult.rows) {
        const seqName = seqRow.sequence_name;
        
        try {
          // 获取序列的详细信息
          const seqInfoResult = await pool.query(`
            SELECT start_value, minimum_value, maximum_value, increment
            FROM information_schema.sequences 
            WHERE sequence_schema = 'workflow' AND sequence_name = $1
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
          
          // 获取workflow序列的当前值
          const seqValueResult = await pool.query(`SELECT last_value FROM workflow."${seqName}"`);
          const lastValue = seqValueResult.rows[0].last_value;
          
          // 设置目标序列的当前值
          await pool.query(`SELECT setval('${targetSchema}."${seqName}"', ${lastValue})`);
          
          console.log(`✅ 序列复制完成: ${targetSchema}.${seqName} (当前值: ${lastValue})`);
        } catch (error) {
          console.log(`⚠️ 序列复制失败: ${targetSchema}.${seqName} - ${error.message}`);
        }
      }
      
      // 7. 复制表结构
      console.log(`\n5. 复制表结构到${targetSchema} schema...`);
      
      for (const tableName of tables) {
        try {
          // 复制表结构（不包含数据）
          await pool.query(`CREATE TABLE ${targetSchema}."${tableName}" AS SELECT * FROM workflow."${tableName}" WHERE 1=0`);
          console.log(`✅ 表结构复制完成: ${targetSchema}.${tableName}`);
        } catch (error) {
          console.log(`❌ 表结构复制失败: ${targetSchema}.${tableName} - ${error.message}`);
        }
      }
      
      // 8. 复制数据
      console.log(`\n6. 复制数据到${targetSchema} schema...`);
      
      // 禁用外键约束检查
      await pool.query('SET session_replication_role = replica');
      
      for (const tableName of tables) {
        try {
          // 获取workflow表的所有数据
          const dataResult = await pool.query(`SELECT * FROM workflow."${tableName}"`);
          
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
      
      // 重新启用外键约束检查
      await pool.query('SET session_replication_role = DEFAULT');
      
      // 9. 复制主键约束
      console.log(`\n7. 复制主键约束到${targetSchema} schema...`);
      
      for (const tableName of tables) {
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
              AND tc.table_schema = 'workflow' 
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
      
      // 10. 复制外键约束
      console.log(`\n8. 复制外键约束到${targetSchema} schema...`);
      
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
          AND tc.table_schema = 'workflow'
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
      
      // 11. 复制索引
      console.log(`\n9. 复制索引到${targetSchema} schema...`);
      
      const indexResult = await pool.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'workflow'
          AND indexname NOT LIKE '%_pkey'
          AND tablename = ANY($1)
      `, [tables]);
      
      for (const indexRow of indexResult.rows) {
        try {
          // 修改索引定义以适应新的schema
          let modifiedIndexDef = indexRow.indexdef
            .replace(/workflow\./g, `${targetSchema}.`)
            .replace(/ON workflow\./g, `ON ${targetSchema}.`)
            .replace(new RegExp(`"${indexRow.indexname}"`, 'g'), `"${targetSchema}_${indexRow.indexname}"`);
          
          await pool.query(modifiedIndexDef);
          console.log(`✅ 索引复制完成: ${targetSchema}.${indexRow.indexname}`);
        } catch (error) {
          console.log(`⚠️ 索引复制失败: ${targetSchema}.${indexRow.indexname} - ${error.message}`);
        }
      }
    }
    
    // 12. 验证复制结果
    console.log('\n=== 验证复制结果 ===');
    
    let totalWorkflowRecords = 0;
    let totalWorkflow2Records = 0;
    let totalPublicRecords = 0;
    
    for (const tableName of tables) {
      try {
        const workflowCount = await pool.query(`SELECT COUNT(*) as count FROM workflow."${tableName}"`);
        const workflow2Count = await pool.query(`SELECT COUNT(*) as count FROM workflow2."${tableName}"`);
        const publicCount = await pool.query(`SELECT COUNT(*) as count FROM public."${tableName}"`);
        
        const workflowNum = parseInt(workflowCount.rows[0].count);
        const workflow2Num = parseInt(workflow2Count.rows[0].count);
        const publicNum = parseInt(publicCount.rows[0].count);
        
        totalWorkflowRecords += workflowNum;
        totalWorkflow2Records += workflow2Num;
        totalPublicRecords += publicNum;
        
        if (workflowNum === workflow2Num && workflowNum === publicNum) {
          console.log(`✅ ${tableName}: workflow ${workflowNum} = workflow2 ${workflow2Num} = public ${publicNum}`);
        } else {
          console.log(`❌ ${tableName}: workflow ${workflowNum}, workflow2 ${workflow2Num}, public ${publicNum}`);
        }
      } catch (error) {
        console.log(`⚠️ 验证失败: ${tableName} - ${error.message}`);
      }
    }
    
    console.log('\n=== 数据复制完成 ===');
    console.log('✅ 数据库名称: FastAgent');
    console.log('✅ 源schema: workflow');
    console.log('✅ 目标schema: workflow2, public');
    console.log(`✅ 表数量: ${tables.length} 个`);
    console.log(`✅ 总记录数: workflow ${totalWorkflowRecords} 条，workflow2 ${totalWorkflow2Records} 条，public ${totalPublicRecords} 条`);
    console.log('✅ workflow2和public schema的数据已完全替换为workflow的数据');
    
  } catch (error) {
    console.error('数据复制失败:', error);
  } finally {
    await pool.end();
  }
}

copyWorkflowToSchemas();
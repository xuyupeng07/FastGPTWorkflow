#!/usr/bin/env node

/**
 * workflow_configs表迁移脚本
 * 将workflow_configs表的数据合并到workflows表的json_source字段中
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 数据库连接配置
const DATABASE_URL = 'postgresql://postgres:bzncrmdw@dbconn.sealoshzh.site:48900/?directConnection=true';

async function runMigration() {
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: false
    });

    try {
        console.log('🔗 连接到PostgreSQL数据库...');
        await client.connect();
        console.log('✅ 数据库连接成功');

        // 读取迁移SQL文件
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'migrate-workflow-configs.sql'), 
            'utf8'
        );

        console.log('\n📊 开始执行迁移...');
        
        // 分步执行迁移
        const steps = migrationSQL.split(';').filter(step => step.trim());
        
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i].trim();
            if (!step) continue;
            
            try {
                console.log(`\n⏳ 执行步骤 ${i + 1}/${steps.length}...`);
                const result = await client.query(step);
                
                // 如果是SELECT查询，显示结果
                if (step.toLowerCase().startsWith('select')) {
                    if (result.rows && result.rows.length > 0) {
                        console.table(result.rows);
                    } else {
                        console.log('   无结果返回');
                    }
                } else {
                    console.log(`   ✅ 步骤完成 (影响行数: ${result.rowCount || 0})`);
                }
            } catch (error) {
                console.error(`   ❌ 步骤执行失败:`, error.message);
                // 对于某些预期的错误（如表不存在），继续执行
                if (!error.message.includes('does not exist')) {
                    throw error;
                }
            }
        }

        console.log('\n🎉 迁移完成！');
        console.log('\n📋 迁移摘要:');
        console.log('   • workflow_configs表的数据已合并到workflows表的json_source字段');
        console.log('   • workflow_configs表已被删除');
        console.log('   • workflow_details视图已更新，不再依赖workflow_configs表');
        console.log('   • 相关的触发器和索引已清理');

    } catch (error) {
        console.error('❌ 迁移失败:', error.message);
        console.error('详细错误:', error);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n🔌 数据库连接已关闭');
    }
}

// 执行迁移前的确认
function confirmMigration() {
    return new Promise((resolve) => {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('⚠️  警告: 此操作将修改数据库结构并删除workflow_configs表');
        console.log('📋 迁移内容:');
        console.log('   1. 将workflow_configs.config_json合并到workflows.json_source');
        console.log('   2. 更新workflow_details视图');
        console.log('   3. 删除workflow_configs表及其相关对象');
        console.log('\n💡 建议在执行前备份数据库');
        
        rl.question('\n确认执行迁移? (输入 "yes" 确认): ', (answer) => {
            rl.close();
            if (answer.toLowerCase() === 'yes') {
                resolve(true);
            } else {
                console.log('❌ 迁移已取消');
                process.exit(0);
            }
        });
    });
}

// 主函数
async function main() {
    console.log('🚀 FastGPT工作流数据库迁移工具');
    console.log('📅 目标: 合并workflow_configs表到workflows表\n');
    
    // 检查是否跳过确认（用于自动化脚本）
    if (process.argv.includes('--force')) {
        console.log('🔧 强制模式: 跳过确认');
    } else {
        await confirmMigration();
    }
    
    await runMigration();
}

// 错误处理
process.on('unhandledRejection', (error) => {
    console.error('❌ 未处理的错误:', error);
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('\n⏹️  迁移被用户中断');
    process.exit(0);
});

// 执行主函数
if (require.main === module) {
    main();
}

module.exports = { runMigration };
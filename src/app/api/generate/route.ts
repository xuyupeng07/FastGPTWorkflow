import { NextRequest, NextResponse } from 'next/server';
import { mysqlQuery } from '../../../lib/mysql-db';

function getCurrentDomain(req: NextRequest): string {
    const host = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || (req.url.startsWith('https')? 'https' : 'http');
    if (!host) {
        // 使用新的公网地址作为默认值
        return 'https://qktyoucivudx.sealoshzh.site';
    }
    return `${protocol}://${host}`;
}

const generateLongUrl = (sourceTypeEn: string, abbreviation: string, projectCode: string, workflow_url: string): string => {
    // 如果workflow_url为空，不添加utm_workflow参数
    if (workflow_url===null) {
        return `https://cloud.fastgpt.cn/login?lastRoute=%2Fapp%2Flist&utm_source=${sourceTypeEn}&utm_medium=${abbreviation}&utm_content=${encodeURIComponent(projectCode)}`;
    }
    // 否则包含utm_workflow参数，需要对URL进行编码
    return `https://cloud.fastgpt.cn/login?lastRoute=%2Fapp%2Flist&utm_source=${sourceTypeEn}&utm_medium=${abbreviation}&utm_content=${encodeURIComponent(projectCode)}&utm_workflow=${encodeURIComponent(workflow_url)}`;
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const currentDomain = getCurrentDomain(request);
        const { sourceType, platform, projectCode, workflow_url } = body;

        // 参数验证
        if (!sourceType || !platform || !projectCode) {
            return NextResponse.json(
                { error: '缺少必要参数' },
                { status: 400 }
            );
        }

        // 获取平台缩写
        const platformData = await mysqlQuery(
            'SELECT abbreviation FROM platform WHERE platform = ? LIMIT 1',
            [platform]
        ) as any[];

        // 使用平台缩写，如果找不到则直接使用平台名称
        const platformAbbreviation = platformData && platformData.length > 0 
            ? platformData[0].abbreviation 
            : platform;

        // 获取来源类型的英文表示
        const sourceTypeData = await mysqlQuery(
            'SELECT en FROM sourcetype WHERE sourcetype = ? LIMIT 1',
            [sourceType]
        ) as any[];

        // 使用来源类型的英文表示，如果找不到则直接使用来源类型名称
        const sourceTypeEn = sourceTypeData && sourceTypeData.length > 0
            ? sourceTypeData[0].en
            : sourceType;

        // 如果没有传入workflow_url，则从数据库获取项目的workflow URL
        let finalWorkflowUrl = workflow_url;
        if (!finalWorkflowUrl) {
            const projectResult = await mysqlQuery(
                'SELECT url FROM workflow WHERE project_code = ?',
                [projectCode]
            ) as any[];
            
            if (projectResult.length === 0) {
                return NextResponse.json(
                    { error: '项目不存在' },
                    { status: 404 }
                );
            }
            
            finalWorkflowUrl = projectResult[0].url;
        }
        
        const longUrl = generateLongUrl(sourceTypeEn, platformAbbreviation, projectCode, finalWorkflowUrl);

        // 使用当前时间
        const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // 获取当前最大ID
        const maxIdResult = await mysqlQuery('SELECT MAX(id) as max_id FROM link_info') as any[];
        const nextId = maxIdResult[0].max_id ? maxIdResult[0].max_id + 1 : Math.floor(Math.random() * 100000);

        const shortChainId = Math.floor(Math.random() * 100000);

        // 检查是否存在相同的链接，如果存在则更新，否则创建新的
        let existingLink: any[] = [];
        try {
            existingLink = await mysqlQuery(`SELECT * FROM link_info WHERE source_type = ? AND platform = ? AND project_code = ?`, [sourceType, platform, projectCode]) as any[];
        } catch (error) {
            console.error('数据库查询出错', error);
            return NextResponse.json(
                { error: '服务器错误' },
                { status: 500 }
            );
        }

        // 确保workflow表中存在对应的project_code记录
        try {
            const workflowExists = await mysqlQuery(
                'SELECT project_code FROM workflow WHERE project_code = ?',
                [projectCode]
            ) as any[];
            
            if (workflowExists.length === 0) {
                // 如果workflow表中不存在该project_code，则插入一条记录
                await mysqlQuery(
                    'INSERT INTO workflow (project_code, url) VALUES (?, ?)',
                    [projectCode, finalWorkflowUrl]
                );
            }
        } catch (error) {
            console.error('创建workflow记录失败:', error);
            return NextResponse.json(
                { error: '创建workflow记录失败' },
                { status: 500 }
            );
        }

        let insertId: number;
        let shortUrl: string;
        
        if (existingLink.length > 0) {
            // 如果存在相同的链接，更新现有记录
            insertId = existingLink[0].id;
            shortUrl = `${currentDomain}/${insertId}`;
            
            await mysqlQuery(
                `UPDATE link_info SET long_url = ?, short_url = ?, created_at = ? WHERE id = ?`,
                [longUrl, shortUrl, currentTime, insertId]
            );
        } else {
            // 如果不存在，创建新的数据库记录
            await mysqlQuery(
                `INSERT INTO link_info (
                    source_type, platform, project_code, short_url, long_url, created_at
                ) VALUES (?, ?, ?, ?, ?, ?);`,
                [sourceType, platform, projectCode, shortChainId, longUrl, currentTime]
            );

            // 获取最后插入的记录ID
            const [result] = await mysqlQuery('SELECT LAST_INSERT_ID() as id') as any[];
            insertId = result.id;

            shortUrl = `${currentDomain}/${insertId}`;
            
            // 更新记录的短链接字段
            await mysqlQuery(
                `UPDATE link_info SET short_url = ? WHERE id = ?`,
                [shortUrl, insertId]
            );
        }

        // 同时更新workflow表中的url字段，确保指向正确的API JSON URL
        try {
            // 生成正确的API JSON URL
            const host = request.headers.get('host') || 'qktyoucivudx.sealoshzh.site';
            const protocol = host.includes('localhost') ? 'http' : 'https';
            const apiJsonUrl = `${protocol}://${host}/api/json/${projectCode}`;
            
            await mysqlQuery(
                `UPDATE workflow SET url = ? WHERE project_code = ?`,
                [apiJsonUrl, projectCode]
            );
            console.log(`已更新workflow表中项目 ${projectCode} 的URL为: ${apiJsonUrl}`);
        } catch (updateError) {
            console.error('更新workflow表失败:', updateError);
            // 不影响主流程，只记录错误
        }

        // 返回完整的记录对象
        return NextResponse.json({
            id: insertId,
            createdAt: currentTime,
            sourceType,
            platform,
            projectCode,
            shortUrl,
            longUrl
        });
    } catch (error) {
        console.error('生成链接失败:', error);
        return NextResponse.json(
            { error: '生成链接失败' },
            { status: 500 }
        );
    }
}
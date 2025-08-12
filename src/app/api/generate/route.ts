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
        return `https://cloud.fastgpt.cn/login?lastRoute=%2Fapp%2Flist&utm_source=${sourceTypeEn}&utm_medium=${abbreviation}&utm_content=${projectCode}`;
    }
    // 否则包含utm_workflow参数
    return `https://cloud.fastgpt.cn/login?lastRoute=%2Fapp%2Flist&utm_source=${sourceTypeEn}&utm_medium=${abbreviation}&utm_content=${projectCode}&utm_workflow=${workflow_url}`;
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const currentDomain = getCurrentDomain(request);
        const { sourceType, platform, projectCode } = body;

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

        // 从数据库获取项目的workflow URL
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
        
        const workflow_url = projectResult[0].url;
        
        const longUrl = generateLongUrl(sourceTypeEn, platformAbbreviation, projectCode, workflow_url);

        // 使用当前时间
        const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // 获取当前最大ID
        const maxIdResult = await mysqlQuery('SELECT MAX(id) as max_id FROM link_info') as any[];
        const nextId = maxIdResult[0].max_id ? maxIdResult[0].max_id + 1 : Math.floor(Math.random() * 100000);

        const shortChainId = Math.floor(Math.random() * 100000);

        try {
            const existingLink = await mysqlQuery(`SELECT * FROM link_info WHERE source_type = ? AND platform = ? AND project_code = ?`, [sourceType, platform, projectCode]) as any[];
            if (existingLink.length > 0) {
                return NextResponse.json(
                    { error: '短链已存在' },
                    { status: 400 }
                );
            }
        } catch (error) {
            console.error('数据库查询出错', error);
            return NextResponse.json(
                { error: '服务器错误' },
                { status: 500 }
            );
        }


        // 创建数据库记录 - 使用link_info表并明确指定created_at和description
        await mysqlQuery(
            `INSERT INTO link_info (
                source_type, platform, project_code, short_url, long_url, created_at
            ) VALUES (?, ?, ?, ?, ?, ?);`,
            [sourceType, platform, projectCode, shortChainId, longUrl, currentTime]
        );

        // 获取最后插入的记录ID
        const [result] = await mysqlQuery('SELECT LAST_INSERT_ID() as id') as any[];
        const insertId = result.id;

        const shortUrl = `${currentDomain}/${insertId}`;
        
        // 更新记录的短链接字段
        await mysqlQuery(
            `UPDATE link_info SET short_url = ? WHERE id = ?`,
            [shortUrl, insertId]
        );

        // 返回完整的新记录对象
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
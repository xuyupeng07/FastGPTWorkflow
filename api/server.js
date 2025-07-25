#!/usr/bin/env node

/**
 * FastGPT工作流案例API服务器
 * 提供工作流数据的REST API接口
 */

const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// 数据库连接配置
const DATABASE_URL = 'postgresql://postgres:bzncrmdw@dbconn.sealoshzh.site:48900/?directConnection=true';

// 创建数据库连接池
const client = new Client({
  connectionString: DATABASE_URL,
  ssl: false
});

// 中间件配置 - 必须在API端点之前
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// 确保uploads目录存在
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名：时间戳 + 随机数 + 原始扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'workflow-logo-' + uniqueSuffix + ext);
  }
});

// 文件过滤器，只允许图片文件
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制文件大小为5MB
  }
});

// 连接数据库
client.connect().then(() => {
  console.log('✅ 数据库连接成功');
}).catch(err => {
  console.error('❌ 数据库连接失败:', err);
  process.exit(1);
});

// API路由

/**
 * 检查用户点赞状态
 * GET /api/workflows/:id/like-status?user_session_id=xxx
 */
app.get('/api/workflows/:id/like-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_session_id } = req.query;
    
    if (!user_session_id) {
      return res.json({
        success: true,
        data: {
          liked: false,
          like_count: 0
        }
      });
    }
    
    // 获取工作流点赞信息
    const result = await client.query(`
      SELECT 
        w.like_count,
        CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as user_liked
      FROM workflows w
      LEFT JOIN user_actions ua ON w.id = ua.workflow_id 
        AND ua.user_session_id = $2 
        AND ua.action_type = 'like'
      WHERE w.id = $1
    `, [id, user_session_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '工作流不存在'
      });
    }
    
    const { like_count, user_liked } = result.rows[0];
    
    res.json({
      success: true,
      data: {
        liked: user_liked,
        like_count: parseInt(like_count)
      }
    });
  } catch (error) {
    console.error('获取点赞状态失败:', error);
    res.status(500).json({
      success: false,
      error: '获取点赞状态失败'
    });
  }
});

/**
 * 上传工作流Logo
 * POST /api/upload/logo
 */
app.post('/api/upload/logo', upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '没有上传文件'
      });
    }

    // 返回文件的URL路径
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        url: fileUrl,
        size: req.file.size
      },
      message: '文件上传成功'
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      error: '文件上传失败'
    });
  }
});

/**
 * 获取所有工作流分类
 * GET /api/categories
 */
app.get('/api/categories', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM workflows w WHERE w.category_id = c.id) as workflow_count
      FROM workflow_categories c
      ORDER BY c.sort_order, c.name
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('获取分类失败:', error);
    res.status(500).json({
      success: false,
      error: '获取分类失败'
    });
  }
});

/**
 * 获取工作流列表
 * GET /api/workflows
 * 查询参数:
 * - category: 分类ID
 * - search: 搜索关键词
 * - tag: 标签
 * - page: 页码
 * - limit: 每页数量
 */
app.get('/api/workflows', async (req, res) => {
  try {
    const {
      category,
      search,
      tag,
      page = 1,
      limit = 20
    } = req.query;
    
    let query = `
      SELECT 
        w.*,
        wc.name as category_name,
        a.name as author_name,
        a.avatar_url as author_avatar,
        '{}' as tags,
        COALESCE(array_agg(DISTINCT ws.image_url) FILTER (WHERE ws.image_url IS NOT NULL), '{}') as screenshots
      FROM workflows w
      LEFT JOIN workflow_categories wc ON w.category_id = wc.id
      LEFT JOIN authors a ON w.author_id = a.id
      LEFT JOIN workflow_screenshots ws ON w.id = ws.workflow_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // 分类筛选
    if (category && category !== 'all') {
      query += ` AND w.category_id = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    // 搜索
    if (search) {
      query += ` AND (w.title ILIKE $${paramIndex} OR w.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // 难度筛选已移除
    
    query += `
      GROUP BY w.id, wc.name, a.name, a.avatar_url
      ORDER BY w.created_at DESC
    `;
    
    // 分页
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await client.query(query, params);
    
    // 获取总数
    let countQuery = `
      SELECT COUNT(DISTINCT w.id) as total
      FROM workflows w
      WHERE 1=1
    `;
    
    const countParams = [];
    let countParamIndex = 1;
    
    if (category && category !== 'all') {
      countQuery += ` AND w.category_id = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }
    
    if (search) {
      countQuery += ` AND (w.title ILIKE $${countParamIndex} OR w.description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }
    
    // 难度筛选已移除
    
    const countResult = await client.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取工作流列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取工作流列表失败'
    });
  }
});

/**
 * 获取工作流详情
 * GET /api/workflows/:id
 */
app.get('/api/workflows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取工作流基本信息
    const workflowResult = await client.query(`
      SELECT 
        w.*,
        wc.name as category_name,
        a.name as author_name,
        a.avatar_url as author_avatar,
        a.bio as author_bio
      FROM workflows w
      LEFT JOIN workflow_categories wc ON w.category_id = wc.id
      LEFT JOIN authors a ON w.author_id = a.id
      WHERE w.id = $1
    `, [id]);
    
    if (workflowResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '工作流不存在'
      });
    }
    
    const workflow = workflowResult.rows[0];
    
    // 获取标签 (暂时返回空数组，因为标签表不存在)
    const tagsResult = { rows: [] };
    
    // 获取截图
    const screenshotsResult = await client.query(`
      SELECT image_url
      FROM workflow_screenshots
      WHERE workflow_id = $1
      ORDER BY sort_order
    `, [id]);
    
    // 获取说明
    const instructionsResult = await client.query(`
      SELECT instruction_text
      FROM workflow_instructions
      WHERE workflow_id = $1
      ORDER BY sort_order
    `, [id]);
    

    
    // 组装完整数据
    const fullWorkflow = {
      ...workflow,
      tags: tagsResult.rows.map(row => row.name),
      screenshots: screenshotsResult.rows.map(row => row.image_url),
      instructions: instructionsResult.rows.map(row => row.instruction_text),
      config: workflow.json_source ? (() => {
        try {
          return JSON.parse(workflow.json_source);
        } catch (error) {
          console.error(`工作流 ${workflow.id} 的 json_source 解析失败:`, error.message);
          return {
            nodes: [],
            edges: [],
            variables: [],
            version: '1.0',
            error: 'Invalid JSON data'
          };
        }
      })() : {
        nodes: [],
        edges: [],
        variables: [],
        version: '1.0'
      }
    };
    

    
    // 记录查看行为
    await client.query(`
      INSERT INTO user_actions (workflow_id, action_type)
      VALUES ($1, 'view')
    `, [id]);
    
    res.json({
      success: true,
      data: fullWorkflow
    });
  } catch (error) {
    console.error('获取工作流详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取工作流详情失败'
    });
  }
});

/**
 * 获取所有标签
 * GET /api/tags
 */
app.get('/api/tags', async (req, res) => {
  try {
    // 暂时返回空数组，因为标签表不存在
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('获取标签失败:', error);
    res.status(500).json({
      success: false,
      error: '获取标签失败'
    });
  }
});

/**
 * 记录用户行为
 * POST /api/workflows/:id/actions
 */
app.post('/api/workflows/:id/actions', async (req, res) => {
  try {
    const { id } = req.params;
    const { action_type, user_session_id } = req.body;
    const user_ip = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');
    const referrer = req.get('Referer');
    
    if (!['view', 'like', 'copy', 'download', 'try'].includes(action_type)) {
      return res.status(400).json({
        success: false,
        error: '无效的操作类型'
      });
    }
    
    // 如果是点赞操作且提供了用户会话ID，检查是否已经点赞
    if (action_type === 'like' && user_session_id) {
      const existingLike = await client.query(`
        SELECT id FROM user_actions 
        WHERE workflow_id = $1 AND user_session_id = $2 AND action_type = 'like'
      `, [id, user_session_id]);
      
      if (existingLike.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: '您已经点赞过此工作流',
          code: 'ALREADY_LIKED'
        });
      }
    }
    
    // 记录用户行为
    await client.query(`
      INSERT INTO user_actions (workflow_id, action_type, user_session_id, user_ip, user_agent, referrer)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [id, action_type, user_session_id, user_ip, user_agent, referrer]);
    
    // 如果是点赞，更新工作流的点赞数
    if (action_type === 'like') {
      await client.query(`
        UPDATE workflows 
        SET like_count = like_count + 1
        WHERE id = $1
      `, [id]);
    }
    
    // 如果是try或copy操作，更新工作流的使用数
    if (action_type === 'try' || action_type === 'copy') {
      await client.query(`
        UPDATE workflows 
        SET usage_count = usage_count + 1
        WHERE id = $1
      `, [id]);
    }
    
    res.json({
      success: true,
      message: '操作记录成功'
    });
  } catch (error) {
    console.error('记录用户行为失败:', error);
    
    // 处理唯一约束冲突（重复点赞）
    if (error.code === '23505' && error.constraint === 'idx_user_actions_unique_like') {
      return res.status(409).json({
        success: false,
        error: '您已经点赞过此工作流',
        code: 'ALREADY_LIKED'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '记录用户行为失败'
    });
  }
});

/**
 * 获取统计信息
 * GET /api/stats
 */
app.get('/api/stats', async (req, res) => {
  try {
    const stats = {};
    
    // 工作流总数
    const workflowCount = await client.query(
      "SELECT COUNT(*) as count FROM workflows"
    );
    stats.totalWorkflows = parseInt(workflowCount.rows[0].count);
    
    // 分类统计
    const categoryStats = await client.query(`
      SELECT 
        wc.id as category_id,
        wc.name as category_name,
        COUNT(w.id) as workflow_count
      FROM workflow_categories wc
      LEFT JOIN workflows w ON wc.id = w.category_id
      GROUP BY wc.id, wc.name
      ORDER BY workflow_count DESC
    `);
    stats.categoryStats = categoryStats.rows;
    
    // 热门标签
    const popularTags = await client.query(`
      SELECT 
        wt.name as tag_name,
        COUNT(wtr.workflow_id) as usage_count
      FROM workflow_tags wt
      LEFT JOIN workflow_tag_relations wtr ON wt.id = wtr.tag_id
      GROUP BY wt.id, wt.name
      ORDER BY usage_count DESC
      LIMIT 10
    `);
    stats.popularTags = popularTags.rows;
    
    // 最近活动
    const recentActions = await client.query(`
      SELECT action_type, COUNT(*) as count
      FROM user_actions
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY action_type
      ORDER BY count DESC
    `);
    stats.recentActions = recentActions.rows;
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取统计信息失败'
    });
  }
});

/**
 * 获取所有作者
 * GET /api/authors
 */
app.get('/api/authors', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT a.*,
        (SELECT COUNT(*) FROM workflows w WHERE w.author_id = a.id) as workflow_count
      FROM authors a
      ORDER BY a.name
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('获取作者列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取作者列表失败'
    });
  }
});

/**
 * 创建新工作流 (管理员)
 * POST /api/admin/workflows
 */
app.post('/api/admin/workflows', async (req, res) => {
  try {
    const {
      title,
      description,
      category_id,
      author_id,
      thumbnail_url,
      demo_url,
      is_featured,
      is_published,
      json_source
    } = req.body;

    // 数据验证和类型转换
    if (!title || !description || !category_id || !author_id || !thumbnail_url) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段'
      });
    }

    // 确保author_id是有效的整数
    const authorIdInt = parseInt(author_id);
    if (isNaN(authorIdInt) || authorIdInt <= 0) {
      return res.status(400).json({
        success: false,
        error: 'author_id必须是有效的正整数'
      });
    }

    // 生成工作流ID
    const workflow_id = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-') + '-' + Date.now();

    const result = await client.query(`
      INSERT INTO workflows (
        id, title, description, category_id, author_id,
        thumbnail_url, demo_url,
        is_featured, is_published, json_source
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) RETURNING *
    `, [
      workflow_id, title, description, category_id, authorIdInt,
      thumbnail_url, demo_url || null,
      is_featured, is_published, json_source || null
    ]);

    res.json({
      success: true,
      data: result.rows[0],
      message: '工作流创建成功'
    });
  } catch (error) {
    console.error('创建工作流失败:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({
      success: false,
      error: '创建工作流失败: ' + error.message
    });
  }
});

/**
 * 更新工作流 (管理员)
 * PUT /api/admin/workflows/:id
 */
app.put('/api/admin/workflows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      long_description,
      category_id,
      author_id,
      thumbnail_url,
      demo_url,
      share_id,
      is_featured,
      is_published,
      version,
      json_source
    } = req.body;

    // 数据验证和类型转换
    if (!title || !description || !category_id || !author_id || !thumbnail_url) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段'
      });
    }

    // 确保author_id是有效的整数
    const authorIdInt = parseInt(author_id);
    if (isNaN(authorIdInt) || authorIdInt <= 0) {
      return res.status(400).json({
        success: false,
        error: 'author_id必须是有效的正整数'
      });
    }

    const result = await client.query(`
      UPDATE workflows SET
        title = $2,
        description = $3,
        category_id = $4,
        author_id = $5,
        thumbnail_url = $6,
        demo_url = $7,
        is_featured = $8,
        is_published = $9,
        json_source = $10,
        updated_at = CURRENT_TIMESTAMP,
        published_at = CASE 
          WHEN $9 = true AND published_at IS NULL THEN CURRENT_TIMESTAMP
          WHEN $9 = false THEN NULL
          ELSE published_at
        END
      WHERE id = $1
      RETURNING *
    `, [
      id, title, description, category_id, authorIdInt,
      thumbnail_url, demo_url || null,
      is_featured, is_published, json_source || null
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '工作流不存在'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: '工作流更新成功'
    });
  } catch (error) {
    console.error('更新工作流失败:', error);
    res.status(500).json({
      success: false,
      error: '更新工作流失败: ' + error.message
    });
  }
});

/**
 * 删除工作流 (管理员)
 * DELETE /api/admin/workflows/:id
 */
app.delete('/api/admin/workflows/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 开始事务
    await client.query('BEGIN');

    try {
      // 删除相关的标签关联
      await client.query('DELETE FROM workflow_tag_relations WHERE workflow_id = $1', [id]);
      
      // 删除相关的截图
      await client.query('DELETE FROM workflow_screenshots WHERE workflow_id = $1', [id]);
      
      // 删除相关的说明
      await client.query('DELETE FROM workflow_instructions WHERE workflow_id = $1', [id]);
      

      
      // 删除用户行为记录
      await client.query('DELETE FROM user_actions WHERE workflow_id = $1', [id]);
      
      // 删除工作流
      const result = await client.query('DELETE FROM workflows WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: '工作流不存在'
        });
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: '工作流删除成功'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('删除工作流失败:', error);
    res.status(500).json({
      success: false,
      error: '删除工作流失败: ' + error.message
    });
  }
});

/**
 * 标签管理接口
 */

// 创建标签
app.post('/api/admin/tags', async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name || !color) {
      return res.status(400).json({
        success: false,
        error: '标签名称和颜色不能为空'
      });
    }

    // 检查标签名称是否已存在
    const existingTag = await client.query(
      'SELECT id FROM workflow_tags WHERE name = $1',
      [name]
    );

    if (existingTag.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: '标签名称已存在'
      });
    }

    const result = await client.query(
      'INSERT INTO workflow_tags (name, color) VALUES ($1, $2) RETURNING *',
      [name, color]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: '标签创建成功'
    });
  } catch (error) {
    console.error('创建标签失败:', error);
    res.status(500).json({
      success: false,
      error: '创建标签失败: ' + error.message
    });
  }
});

// 更新标签
app.put('/api/admin/tags/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    if (!name || !color) {
      return res.status(400).json({
        success: false,
        error: '标签名称和颜色不能为空'
      });
    }

    // 检查标签是否存在
    const existingTag = await client.query(
      'SELECT id FROM workflow_tags WHERE id = $1',
      [id]
    );

    if (existingTag.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '标签不存在'
      });
    }

    // 检查标签名称是否与其他标签重复
    const duplicateTag = await client.query(
      'SELECT id FROM workflow_tags WHERE name = $1 AND id != $2',
      [name, id]
    );

    if (duplicateTag.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: '标签名称已存在'
      });
    }

    const result = await client.query(
      'UPDATE workflow_tags SET name = $1, color = $2 WHERE id = $3 RETURNING *',
      [name, color, id]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: '标签更新成功'
    });
  } catch (error) {
    console.error('更新标签失败:', error);
    res.status(500).json({
      success: false,
      error: '更新标签失败: ' + error.message
    });
  }
});

// 删除标签
app.delete('/api/admin/tags/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 开始事务
    await client.query('BEGIN');

    try {
      // 检查标签是否存在
      const existingTag = await client.query(
        'SELECT id FROM workflow_tags WHERE id = $1',
        [id]
      );

      if (existingTag.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: '标签不存在'
        });
      }

      // 删除标签关联关系
      await client.query('DELETE FROM workflow_tag_relations WHERE tag_id = $1', [id]);
      
      // 删除标签
      await client.query('DELETE FROM workflow_tags WHERE id = $1', [id]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: '标签删除成功'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('删除标签失败:', error);
    res.status(500).json({
      success: false,
      error: '删除标签失败: ' + error.message
    });
  }
});

/**
 * 分类管理接口
 */

// 创建分类
app.post('/api/admin/categories', async (req, res) => {
  try {
    const { id, name, icon, color, description, sort_order } = req.body;

    if (!id || !name || !icon || !color) {
      return res.status(400).json({
        success: false,
        error: '分类ID、名称、图标和颜色不能为空'
      });
    }

    // 检查分类ID是否已存在
    const existingCategory = await client.query(
      'SELECT id FROM workflow_categories WHERE id = $1',
      [id]
    );

    if (existingCategory.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: '分类ID已存在'
      });
    }

    // 检查分类名称是否已存在
    const existingName = await client.query(
      'SELECT id FROM workflow_categories WHERE name = $1',
      [name]
    );

    if (existingName.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: '分类名称已存在'
      });
    }

    // 如果没有提供sort_order，自动设置为最大值+1
    let finalSortOrder = sort_order;
    if (finalSortOrder === undefined || finalSortOrder === null) {
      const maxSortResult = await client.query(
        'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_sort_order FROM workflow_categories'
      );
      finalSortOrder = maxSortResult.rows[0].next_sort_order;
    } else {
      // 确保sort_order是有效的整数
      finalSortOrder = parseInt(finalSortOrder);
      if (isNaN(finalSortOrder) || finalSortOrder < 0) {
        return res.status(400).json({
          success: false,
          error: 'sort_order必须是非负整数'
        });
      }
    }

    const result = await client.query(
      'INSERT INTO workflow_categories (id, name, icon, color, description, sort_order) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, name, icon, color, description || null, finalSortOrder]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: '分类创建成功'
    });
  } catch (error) {
    console.error('创建分类失败:', error);
    res.status(500).json({
      success: false,
      error: '创建分类失败: ' + error.message
    });
  }
});

// 更新分类
app.put('/api/admin/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, color, description, sort_order } = req.body;

    if (!name || !icon || !color) {
      return res.status(400).json({
        success: false,
        error: '分类名称、图标和颜色不能为空'
      });
    }

    // 检查分类是否存在
    const existingCategory = await client.query(
      'SELECT id FROM workflow_categories WHERE id = $1',
      [id]
    );

    if (existingCategory.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '分类不存在'
      });
    }

    // 检查名称是否与其他分类重复
    const duplicateName = await client.query(
      'SELECT id FROM workflow_categories WHERE name = $1 AND id != $2',
      [name, id]
    );

    if (duplicateName.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: '分类名称已存在'
      });
    }

    // 确保sort_order是有效的整数
    let finalSortOrder = sort_order || 0;
    if (sort_order !== undefined && sort_order !== null) {
      finalSortOrder = parseInt(sort_order);
      if (isNaN(finalSortOrder) || finalSortOrder < 0) {
        return res.status(400).json({
          success: false,
          error: 'sort_order必须是非负整数'
        });
      }
    }

    const result = await client.query(
      'UPDATE workflow_categories SET name = $1, icon = $2, color = $3, description = $4, sort_order = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name, icon, color, description || null, finalSortOrder, id]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: '分类更新成功'
    });
  } catch (error) {
    console.error('更新分类失败:', error);
    res.status(500).json({
      success: false,
      error: '更新分类失败: ' + error.message
    });
  }
});

// 删除分类
app.delete('/api/admin/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 检查分类是否存在
    const existingCategory = await client.query(
      'SELECT id FROM workflow_categories WHERE id = $1',
      [id]
    );

    if (existingCategory.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '分类不存在'
      });
    }

    // 检查是否有工作流使用此分类
    const workflowsUsingCategory = await client.query(
      'SELECT COUNT(*) as count FROM workflows WHERE category_id = $1',
      [id]
    );

    if (parseInt(workflowsUsingCategory.rows[0].count) > 0) {
      // 将使用此分类的工作流移动到默认分类
      await client.query(
        'UPDATE workflows SET category_id = $1 WHERE category_id = $2',
        ['all', id]
      );
    }

    // 删除分类
    await client.query(
      'DELETE FROM workflow_categories WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: '分类删除成功'
    });
  } catch (error) {
    console.error('删除分类失败:', error);
    res.status(500).json({
      success: false,
      error: '删除分类失败: ' + error.message
    });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 测试数据库连接
app.get('/test-db', async (req, res) => {
  try {
    const result = await client.query('SELECT NOW() as current_time');
    res.json({
      success: true,
      data: result.rows[0],
      message: '数据库连接正常'
    });
  } catch (error) {
    console.error('数据库测试失败:', error);
    res.status(500).json({
      success: false,
      error: '数据库连接失败: ' + error.message
    });
  }
});

// 测试创建工作流（简化版）
app.post('/test-workflow', async (req, res) => {
  try {
    console.log('收到测试工作流请求:', req.body);
    
    const workflow_id = 'test-' + Date.now();
    const result = await client.query(`
      INSERT INTO workflows (
        id, title, description, category_id, author_id,
        thumbnail_url, demo_url,
        is_featured, is_published, json_source
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) RETURNING *
    `, [
      workflow_id, '测试工作流', '测试描述', 'customer-service', 1,
      'https://example.com/test.jpg', null,
      false, true, null
    ]);
    
    console.log('工作流创建成功:', result.rows[0]);
    res.json({
      success: true,
      data: result.rows[0],
      message: '测试工作流创建成功'
    });
  } catch (error) {
    console.error('测试工作流创建失败:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({
      success: false,
      error: '测试工作流创建失败: ' + error.message
    });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  console.error('错误详情:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
    detail: err.detail
  });
  res.status(500).json({
    success: false,
    error: '服务器内部错误: ' + err.message
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 API服务器已启动`);
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log(`📚 API文档: http://localhost:${PORT}/api`);
  console.log(`💚 健康检查: http://localhost:${PORT}/health`);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('🔄 正在关闭服务器...');
  await client.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 正在关闭服务器...');
  await client.end();
  process.exit(0);
});
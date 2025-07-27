#!/bin/bash

# 带重启机制的应用启动脚本
# 解决容器重启问题

set -e  # 遇到错误时退出

echo "🚀 启动 FastGPT Workflow 应用 (带重启保护)"
echo "时间: $(date)"
echo "工作目录: $(pwd)"
echo "================================"

# 清理之前的进程
echo "🧹 清理之前的进程..."
pkill -f "node api/server.js" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true
sleep 2

# 检查环境
echo "🔍 检查环境..."
if [ ! -f ".env" ]; then
    echo "❌ .env 文件不存在，复制示例文件..."
    cp .env.example .env
fi

# 检查依赖
echo "📦 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "📥 安装依赖..."
    pnpm install
fi

# 检查构建
echo "🔨 检查构建..."
if [ ! -d ".next" ]; then
    echo "🏗️  构建应用..."
    pnpm run build
fi

# 创建日志目录
mkdir -p logs

# 启动函数
start_api() {
    echo "🌐 启动API服务器..."
    node api/server.js > logs/api.log 2>&1 &
    API_PID=$!
    echo "API服务器 PID: $API_PID"
    
    # 等待API服务器启动
    for i in {1..30}; do
        if curl -s http://localhost:3002/health > /dev/null 2>&1; then
            echo "✅ API服务器启动成功"
            return 0
        fi
        echo "⏳ 等待API服务器启动... ($i/30)"
        sleep 1
    done
    
    echo "❌ API服务器启动失败"
    return 1
}

start_nextjs() {
    echo "⚛️  启动Next.js应用..."
    npm run start > logs/nextjs.log 2>&1 &
    NEXTJS_PID=$!
    echo "Next.js应用 PID: $NEXTJS_PID"
    
    # 等待Next.js应用启动
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo "✅ Next.js应用启动成功"
            return 0
        fi
        echo "⏳ 等待Next.js应用启动... ($i/30)"
        sleep 1
    done
    
    echo "❌ Next.js应用启动失败"
    return 1
}

# 监控函数
monitor_services() {
    while true; do
        sleep 10
        
        # 检查API服务器
        if ! kill -0 $API_PID 2>/dev/null; then
            echo "⚠️  API服务器进程异常，重启中..."
            start_api
        fi
        
        # 检查Next.js应用
        if ! kill -0 $NEXTJS_PID 2>/dev/null; then
            echo "⚠️  Next.js应用进程异常，重启中..."
            start_nextjs
        fi
        
        # 健康检查
        if ! curl -s http://localhost:3002/health > /dev/null 2>&1; then
            echo "⚠️  API服务器健康检查失败，重启中..."
            kill $API_PID 2>/dev/null || true
            sleep 2
            start_api
        fi
        
        if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo "⚠️  Next.js应用健康检查失败，重启中..."
            kill $NEXTJS_PID 2>/dev/null || true
            sleep 2
            start_nextjs
        fi
    done
}

# 信号处理
trap 'echo "🛑 收到停止信号，正在关闭服务..."; kill $API_PID $NEXTJS_PID 2>/dev/null; exit 0' SIGTERM SIGINT

# 启动服务
if start_api && start_nextjs; then
    echo "🎉 所有服务启动成功！"
    echo "📍 API服务器: http://localhost:3002"
    echo "📍 Next.js应用: http://localhost:3000"
    echo "📊 开始监控服务状态..."
    
    # 开始监控
    monitor_services
else
    echo "❌ 服务启动失败"
    exit 1
fi
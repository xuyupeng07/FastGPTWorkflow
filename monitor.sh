#!/bin/bash

# 应用监控脚本
# 用于监控应用状态并在出现问题时自动重启

echo "开始监控 FastGPT Workflow 应用..."
echo "监控时间: $(date)"
echo "================================"

# 检查进程是否运行
check_process() {
    local process_name=$1
    local port=$2
    
    # 检查端口是否被监听
    if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
        echo "✅ $process_name 正在运行 (端口 $port)"
        return 0
    else
        echo "❌ $process_name 未运行 (端口 $port)"
        return 1
    fi
}

# 检查应用健康状态
check_health() {
    local url=$1
    local service_name=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo "✅ $service_name 健康检查通过"
        return 0
    else
        echo "❌ $service_name 健康检查失败"
        return 1
    fi
}

# 主监控循环
while true; do
    echo "\n[$(date)] 检查应用状态..."
    
    # 检查API服务器
    if ! check_process "API服务器" "3002"; then
        echo "⚠️  API服务器异常，尝试重启..."
        cd /home/devbox/project/FastGPTWorkflow
        pkill -f "node api/server.js" 2>/dev/null
        sleep 2
        nohup node api/server.js > api.log 2>&1 &
        sleep 5
    fi
    
    # 检查Next.js应用
    if ! check_process "Next.js应用" "3000"; then
        echo "⚠️  Next.js应用异常，尝试重启..."
        cd /home/devbox/project/FastGPTWorkflow
        pkill -f "next start" 2>/dev/null
        sleep 2
        nohup npm run start > nextjs.log 2>&1 &
        sleep 5
    fi
    
    # 健康检查
    check_health "http://localhost:3002/health" "API服务器"
    check_health "http://localhost:3000" "Next.js应用"
    
    # 等待30秒后再次检查
    sleep 30
done
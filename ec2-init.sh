#!/bin/bash

# 1. 将所有的输出日志记录下来，方便日后排错（高级操作，加分项）
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "开始初始化 EC2 服务器..."
    
# 2. 更新 Ubuntu 系统的软件源
apt-get update -y

# 3. 安装 Java 17 运行环境
apt-get install openjdk-17-jdk -y

# 4. 创建一个专门存放 Spring Boot 项目的文件夹
mkdir -p /home/ubuntu/springboot-app

# 5. 把文件夹的权限交给默认用户 ubuntu，方便你以后传文件
chown ubuntu:ubuntu /home/ubuntu/springboot-app

echo "EC2 初始化完成！Java 环境已就绪。"
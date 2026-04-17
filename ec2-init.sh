#!/bin/bash
# 詳細記錄所有輸出，方便之後看錯誤
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "=== COMP4442 EC2 初始化開始 ==="

# 1. 更新系統
apt-get update -y
apt-get upgrade -y

# 2. 安裝 Java 17
apt-get install openjdk-17-jdk -y

# 3. 安裝 Maven
apt-get install maven -y

# 4. 安裝 Git
apt-get install git -y

# 5. 建立專案資料夾
mkdir -p /home/ubuntu/comp4442-app
mkdir -p /home/ubuntu/comp4442-app/logs
chown -R ubuntu:ubuntu /home/ubuntu/comp4442-app

# 6. 複製專案檔案 (如果已上傳) 或使用 git clone
# git clone https://github.com/your-repo/comp4442-project.git /home/ubuntu/comp4442-app

# 7. 建置應用程式
cd /home/ubuntu/comp4442-app
mvn clean package -DskipTests

# 8. 啟動應用程式
nohup java -jar target/service-computing-backend-1.0.0.jar > logs/app.log 2>&1 &

echo "=== EC2 初始化完成！應用程式已啟動 ==="
echo "應用程式運行在 http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8080/api"
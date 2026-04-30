#!/bin/bash
# 詳細記錄所有輸出，方便之後看錯誤
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "=== COMP4442 EC2 初始化開始 ==="

# 1. 更新系統
sudo yum update -y

# 2. 安裝 Java 17
sudo amazon-linux-extras install java17 -y

# 3. 安裝 Maven
sudo yum install maven -y

# 4. 安裝 Git
sudo yum install git -y

# 5. 安裝 Nginx (for frontend)
sudo amazon-linux-extras install nginx1 -y

# 6. 建立專案資料夾
mkdir -p /home/ec2-user/comp4442-app
mkdir -p /home/ec2-user/comp4442-app/logs
chown -R ec2-user:ec2-user /home/ec2-user/comp4442-app

# 7. 複製專案檔案 - 請修改為你的 GitHub repo URL
# 取消下面的註釋並設定你的 repo URL
cd /home/ec2-user/comp4442-app
git clone https://github.com/TonyAuYeung-star/COMP4442_Project.git

# 8. 建置應用程式
cd /home/ec2-user/comp4442-app
mvn clean package -DskipTests

# 9. 複製靜態資源到 Nginx 目錄
sudo cp -r src/main/resources/static/* /usr/share/nginx/html/
sudo cp -r frontend/dist/* /usr/share/nginx/html/

# 10. 啟動 Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# 11. 啟動 Spring Boot 應用程式
cd /home/ec2-user/comp4442-app
nohup java -jar target/service-computing-backend-1.0.0.jar > logs/app.log 2>&1 &

echo "=== EC2 初始化完成！ ==="
echo "Backend API: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8080/api"
echo "Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/"
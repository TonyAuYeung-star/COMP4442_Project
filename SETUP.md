# COMP4442 Spring Boot Backend - Setup Guide

## Quick Start Guide for Development

### 1. Prerequisites Installation

#### macOS
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Java 17
brew install openjdk@17
export JAVA_HOME=/usr/libexec/java_home -v 17

# Install Maven
brew install maven

# Verify installations
java -version
mvn -version
```

#### Windows
```powershell
# Using Chocolatey
choco install openjdk17 maven

# Or download manually:
# Java: https://www.oracle.com/java/technologies/downloads/#java17
# Maven: https://maven.apache.org/download.cgi

# Verify
java -version
mvn -version
```

#### Ubuntu/Linux
```bash
sudo apt-get update

# Install Java 17
sudo apt-get install openjdk-17-jdk

# Install Maven
sudo apt-get install maven
```

### 2. Clone and Setup Project
```bash
# Clone repository
git clone https://github.com/your-username/COMP4442_Project.git
cd COMP4442_Project

# Make scripts executable
chmod +x scripts/*.sh
```

### 3. Development Environment

#### Run with Maven
```bash
# Install dependencies
mvn clean install

# Run with development profile
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"

# Or use the provided script
./scripts/start-dev.sh
```

### 4. Access Application

- **API Base:** http://localhost:8080/api
- **Health Check:** http://localhost:8080/api/v1/health
- **Info Endpoint:** http://localhost:8080/api/v1/info
- **H2 Database Console:** http://localhost:8080/h2-console (dev only)

### 5. API Testing

#### Using cURL
```bash
# Health check
curl http://localhost:8080/api/v1/health

# Get all services
curl http://localhost:8080/api/v1/services

# Register new service
curl -X POST http://localhost:8080/api/v1/services \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "my-service",
    "host": "localhost",
    "port": 8081,
    "description": "My Service",
    "healthCheckUrl": "/health",
    "version": "1.0.0"
  }'
```

#### Using Postman
1. Import [postman-collection.json](postman-collection.json)
2. Set baseUrl to `http://localhost:8080/api`
3. Execute requests

### 6. Deploy to AWS EC2

#### Step 1: Create EC2 Instance with User Data
```bash
# Use ec2-init.sh as user data script
```

#### Step 2: Access EC2 Instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip

# First time setup
bash /tmp/aws-init.sh
```

#### Step 3: Deploy Application
```bash
# Using deployment script
scp -i your-key.pem scripts/deploy.sh ubuntu@your-ec2-ip:/home/ubuntu/
ssh -i your-key.pem ubuntu@your-ec2-ip 'bash /home/ubuntu/deploy.sh'
```

#### Step 4: Configure Database
```bash
# For RDS PostgreSQL (recommended for production)
# 1. Create RDS instance via AWS Console
# 2. Update environment variables in EC2:

export SPRING_DATASOURCE_URL=jdbc:postgresql://rds-endpoint:5432/comp4442_db
export SPRING_DATASOURCE_USERNAME=your-db-user
export SPRING_DATASOURCE_PASSWORD=your-db-password

# Restart application
sudo systemctl restart comp4442.service
```

### 7. Git Workflow

#### Create feature branch
```bash
git checkout -b feature/your-feature-name
```

#### Make changes and commit
```bash
git add .
git commit -m "feat: add new service registry feature"
::
git push origin feature/your-feature-name
```

#### Create pull request on GitHub
- Go to repository on GitHub
- Create PR from your feature branch to main
- Request review

#### Merge to main (after review)
```bash
git checkout main
git pull origin main
git merge feature/your-feature-name
git push origin main
```

### 8. Testing

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=ServiceRegistryControllerTest

# Run with coverage
mvn test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

### 9. Troubleshooting

#### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>

# Or change port in application.yml
```

#### Database Connection Issues
```bash
# Verify database credentials in application.properties or environment variables
# Check H2 console access when running in dev profile
```

#### Application Won't Start
```bash
# Check Maven build
mvn clean compile

# Run with debug logging
export LOGGING_LEVEL_ROOT=DEBUG
mvn spring-boot:run
```

#### Out of Memory
```bash
# Increase JVM memory
export JAVA_OPTS="-Xmx1g -Xms512m"
./scripts/start-dev.sh
```

### 10. Development Tips

**Avoid Common Mistakes:**
- ✅ Always create feature branches
- ✅ Write meaningful commit messages
- ✅ Test locally before pushing
- ✅ Pull before pushing to avoid conflicts
- ✅ Keep sensitive data in environment variables, not in code
- ❌ Don't commit credentials or .env files
- ❌ Don't push directly to main branch
- ❌ Don't ignore test failures

**Best Practices:**
- Commit frequently with clear messages
- Create pull requests for code review
- Update documentation with changes
- Test new features thoroughly
- Monitor logs for errors
- Keep dependencies updated

### 11. Performance Optimization

```bash
# Monitor application
curl http://localhost:8080/actuator/metrics

# Check specific metrics
curl http://localhost:8080/actuator/metrics/jvm.memory.used

# Database query optimization - enable SQL logging
export LOGGING_LEVEL_ORG_HIBERNATE_SQL=DEBUG
export LOGGING_LEVEL_ORG_HIBERNATE_TYPE_DESCRIPTOR_SQL_BASICBINDER=TRACE
```

---

## Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [AWS EC2 Guide](https://docs.aws.amazon.com/ec2/)
- [Maven Documentation](https://maven.apache.org/guides/)
- [Git Handbook](https://git-scm.com/book)

---

For questions or issues, contact the development team or create an issue on GitHub.
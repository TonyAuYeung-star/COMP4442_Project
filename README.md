# COMP4442_Project - Spring Boot Microservice on AWS EC2

## 📋 Project Overview

A production-ready **Spring Boot microservice** implementing a **Service Registry** for service discovery and management, deployed on **AWS EC2** with Docker containerization.

**Course:** COMP4442 - Service Computing
**Team Role:** Backend Development
**Deployment Platform:** AWS EC2, EBS, Docker

---

## 🏗️ Architecture

### Project Structure
```
COMP4442_Project/
├── src/
│   ├── main/
│   │   ├── java/com/comp4442/
│   │   │   ├── controller/          # REST API endpoints
│   │   │   ├── service/             # Business logic
│   │   │   ├── repository/          # Data access layer
│   │   │   ├── model/
│   │   │   │   ├── entity/          # JPA entities
│   │   │   │   └── dto/             # Data transfer objects
│   │   │   ├── config/              # Spring configuration
│   │   │   ├── exception/           # Error handling
│   │   │   └── ServiceComputingApplication.java
│   │   └── resources/
│   │       └── application.yml      # Configuration
│   └── test/                        # Unit & Integration tests
├── scripts/
│   ├── deploy.sh                    # Deployment script
│   └── start-dev.sh                 # Development starter
├── Dockerfile                       # Multi-stage Docker build
├── docker-compose.yml               # Local development setup
├── pom.xml                          # Maven configuration
└── README.md
```

---

## 🚀 Key Features

### 1. **Microservice Registry** (Service Discovery)
- Register/deregister microservices
- Service health status tracking
- Service instance management
- Load balancing support

### 2. **RESTful API**
- CRUD operations for services
- Service lookup by name, ID, or status
- Comprehensive error handling
- Standardized response format

### 3. **Database Layer**
- JPA/Hibernate ORM
- PostgreSQL for production
- H2 in-memory for development/testing
- Soft delete implementation
- Audit timestamps (createdAt, updatedAt)

### 4. **Production-Ready Features**
- Centralized exception handling
- Structured logging (SLF4J + Logback)
- Health check endpoints
- Application metrics via Spring Actuator
- Database connection pooling (HikariCP)
- Input validation

### 5. **Deployment & DevOps**
- Multi-stage Docker build
- Docker Compose setup (backend + PostgreSQL)
- Automated deployment scripts
- Health checks configured
- Environment-based configuration

---

## 🛠️ Technologies Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Java | 17 LTS |
| **Framework** | Spring Boot | 3.2.0 |
| **ORM** | Spring Data JPA | Hibernate |
| **Database** | PostgreSQL / H2 | 15 / Latest |
| **Container** | Docker | Latest |
| **Build** | Maven | 3.9+ |
| **Logging** | SLF4J + Logback | --  |
| **Testing** | JUnit 5, MockMvc | --   |

---

## 📦 Getting Started

### Prerequisites
- Java 17+
- Maven 3.9+
- Docker & Docker Compose
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd COMP4442_Project
```

### 2. Local Development
```bash
# Start with Docker Compose (recommended)
docker-compose up -d

# Or run with Maven
mvn clean install
./scripts/start-dev.sh
```

### 3. Build & Deploy

#### Docker Build
```bash
docker build -t comp4442-service:latest .
docker run -d -p 8080:8080 comp4442-service:latest
```

#### Deployment Script
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

#### Push to AWS ECR
```bash
ECR_URI=<your-ecr-uri> ./scripts/deploy.sh
```

---

## 📡 API Endpoints

### Base URL: `http://localhost:8080/api`

#### Service Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/services` | Register new service |
| GET | `/v1/services` | Get all services |
| GET | `/v1/services/{id}` | Get service by ID |
| POST | `/v1/services/query/by-name` | Query service by name (JSON body) |
| POST | `/v1/services/query/by-status` | Filter by status (JSON body) |
| PUT | `/v1/services/{id}` | Update service |
| DELETE | `/v1/services/{id}` | Delete service |

#### Health & Info
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/health` | Health check |
| GET | `/v1/info` | Application info |

### Example Requests

#### Register a Service
```bash
curl -X POST http://localhost:8080/api/v1/services \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "auth-service",
    "host": "auth.example.com",
    "port": 8081,
    "description": "Authentication microservice",
    "healthCheckUrl": "/health",
    "version": "1.0.0"
  }'
```

#### Get All Services
```bash
curl http://localhost:8080/api/v1/services
```

#### Health Check
```bash
curl http://localhost:8080/api/v1/health
```

---

## 🗄️ Database Schema

### Services Table
```sql
CREATE TABLE services (
    id BIGINT PRIMARY KEY,
    service_name VARCHAR(255) UNIQUE NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INT NOT NULL,
    status VARCHAR(50),
    description TEXT,
    health_check_url VARCHAR(255),
    version VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN
);
```

### Service Instances Table
```sql
CREATE TABLE service_instances (
    id BIGINT PRIMARY KEY,
    service_id BIGINT NOT NULL REFERENCES services(id),
    instance_id VARCHAR(255),
    hostname VARCHAR(255) NOT NULL,
    port INT NOT NULL,
    status VARCHAR(50),
    heartbeat_time BIGINT,
    metadata TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN
);
```

---

## 🧪 Testing

### Run Tests
```bash
mvn test
```

### Test Coverage
- Unit tests for services
- Integration tests for controllers
- Repository tests
- Exception handling tests

---

## 📋 Configuration

### Development (`application-dev.yml`)
- H2 in-memory database
- SQL logging enabled
- DEBUG level logging

### Production (`application-prod.yml`)
- PostgreSQL database
- Connection pooling optimized
- INFO level logging
- File-based logging with rotation

### Environment Variables
```bash
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/comp4442_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=secure_password
JAVA_OPTS=-Xmx1g -Xms512m
```

---

## 🚀 AWS EC2 Deployment

### 1. Launch EC2 Instance
```bash
# The EC2 user data script (ec2-init.sh) will:
# - Install Java 17
# - Create application directory
# - Configure logging
```

### 2. Deploy Application
```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Pull Docker image from ECR
aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin <ECR-URI>

docker pull <ECR-URI>/comp4442-service:latest

# Run containers
docker run -d \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/comp4442_db \
  <ECR-URI>/comp4442-service:latest
```

### 3. Setup RDS (Optional)
```bash
# Create RDS PostgreSQL instance
# Update SPRING_DATASOURCE_URL to RDS endpoint
```

### 4. Configure EBS Volume
```bash
# Mount EBS for persistent data/logs
sudo mkfs.ext4 /dev/nvme1n1
sudo mkdir -p /mnt/data
sudo mount /dev/nvme1n1 /mnt/data
```

---

## 📊 Monitoring & Logging

### Application Logs
```bash
# View logs from container
docker logs -f comp4442-backend

# Access H2 Console (dev)
http://localhost:8080/h2-console

# Spring Boot Actuator Metrics
http://localhost:8080/actuator/metrics
```

### Health Checks
```bash
# Application health
http://localhost:8080/api/v1/health

# Spring Actuator health
http://localhost:8080/actuator/health
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

Example workflow for automated testing and deployment:

```yaml
name: Build & Deploy

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Java
        uses: actions/setup-java@v2
        with:
          java-version: '17'
      - name: Build with Maven
        run: mvn clean package
      - name: Build Docker
        run: docker build -t comp4442-service .
```

---

## 📝 Development Trace (Git Commits)

This project maintains a comprehensive development history on GitHub:

- Initial project setup
- Database schema design
- API endpoint implementation
- Docker configuration
- Deployment scripts
- Testing implementation
- Documentation

**Access:** [GitHub Repository](https://github.com/your-username/COMP4442_Project)

---

## 🤝 Sharing with Teacher

**Important:** Ensure the GitHub repository is shared with:
- **Email:** csqwang@polyu.edu.hk
- **Title:** "Comp4442 [Your ID] [Your Name] Backend Repository"
- **Access Level:** Read access for evaluation

---

## 🐛 Troubleshooting

### Application won't start
```bash
# Check logs
docker logs comp4442-backend

# Verify database connection
curl -i http://localhost:8080/api/v1/health
```

### Database connection issues
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Verify connection
psql -h localhost -U comp4442_user -d comp4442_db
```

### Port conflicts
```bash
# Find process using port 8080
lsof -i :8080

# Change port in docker-compose.yml or application.yml
```

---

## 📚 References

- [Spring Boot Official Docs](https://spring.io/projects/spring-boot)
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [AWS EC2 Guide](https://docs.aws.amazon.com/ec2/)

---

## 📄 License

This project is for educational purposes as part of COMP4442 at PolyU.

---

## 👤 Author

**Tony**
COMP4442 Semester Project - Backend Development

---

Last Updated: 2026-04-15
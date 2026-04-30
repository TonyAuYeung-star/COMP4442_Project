# COMP4442_Project - Spring Boot Microservice + React Frontend on AWS EC2

## 📋 Project Overview

A full stack **Spring Boot microservice** implementing a **Service Registry** for service discovery and management, with React frontend interface, deployed on **AWS EC2** with Docker containerization.

**Course:** COMP4442 - Service Computing
**Team Role:** Full Stack Development
**Deployment Platform:** AWS EC2, EBS, Docker

---

## 🏗️ Architecture

### Actual Project Structure
```
COMP4442_Project-main/
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
├── frontend/
│   ├── src/                         # React frontend source code
│   ├── public/                      # Static assets
│   ├── index.html                   # Frontend entry point
│   ├── package.json                 # NPM dependencies
│   ├── vite.config.js               # Vite build configuration
│   ├── eslint.config.js             # ESLint configuration
│   └── README.md                    # Frontend documentation
├── scripts/
│   ├── deploy.sh                    # Deployment script
│   └── start-dev.sh                 # Development starter
├── Dockerfile                       # Multi-stage Docker build
├── docker-compose.yml               # Local development setup
├── pom.xml                          # Maven backend configuration
├── ec2-init.sh                      # AWS EC2 initialization script
├── postman-collection.json          # API testing collection
├── SETUP.md                         # Installation & setup guide
├── .gitignore
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

### 3. **React Frontend Interface**
- Modern responsive UI for service management
- Real-time service status dashboard
- Service registration forms
- Health monitoring visualizations
- Built with Vite + React

### 4. **Database Layer**
- JPA/Hibernate ORM
- PostgreSQL for production
- H2 in-memory for development/testing
- Soft delete implementation
- Audit timestamps (createdAt, updatedAt)

### 5. **Production-Ready Features**
- Centralized exception handling
- Structured logging (SLF4J + Logback)
- Health check endpoints
- Application metrics via Spring Actuator
- Database connection pooling (HikariCP)
- Input validation

### 6. **Deployment & DevOps**
- Multi-stage Docker build
- Docker Compose setup (backend + frontend + PostgreSQL)
- Automated deployment scripts
- AWS EC2 initialization script
- Health checks configured
- Environment-based configuration
- Postman API collection included

---

## 🛠️ Technologies Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Java | 17 LTS |
| **Framework** | Spring Boot | 3.2.0 |
| **ORM** | Spring Data JPA | Hibernate |
| **Database** | PostgreSQL / H2 | 15 / Latest |
| **Frontend** | React + Vite | Latest |
| **Container** | Docker | Latest |
| **Build Backend** | Maven | 3.9+ |
| **Build Frontend** | NPM | Latest |
| **Logging** | SLF4J + Logback | --  |
| **Testing** | JUnit 5, MockMvc | --   |

---

## 📦 Getting Started

### Prerequisites
- Java 17+
- Maven 3.9+
- Node.js 18+ & NPM
- Docker & Docker Compose
- Git

### 1. Clone Repository
```bash
git clone https://github.com/TonyAuYeung-star/COMP4442_Project.git
cd COMP4442_Project-main
```

### 2. Local Development
```bash
# Full stack with Docker Compose (recommended)
docker-compose up -d

# Or run backend separately
mvn clean install
./scripts/start-dev.sh

# Or run frontend separately
cd frontend
npm install
npm run dev
```

### 3. Build & Deploy

#### Full Docker Build
```bash
# Build backend
docker build -t comp4442-service:latest .

# Build frontend
cd frontend
docker build -t comp4442-frontend:latest .
```

#### Deployment Script
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

#### AWS EC2 Deployment
Use included EC2 initialization script for server setup:
```bash
# ec2-init.sh automatically:
# - Install Java 17
# - Install Docker & Docker Compose
# - Create application directory
# - Configure logging & system services
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

### Frontend
| Environment | URL |
|-------------|-----|
| Development | `http://localhost:5173` |
| Production | `http://your-ec2-ip` |

### API Testing
Import `postman-collection.json` into Postman for pre-configured API requests.

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

### Backend Tests
```bash
mvn test
```

### Frontend Tests
```bash
cd frontend
npm run test
```

### Test Coverage
- Unit tests for backend services
- Integration tests for controllers
- Repository layer tests
- Exception handling tests

---

## 📋 Configuration

Complete setup instructions available in `SETUP.md`

### Development
- H2 in-memory database
- SQL logging enabled
- DEBUG level logging
- Frontend hot reload enabled

### Production
- PostgreSQL database
- Connection pooling optimized
- INFO level logging
- File-based logging with rotation
- Frontend production build

---

## 🚀 AWS EC2 Deployment

### 1. Launch EC2 Instance
Use `ec2-init.sh` as EC2 user data script during instance launch to automatically configure the server environment.

### 2. Deploy Application
```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Clone repository
git clone https://github.com/TonyAuYeung-star/COMP4442_Project.git

# Start full stack
docker-compose up -d
```

### 3. Setup EBS Volume
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
# View backend logs
docker logs -f comp4442-backend

# View frontend logs
docker logs -f comp4442-frontend
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
      - name: Build Backend
        run: mvn clean package
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Build Frontend
        run: cd frontend && npm install && npm run build
      - name: Build Docker Images
        run: docker-compose build
```

---

## 📝 Development Trace (Git Commits)

This project maintains a comprehensive development history on GitHub:

- Initial backend project setup
- Database schema design
- API endpoint implementation
- Docker configuration
- Deployment scripts
- Frontend implementation
- Testing implementation
- Documentation

**Repository:** https://github.com/TonyAuYeung-star/COMP4442_Project

---

## 🤝 Sharing with Teacher

**Important:** Ensure the GitHub repository is shared with:
- **Email:** csqwang@polyu.edu.hk
- **Title:** "Comp4442 [Your ID] [Your Name] Full Stack Repository"
- **Access Level:** Read access for evaluation

---

## 🐛 Troubleshooting

### Backend issues
```bash
# Check backend logs
docker logs comp4442-backend

# Verify database connection
curl -i http://localhost:8080/api/v1/health
```

### Frontend issues
```bash
# Check frontend logs
docker logs comp4442-frontend

# Verify frontend is running
curl -i http://localhost:5173
```

### Database connection issues
```bash
# Check PostgreSQL is running
docker ps | grep postgres
```

### Port conflicts
```bash
# Find process using port
netstat -ano | findstr :8080
netstat -ano | findstr :5173
```

---

## 📚 References

- [Spring Boot Official Docs](https://spring.io/projects/spring-boot)
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa)
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [AWS EC2 Guide](https://docs.aws.amazon.com/ec2/)

---

## 📄 License

This project is for educational purposes as part of COMP4442 at PolyU.

---

## 👤 Author

**Tony**
COMP4442 Semester Project - Full Stack Development

---

Last Updated: 2026-04-27
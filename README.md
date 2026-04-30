# COMP4442_Project - Hotel Room Booking System

## 📋 Project Overview

A production-ready **Hotel Room Booking System** built with Spring Boot Backend and React Frontend, deployed on **AWS EC2**. This project implements complete service computing architecture including JWT authentication, booking management and payment processing.

**Course:** COMP4442 - Service Computing
**Type:** Semester Group Project
**Deployment Platform:** AWS EC2

---

## 🏗️ Architecture

### Actual Project Structure
```
COMP4442_Project/
├── 📂 src/                            # BACKEND - Spring Boot
│   ├── main/
│   │   ├── java/com/comp4442/
│   │   │   ├── ServiceComputingApplication.java
│   │   │   ├── 📂 config/
│   │   │   │   ├── ApplicationConfig.java
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── JwtUtil.java
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   └── DataLoader.java
│   │   │   ├── 📂 controller/          # REST API Endpoints
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── BookingController.java
│   │   │   │   ├── RoomController.java
│   │   │   │   ├── PaymentController.java
│   │   │   │   ├── AdminController.java
│   │   │   │   └── HealthCheckController.java
│   │   │   ├── 📂 service/             # Business Logic Layer
│   │   │   │   ├── AuthService.java
│   │   │   │   ├── BookingService.java
│   │   │   │   ├── RoomService.java
│   │   │   │   └── PaymentService.java
│   │   │   ├── 📂 repository/          # Data Access Layer
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── RoomRepository.java
│   │   │   │   ├── BookingRepository.java
│   │   │   │   ├── PaymentRepository.java
│   │   │   │   └── UserRepository.java
│   │   │   ├── 📂 model/
│   │   │   │   ├── 📂 entity/          # Database Entities
│   │   │   │   └── 📂 dto/             # Data Transfer Objects
│   │   │   └── 📂 exception/           # Global Exception Handling
│   │   │       ├── GlobalExceptionHandler.java
│   │   │       ├── ResourceNotFoundException.java
│   │   │       ├── RoomNotAvailableException.java
│   │   │       └── UnauthorizedException.java
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       └── static/
│   └── test/                            # Unit & Integration Tests
│
├── 📂 frontend/                        # FRONTEND - React
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── assets/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── eslint.config.js
│
├── ec2-init.sh                         # AWS EC2 Initialization Script
├── pom.xml                             # Maven Backend Configuration
├── postman-collection.json             # Complete API Test Collection
├── SETUP.md                            # Setup Guide
├── README.md                           # This file
└── test.md                             # Testing Guide
```

---

## 🚀 Key Features

### 1. **Hotel Booking Management**
- Room availability checking & real-time booking
- Booking expiration handling
- Customer reservation lifecycle management
- Room inventory management

### 2. **Authentication & Security**
- JWT stateless authentication
- Role based access control (User / Admin)
- Password encryption with BCrypt
- Secured API endpoints
- Request validation

### 3. **Payment Processing System**
- Mock payment gateway integration
- Payment transaction tracking
- Payment status management
- Transaction audit logging

### 4. **RESTful API Architecture**
- Standardized JSON response format
- Global exception handling
- Proper HTTP status codes
- Multi-environment configuration
- Database connection pooling

### 5. **Full Stack Implementation**
- Modern React Frontend with Vite
- Responsive user interface
- Separate frontend / backend layers
- CORS configuration

---

## 🛠️ Technologies Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend Runtime** | Java | 17 LTS |
| **Framework** | Spring Boot | 3.2.x |
| **Security** | Spring Security + JWT | -- |
| **ORM** | Spring Data JPA | -- |
| **Database** | H2 (Dev) / PostgreSQL (Prod) | -- |
| **Build Tool** | Maven | 3.9+ |
| **Frontend Framework** | React | 18 |
| **Frontend Build** | Vite | 5.x |
| **Deployment** | AWS EC2 | -- |
| **Logging** | SLF4J + Logback | -- |
| **Testing** | JUnit 5 | -- |

---

## 📦 Getting Started

### Prerequisites
- Java 17+
- Maven 3.9+
- Node.js 20+ & npm
- Git

### 1. Clone Repository
```bash
git clone https://github.com/TonyAuYeung-star/COMP4442_Project.git
cd COMP4442_Project
```

### 2. Backend Setup
```bash
# Build Backend
mvn clean install

# Run Backend Development Server
mvn spring-boot:run

# Backend will start on http://localhost:8080
```

### 3. Frontend Setup
```bash
cd frontend

# Install Dependencies
npm install

# Run Frontend Development Server
npm run dev

# Frontend will start on http://localhost:5173
```

---

## 📡 API Endpoints

### Base URL: `http://localhost:8080/api`

#### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | User Registration | ❌ |
| POST | `/auth/login` | User Login & Get JWT | ❌ |

#### Room Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/rooms` | List all available rooms | ❌ |
| GET | `/rooms/{id}` | Get room details | ❌ |
| POST | `/rooms` | Create new room | ✅ Admin |
| PUT | `/rooms/{id}` | Update room information | ✅ Admin |
| DELETE | `/rooms/{id}` | Delete room | ✅ Admin |

#### Booking Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/bookings` | Create new booking | ✅ User |
| GET | `/bookings` | Get user bookings | ✅ User |
| GET | `/bookings/{id}` | Get booking details | ✅ User |
| DELETE | `/bookings/{id}` | Cancel booking | ✅ User |

#### Payment System
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/payments` | Process payment | ✅ User |
| GET | `/payments/{bookingId}` | Get payment status | ✅ User |

---

## 📋 Configuration

### Environment Profiles
This application supports multi-environment configuration:

| Profile | Description | Database |
|---------|-------------|----------|
| `dev` | Development Mode | H2 In-Memory Database |
| `prod` | Production Mode | PostgreSQL Database |

### Active Profile Selection
```bash
# Development (default)
mvn spring-boot:run

# Production
mvn spring-boot:run -Dspring.profiles.active=prod
```

---

## 🚀 AWS EC2 Deployment

### EC2 Instance Setup
The project includes `ec2-init.sh` script that automatically configures EC2 instance:
1. Install Java 17 Runtime
2. Configure systemd service
3. Setup application directories
4. Configure log rotation
5. Open required firewall ports

### Deployment Steps
```bash
# 1. Upload jar file to EC2
scp target/comp4442-project.jar ec2-user@<EC2_IP>:/home/ec2-user/

# 2. SSH into EC2 instance
ssh -i key.pem ec2-user@<EC2_IP>

# 3. Start application
java -jar comp4442-project.jar --spring.profiles.active=prod
```

---

## 🧪 Testing

### Health Check
```bash
# Run all tests
mvn test
```

### Application Info
```bash
curl http://localhost:8080/api/v1/info
```

### API Testing
Import `postman-collection.json` into Postman for complete API testing including:
- All endpoint test cases
- Authentication workflow
- Booking scenario tests
- Service registry tests

---


### Application Health
```bash
# Check application status
curl http://localhost:8080/api/health

# View registered services
curl http://localhost:8080/api/services
```

---

## 🤝 Course Submission

This project is submitted for COMP4442 Service Computing course evaluation at The Hong Kong Polytechnic University.

✅ Backend Architecture
✅ REST API Design
✅ Security Implementation
✅ Service Registry Pattern
✅ Deployment Configuration
✅ Complete Documentation

---

## 📄 License

This project is for educational purposes as part of COMP4442 curriculum at PolyU.

---

## 👤 Author

**Tony** & **Harry** & **Kim**
COMP4442 Semester Project - Backend Development

---

Last Updated: 2026-04-29

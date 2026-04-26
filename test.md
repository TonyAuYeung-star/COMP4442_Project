COMP4442_Project-main/
├── pom.xml                          # Maven dependencies & build config
├── src/
│   └── main/
│       ├── java/com/comp4442/
│       │   ├── config/              # Security, JWT, CORS config
│       │   ├── controller/          # REST API endpoints
│       │   │   ├── AdminController.java      # ✅ Admin management API
│       │   │   ├── AuthController.java       # Login/Register
│       │   │   ├── BookingController.java    # User booking API
│       │   │   └── RoomController.java       # Room search API
│       │   ├── exception/           # Custom exception handling
│       │   ├── model/               # Data models & DTOs
│       │   │   ├── dto/             # Data Transfer Objects
│       │   │   └── entity/          # Database entities
│       │   │       ├── Booking.java
│       │   │       ├── BookingStatus.java     # ✅ ENUM PENDING/CONFIRMED/CANCELLED/COMPLETED
│       │   │       ├── Room.java
│       │   │       └── User.java
│       │   ├── repository/          # Spring Data JPA repositories
│       │   │   ├── BookingRepository.java     # ✅ Fixed enum query bug
│       │   │   ├── RoomRepository.java
│       │   │   └── UserRepository.java
│       │   └── service/             # Business logic layer
│       │       ├── BookingService.java        # ✅ Admin cancel/edit booking
│       │       └── RoomService.java           # ✅ Fixed room delete error
│       └── resources/
│           ├── static/
│           │   └── index.html                # ✅ Frontend SPA with all UI
│           └── application.properties        # Database & server config
└── target/                             # Compiled output


Hotel Room Booking System 已根據 suggestion.md 完整實現！Port 8080 已清理，現在可以啟動測試。

## 🚀 啟動應用
Clean the project:
```bash
`mvn clean`
```

```bash
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
```
應用會在 `http://localhost:8080/api` 啟動，使用 H2 內存數據庫。

## 🧪 API 測試範例

### 公共端點（無需認證）
```bash
# Health Check
curl http://localhost:8080/api/v1/health

# 查看所有房間
curl http://localhost:8080/api/v1/rooms

# 搜尋房間
curl -X POST http://localhost:8080/api/v1/rooms/search \
  -H "Content-Type: application/json" \
  -d '{"type":"Deluxe","capacity":2,"minPrice":100,"maxPrice":500}'

# 檢查房間可用性
curl -X POST http://localhost:8080/api/v1/rooms/availability \
  -H "Content-Type: application/json" \
  -d '{"roomId":1,"checkIn":"2026-05-01","checkOut":"2026-05-05"}'
```

### 認證相關
```bash
# 註冊
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# 登入（回應包含 JWT token）
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

### 需認證端點（帶 Authorization: Bearer <token>）
```bash
# 創建預訂
curl -X POST http://localhost:8080/api/v1/bookings/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <你的Token>" \
  -d '{"roomId":1,"checkIn":"2026-05-01","checkOut":"2026-05-05"}'

# 查看我的預訂歷史
curl http://localhost:8080/api/v1/bookings/history \
  -H "Authorization: Bearer <你的Token>"

# 取消預訂
curl -X POST http://localhost:8080/api/v1/bookings/1/cancel \
  -H "Authorization: Bearer <你的Token>"
```

### 管理員端點
```bash
# 查看所有預訂（需 ADMIN 角色）
curl http://localhost:8080/api/v1/admin/bookings/all \
  -H "Authorization: Bearer <AdminToken>"
```

### 支付（Stripe）
```bash
# 創建 PaymentIntent
curl -X POST http://localhost:8080/api/v1/payments/stripe/intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <你的Token>" \
  -d '{"bookingId":1}'

# 確認支付
curl -X POST http://localhost:8080/api/v1/payments/stripe/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <你的Token>" \
  -d '{"paymentIntentId":"pi_xxx"}'
```

## 🔑 核心設計（課程重點）
- **防止 Double Booking**: `BookingService.createBooking()` 使用 `@Transactional` + `synchronized`
- **衝突檢測**: `BookingRepository.countConflicting()` 查詢重疊日期
- **密碼安全**: BCrypt 加密
- **JWT 認證**: Token-based 認證
- **Stripe 支付**: PaymentIntent 整合
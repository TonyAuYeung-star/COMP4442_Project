## 你的專案現況分析

根據對你 repo 的詳細審查，以下是我的發現與後續實作建議：

***

## 目前已完成的部分

你的專案目前建立了一個 **通用 Service Registry 骨架**，而非 Hotel Room Booking System：[^1]


| 已完成 | 內容 |
| :-- | :-- |
| **Controller 層** | `ServiceRegistryController`、`ServiceInstanceController`、`HealthCheckController` |
| **Model 層** | `Service.java`、`ServiceInstance.java`、`BaseEntity.java`（JPA entities），以及 `dto/` 下的 DTO |
| **Service 層** | `ServiceRegistry` service（CRUD + 狀態查詢） |
| **Config** | `application-dev.yml`（H2）、`application-prod.yml`（PostgreSQL）、`application.yml` |
| **DB** | `services` 和 `service_instances` 兩張表（與 hotel 完全無關） |
| **部署** | `ec2-init.sh`、Docker + Docker Compose、ECR push 腳本 |
| **依賴** | Spring Web、JPA、Validation、Actuator、PostgreSQL、H2、Lombok[^2] |


***

## 核心問題：需要大幅改造

你現在的 code 是一個 **微服務發現系統（Eureka-like）**，而不是 Hotel Booking System。你需要將整個業務邏輯層替換掉，但可以**保留現有的基礎設施和框架結構**（Docker、EC2、配置、JPA 架構等）。

***

## 下一步：需要新增的所有 Java 檔案

### Phase 1 — 替換 Model / Entity（最優先）

刪除 `Service.java` / `ServiceInstance.java`，建立以下 4 個 hotel entity：

```
model/entity/
├── User.java           // @Entity, id, username, email, passwordHash, role(ENUM)
├── Room.java           // @Entity, id, name, type, capacity, pricePerNight, amenities, imageUrl, isAvailable
├── Booking.java        // @Entity, id, userId, roomId, checkIn, checkOut, totalPrice, status(ENUM)
└── Payment.java        // @Entity, id, bookingId, stripeIntentId, amount, status(ENUM)
```

對應的 DTO 也要一起更新：

```
model/dto/
├── UserDTO.java / UserResponseDTO.java
├── RoomDTO.java / RoomSearchRequest.java
├── BookingDTO.java / BookingCreateRequest.java
├── AvailabilityRequest.java   // { roomId, checkIn, checkOut }
└── PaymentDTO.java
```


### Phase 2 — 替換 Repository

```
repository/
├── UserRepository.java         // extends JpaRepository<User, Long>
├── RoomRepository.java         // + custom @Query for filter search
├── BookingRepository.java      // + countConflicting() query
└── PaymentRepository.java
```

`BookingRepository` 中最關鍵的自訂查詢（防止 double booking）：

```java
@Query("SELECT COUNT(b) FROM Booking b WHERE b.room.id = :roomId " +
       "AND b.status != 'CANCELLED' " +
       "AND NOT (b.checkOut <= :checkIn OR b.checkIn >= :checkOut)")
int countConflicting(@Param("roomId") Long roomId,
                     @Param("checkIn") LocalDate checkIn,
                     @Param("checkOut") LocalDate checkOut);
```


### Phase 3 — 替換 Service 層

```
service/
├── AuthService.java        // register, login (用 BCrypt hash 密碼)
├── RoomService.java        // search with filters, checkAvailability (synchronized!)
├── BookingService.java     // createBooking 用 @Transactional，cancelBooking
└── PaymentService.java     // Stripe PaymentIntent creation/confirmation
```

`BookingService.createBooking()` 必須加上 `@Transactional` + `synchronized`：

```java
@Transactional
public synchronized BookingDTO createBooking(BookingCreateRequest req) {
    // 1. 先 check availability
    int conflicts = bookingRepo.countConflicting(...);
    if (conflicts > 0) throw new RoomNotAvailableException();
    // 2. 原子寫入 Booking + Payment
}
```


### Phase 4 — 替換 Controller 層

刪除現有 3 個 controller，建立以下 4 個：

```
controller/
├── AuthController.java         // POST /api/auth/register, /api/auth/login
├── RoomController.java         // GET /api/rooms/search, GET /api/rooms/{id}, POST /api/rooms/availability
├── BookingController.java      // POST /api/bookings/create, GET /api/bookings/history, POST /api/bookings/{id}/cancel
├── AdminController.java        // POST/PUT/DELETE /api/admin/rooms/**, GET /api/admin/bookings/all
└── PaymentController.java      // POST /api/payments/stripe/intent, /confirm
```


***

## Phase 5 — 新增需要的依賴（pom.xml）

你現在的 `pom.xml` **缺少** 以下關鍵依賴，需要補充：[^2]

```xml
<!-- JWT Authentication -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.3</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.3</version>
</dependency>

<!-- Spring Security (for BCrypt + JWT filter) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- Stripe Payment SDK -->
<dependency>
    <groupId>com.stripe</groupId>
    <artifactId>stripe-java</artifactId>
    <version>25.3.0</version>
</dependency>
```


***

## Phase 6 — 更新 application.yml

在 `application-prod.yml` 中補充：

```yaml
# Stripe
stripe:
  secret-key: ${STRIPE_SECRET_KEY}

# JWT
jwt:
  secret: ${JWT_SECRET}
  expiration: 86400000  # 24h in ms

# DB table auto creation
spring:
  jpa:
    hibernate:
      ddl-auto: update   # 改為 validate 在 prod 穩定後
```


***

## 可以直接保留不動的部分

以下現有設施完全可以沿用，**不需要改動**：


| 保留項目 | 原因 |
| :-- | :-- |
| `BaseEntity.java` | `createdAt`/`updatedAt`/`isDeleted` 全部 hotel entity 都可以繼承 |
| `GlobalExceptionHandler.java`（exception/） | 通用的 exception 處理邏輯不變 |
| `ApiResponse.java`（dto/） | 統一 response wrapper 格式保留 |
| `application-dev.yml` 的 H2 設定 | 本地測試繼續用 H2 |
| Docker / `ec2-init.sh` / GitHub Actions | 部署基礎設施完全不需要修改 |
| `HealthCheckController.java` | 保留作為 `/api/v1/health` endpoint |
| `pom.xml` 的 JPA / Actuator / Validation | 這些依賴繼續需要 |


***

## 建議的開發順序

```
Week 1: Entity + Repository + DB schema (User, Room, Booking, Payment)
Week 2: Service 層 (Auth + Room search + Booking transaction logic)
Week 3: Controller 層 + JWT filter + Admin endpoints
Week 4: Stripe 整合 + 前端 API 連接測試
Week 5: EC2 部署 + EBS volume 掛載 + 壓力測試
```

最重要的里程碑是 **Booking + Payment 的 `@Transactional` + `synchronized`** 邏輯，這是課程重點，也是 double-booking 防止的核心，教授一定會重點關注這裡。

<div align="center">⁂</div>

[^1]: https://github.com/TonyAuYeung-star/COMP4442_Project/tree/main/src/main/java/com/comp4442

[^2]: https://github.com/TonyAuYeung-star/COMP4442_Project/blob/main/pom.xml


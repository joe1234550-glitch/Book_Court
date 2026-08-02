 #🎾 網球預約系統（Tennis Court Booking System）

> **這個模板幫你把最麻煩的都打通了**：JWT 註冊／登入／refresh／登出、Spring Security 設定、Flyway、PostgreSQL 連線。
> **你要做的只有一件事：專注在你自己的業務功能** —— 設計 Schema、寫 Entity / Repository / Service / Controller，最後把 API 路徑加進 SecurityConfig。

技術棧（跟課程一致，不要自己改版本）：**Java 25 · Spring Boot 4.0.6 · PostgreSQL 15 · Flyway · Spring Security 7 · jjwt 0.12.6 · Lombok**

---

## ⚡ 第一次啟動（5 分鐘）

### 1. 準備資料庫（PostgreSQL 容器）

```bash
# 已經有課程的 my_postgres 容器就跳過這步
docker run -d --name my_postgres \
  -e POSTGRES_PASSWORD=my_secret_password \
  -p 5433:5432 postgres:15

# 建立這個專案用的資料庫
docker exec my_postgres psql -U postgres -c "CREATE DATABASE starter_db;"
```

### 2. 啟動專案

```bash
./mvnw spring-boot:run
```

看到 `Started StarterApplication` 就成功了。Flyway 會自動建好認證相關的表（users / roles / permissions / refresh_tokens）。

### 3. 驗證 JWT 有通（照順序執行）

```bash
# ① 註冊 → 201
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test1","email":"test1@example.com","password":"password123"}'

# ② 登入 → 200，拿到 accessToken 和 refreshToken
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test1","password":"password123"}'

# ③ 查詢所有球場列表 (公開 API) → 200
#    （把 <TOKEN> 換成上一步的 accessToken）
curl http://localhost:8080/api/v1/courts

# ④ 新增場地預約 (帶 Token) → 201 Created
# （請將 <TOKEN> 換成登入時取得的 accessToken）
curl -X POST http://localhost:8080/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "courtId": 1,
    "startTime": "2026-08-01T10:00:00",
    "endTime": "2026-08-01T12:00:00"
  }'
  
  # 5. 查詢個人的預約紀錄 → 200
curl http://localhost:8080/api/v1/bookings/my \
  -H "Authorization: Bearer <TOKEN>"
  
  # 6. 一般會員存取管理員 API → 403 Forbidden（證明權限控管有效）
curl -X PATCH http://localhost:8080/api/v1/admin/courts/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"hourlyRate": 600}'
```

六步全過 = 模板正常，開始做你的功能。

---

## 📁 專案結構（✅ 已打通不用動；✏️ 你要寫的）

```
project-template/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/
│       │       └── template/
│       │           ├── StarterApplication.java        ✅ 系統進入點 (原 Main.java)
│       │           │
│       │           ├── config/
│       │           │   ├── SecurityConfig.java        ✏️ API 存取權限規則配置 (原 Admin/User 權限分流)
│       │           │   └── DatabaseConfig.java      ❌ 已廢棄，連線設定移至 resources/application.yaml
│       │           │
│       │           ├── security/                      ✅ JWT 認證過濾器與 UserDetails 全套 (新增)
│       │           │   ├── JwtUtils.java
│       │           │   ├── JwtAuthenticationFilter.java
│       │           │   └── UserPrincipal.java
│       │           │
│       │           ├── entity/                        ✏️ JPA 資料實體類別 (原 model/)
│       │           │   ├── User.java                  
│       │           │   ├── Court.java                 
│       │           │   ├── Booking.java               
│       │           │   ├── Role.java                  (權限角色表)
│       │           │   ├── RefreshToken.java          (JWT 刷新 Token 記錄表)
│       │           │   └── enums/
│       │           │       ├── CourtStatus.java      
│       │           │       └── CourtType.java        
│       │           │
│       │           ├── repository/                    ✏️ 資料存取層 
│       │           │   ├── UserRepository.java        
│       │           │   ├── CourtRepository.java       
│       │           │   └── BookingRepository.java     (含 JOIN FETCH 防 N+1)
│       │           │
│       │           ├── service/                       ✏️ 業務邏輯層 
│       │           │   ├── UserService.java           (處理一般用戶預約/算錢/防重疊)
│       │           │   ├── AdminService.java          (處理管理者開場/審核)
│       │           │   └── RefreshTokenService.java   (認證 Token 維護 Service)
│       │           │
│       │           ├── controller/                    ✏️ RESTful 接口 (取代原 view/ CLI 介面)
│       │           │   ├── AuthController.java        ✅ 登入/註冊/ Refresh Token 
│       │           │   ├── CourtController.java       ✏️ 球場資源 API (`/api/v1/courts`)
│       │           │   └── BookingController.java     ✏️ 預約資源 API (`/api/v1/bookings`)
│       │           │
│       │           ├── dto/                           ✏️ 前後端交互資料傳輸物件 (新增，規範對外不吐 Entity)
│       │           │   ├── request/                   (BookingRequestDTO, CourtPatchDTO, UserPatchDTO)
│       │           │   └── response/                  (BookingResponseDTO, CourtResponseDTO)
│       │           │
│       │           └── exception/                     ✏️ 全域例外處理 (新增，統一處理 @Valid 400 與 404/409)
│       │               └── GlobalExceptionHandler.java
│       │
│       └── resources/
│           ├── application.yaml                       ✅ 資料庫連線與 JPA 設定 (取代原本 DatabaseConfig.java)
│           └── db/
│               └── migration/                         ✏️ Flyway 資料庫版控 (取代原本 sql/schema.sql)
│                   ├── V1__auth_schema.sql            ✅ 認證基礎表
│                   └── V2__tennis_schema.sql          ✏️ 網球預約業務表 (原 sql/schema.sql 升級)
│
├── docker-compose.yml                                 ✅ 一鍵啟動 (App + PostgreSQL + Redis)
├── README.md                                          ✅ 專案說明與評分驗證指引
├── run.sh                                             ← Mac/Linux 啟動腳本 (改為包含 ./mvnw spring-boot:run)
└── run.bat                                            ← Windows 啟動腳本 (改為包含 ./mvnw spring-boot:run)
```

---

## ✏️ 你的開發流程（每個功能都走這六步）

所有資料庫資料表

### Step 1：設計 Schema → 開新的 migration

建 `src/main/resources/db/migration/V2__create_database.sql`（**永遠開新檔，不改舊的 V1**）：

```sql
-- =============================================================================
-- 1. 會員資料表 (Users)
-- =============================================================================
CREATE TABLE users (
                       id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                       username      VARCHAR(30) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       phone         VARCHAR(20),
                       email         VARCHAR(100) UNIQUE,
                       role          VARCHAR(10) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
                       created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 2. 球場資料表 (Courts)
-- =============================================================================
CREATE TABLE courts (
                        id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                        name        VARCHAR(50) NOT NULL,
                        type        VARCHAR(20) NOT NULL CHECK (type IN ('HARD', 'GRASS', 'CLAY')),
                        status      VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BOOKED', 'MAINTENANCE')),
                        description TEXT,
                        hourly_rate INT NOT NULL,
                        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 3. 預約紀錄表 (Bookings) - 包含 payment_method 欄位與外鍵約束
-- =============================================================================
CREATE TABLE bookings (
                          id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                          user_id        INT NOT NULL,
                          court_id       INT NOT NULL,
                          start_time     TIMESTAMP NOT NULL,
                          end_time       TIMESTAMP NOT NULL,
                          total_fee      INT NOT NULL,
                          status         VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
                          payment_method VARCHAR(20),
                          created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                          CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                          CONSTRAINT fk_court FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE
);

-- 建立外鍵索引以提高查詢效率 (解決 N+1 與 JOIN 效能問題)
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_court_id ON bookings(court_id);

-- =============================================================================
-- 4. 初始化球場基礎資料 (Courts Seeds)
-- =============================================================================
INSERT INTO courts (name, type, status, description, hourly_rate) VALUES
                                                                      ('A號場', 'HARD', 'AVAILABLE', '靠近門口，通風良好', 500),
                                                                      ('B號場', 'HARD', 'AVAILABLE', '標準硬地場', 500),
                                                                      ('C號場', 'CLAY', 'MAINTENANCE', '紅土整理中，暫不開放', 600),
                                                                      ('D號場', 'GRASS', 'AVAILABLE', '頂級草皮場', 800);
```

> PostgreSQL 語法注意：主鍵用 `GENERATED ALWAYS AS IDENTITY`（不是 MySQL 的 `AUTO_INCREMENT`）；索引要獨立 `CREATE INDEX`。

### Step 2：寫 Entity

```java
@Entity
@Table(name = "products")
@Getter @Setter
@NoArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)   // 一定用 IDENTITY，不要用 AUTO
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer stock = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
```

### Step 3：寫 Repository

```java
public interface ProductRepository extends JpaRepository<Product, Long> {
    // 衍生查詢的回傳型別用 Optional<T> / List<T> / Page<T>
    Optional<Product> findByName(String name);
}
```

### Step 4：寫 Service（業務邏輯放這裡，不放 Controller）＋ Controller

參考 `RefreshTokenService` / `AuthController` 的寫法。拿目前登入者：

```java
@GetMapping("/mine")
public List<OrderResponse> myOrders(@AuthenticationPrincipal UserPrincipal user) {
    return orderService.findByUserId(user.getId());
}
```

### Step 5：把 API 路徑加進 SecurityConfig 👈 **別忘了這步！**

打開 `config/SecurityConfig.java`，找到 `👇👇👇 你的 API 權限規則加在這裡 👇👇👇` 標記區：

```java
// 商品查詢公開、修改要登入（沒寫的路徑預設「要登入」）
.requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
// 管理端只給 ADMIN
.requestMatchers("/api/admin/**").hasRole("ADMIN")
```

規則由上而下比對：**具體的寫前面**，最後一條 `anyRequest().authenticated()` 不要動。
新 API 忘了設定也不會裸奔——預設就是要登入。

---

## 💣 高頻踩坑（都是真實案例，先看再寫）

| # | 坑 | 症狀 | 解法 |
|---|----|------|------|
| 1 | 新 Entity 沒寫 migration | 啟動就爆 `missing table` | `ddl-auto` 是 `validate`，每張新表都要有 `V<n>__*.sql` |
| 2 | `GenerationType.AUTO` | 啟動爆 `missing sequence` | 一律用 `IDENTITY` |
| 3 | Service 有 `deleteByXxx` 沒加 `@Transactional` | **第一次能動、第二次才爆** | Service 類別加 `@Transactional` |
| 4 | Entity 用 `@Builder` + 欄位初始值 | builder 建出來欄位是 null，INSERT 撞 NOT NULL | 初始值欄位加 `@Builder.Default` |
| 5 | Enum 欄位沒 `@Enumerated(EnumType.STRING)` | schema 驗證型別不符 | 加註解，DB 用 VARCHAR |
| 6 | 抄到 Boot 3 教學的 Security 寫法 | `new DaoAuthenticationProvider()` 編譯錯誤 | 本模板已是 Boot 4 寫法，照模板 |
| 7 | 忘了在 SecurityConfig 放行公開 API | 前端一直 401/403 | 回去走 Step 5 |
| 8 | 問 AI 不講版本 | 拿到 Boot 3 + MySQL 程式碼 | 開頭聲明「Java 25、Spring Boot 4.0.6、PostgreSQL 15、Flyway」 |

---

## 🔄 常用指令

```bash
./mvnw spring-boot:run          # 啟動
./mvnw clean test-compile       # 編譯檢查（改完一批程式先跑這個）
./mvnw clean package            # 打包

# 資料庫整個重來（會清光資料！Flyway 會重新從 V1 跑）
docker exec my_postgres psql -U postgres -c "DROP DATABASE starter_db;" -c "CREATE DATABASE starter_db;"

# 進資料庫看表
docker exec -it my_postgres psql -U postgres -d starter_db
```

---

## ❓ FAQ

**Q：想改專案名稱／套件名？**
可以但不急。要改的話 IDE 對 `com.example.starter` 按 Refactor → Rename，pom 的 `artifactId` 順手改，別手動搬檔案。

**Q：怎麼弄一個 ADMIN 帳號測 `/api/example/admin`？**
先註冊一個帳號，再進資料庫把 ROLE_ADMIN 綁給他：
```bash
docker exec my_postgres psql -U postgres -d starter_db -c \
  "INSERT INTO user_roles (user_id, role_id) SELECT u.id, r.id FROM users u, roles r WHERE u.username='test1' AND r.name='ROLE_ADMIN';"
```
重新登入拿新 token（角色寫在 token 裡，舊 token 不會自動更新）。

**Q：全域例外處理、Swagger、Redis 什麼時候加？**
之後課程會教（36 之後），到時候直接往這個專案上加即可。現在先把業務功能做好。

💣 網球專案開發與審核踩坑指南
| # | 坑 | 症狀 | 解法 |
|---|----|------|------|
| 1 | 預約列表 N+1 問題 | 查詢預約紀錄時印出大量 SQL 語句` |在 BookingRepository 使用 JOIN FETCH b.court 一次帶出球場資料。|
| 2 | 傳入過期時間/空白欄位 | 系統直接噴出 500 Unhandled Exception | 在 DTO 加註 @Future / @NotNull，並由 GlobalExceptionHandler 統一回應 400 Bad Request。 |
| 3 | @Builder 預設值失效 | 使用 Builder 建立 Entity 時狀態變成 null | 於 Entity 預設欄位加上 @Builder.Default（如 status = CourtStatus.AVAILABLE）。 |
| 4 | 重複預約同一時段 | 多個使用者重疊預約同一球場 | 於 Service 層調用 isTimeSlotOccupied 檢查，若衝突拋出例外由 Handler 回傳 409 Conflict。 |
| 5 | 一般會員存取管理 API| 無法擋下越權存取 | 控制器加註 @PreAuthorize("hasRole('ADMIN')")，權限不足自動回應 403 Forbidden。 |

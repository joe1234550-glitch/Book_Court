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



```
```

>

### 

```
```



```
```



```
```


```

```
## 📋 API 清單
| 方法 | 路徑 | 說明                          | 權限 |
|---|---|-----------------------------|---|
| POST | `/api/auth/register` | 註冊                          | 公開 |
| POST | `/api/auth/login` | 登入                          | 公開 |
|POST|`/api/auth/refresh`| 刷新 Access Token（Token 輪換機制  |公開|
|POST|`/api/auth/logout`| 使用者登出（撤銷 Refresh Token）     |公開|
|GET|`/api/v1/users/{id}`| 查詢特定使用者資料（Profile）          |已登入會員|
|PUT|`/api/v1/users/{id}`| 更新使用者基本資料（Username / Email) |已登入會員|
|DELETE|`/api/v1/users/{id}`| 刪除使用者                        |僅限管理員 (ROLE_ADMIN)|
|GET|`/api/v1/courts`| 取得開放中的球場清單                         |公開|
|GET|`/api/v1/courts/{id}`| 依 ID 查詢單一球場詳細資訊                        |公開|
|POST|`/api/v1/courts`| 新增球場                       |僅限管理員 (ROLE_ADMIN)|
|PATCH|`/api/v1/courts/{id}/status`|更新球場狀態（例如：維護中 / 暫不開放| 僅限管理員 (ROLE_ADMIN)                        |
|POST|`/api/v1/bookings`|發起球場預約（自動檢查時段重疊與費用試算）                         |已登入會員|
|GET|`/api/v1/bookings/my`| 查詢個人預約紀錄                        |已登入會員|
|PATCH|`/api/v1/bookings/{id}/check-in`| 執行現場報到                        |已登入會員|
|PATCH|`/api/v1/bookings/{id}/cancel`| 取消預約                       |已登入會員|
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





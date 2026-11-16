# 📋 BÁO CÁO KỸ THUẬT: [TECH-S1-00] THIẾT LẬP CẤU TRÚC DỰ ÁN, CƠ SỞ DỮ LIỆU & KẾT NỐI MONGOOSE ODM

> **Ngày thực hiện:** 16/11/2026  
> **Người thực hiện:** Khổng Phú Cường (`@khongpc-ptit`) & AI Assistant (Antigravity)  
> **Nhánh phát triển:** `chore/tech-s1-00-setup-project-db`  
> **Target Branch:** `develop`  
> **Liên kết Issues:** Closes [#41](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/41), Refs [#16](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/16), [#17](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/17)

---

## 1. 🎯 MỤC TIÊU & YÊU CẦU ĐÃ ĐẠT ĐƯỢC CỦA TASK #41

Đối chiếu với các yêu cầu kỹ thuật và Definition of Done trong Issue #41:

| Tiêu chí kỹ thuật theo Issue #41 | Trạng thái | Chi tiết triển khai |
|---|:---:|---|
| **1. Khởi tạo cấu trúc thư mục source code (Frontend & Backend)** | ✅ Hoàn thành | Thiết lập kiến trúc phân tách độc lập (Decoupled): `client/` (React 19 + TypeScript + Vite) và `server/` (Node.js + Express + TypeScript) theo đúng Mục 5.1 trong `[DOC-11]`. |
| **2. Thiết lập môi trường Database (MongoDB Docker & Cloud Atlas)** | ✅ Hoàn thành | Tạo tệp `docker-compose.yml` cấu hình cụm container MongoDB (`mongo:7.0`) và Web GUI Mongo-Express (`8081`). Hỗ trợ cấu hình chuyển đổi giữa Docker local và MongoDB Atlas qua biến `MONGODB_URI`. |
| **3. Cài đặt và cấu hình Mongoose ODM kết nối CSDL** | ✅ Hoàn thành | Xây dựng tệp `server/src/config/db.ts` với cơ chế **Connection Pooling** (`maxPoolSize: 10`, timeout 5000ms), tự động đóng kết nối an toàn với `disconnectDB()`. |
| **4. Chuẩn hóa biến môi trường (`.env.example`)** | ✅ Hoàn thành | Tạo trọn bộ 3 tệp mẫu `.env.example` (thư mục gốc, `server/.env.example`, `client/.env.example`). |
| **5. Endpoint kiểm tra sức khỏe hệ thống (Health Check)** | ✅ Hoàn thành | Triển khai `GET /api/v1/health` trả về trạng thái kết nối CSDL theo đúng chuẩn RESTful JSON Envelope Pattern của `DOC-11`. |
| **6. Viết hướng dẫn khởi chạy nhanh trong `README.md`** | ✅ Hoàn thành | Viết mới toàn bộ `README.md` cung cấp Quick-Start Guide, lệnh Docker, lệnh chạy dev và lệnh kiểm thử cho toàn nhóm. |
| **7. Kiểm thử tự động (Unit / Integration Tests)** | ✅ Hoàn thành | Viết bộ kiểm thử `server/tests/db.test.ts` (5 test cases) kết hợp `server/tests/task.test.ts` (10 test cases) và `client/src/test/TaskList.test.tsx` (8 test cases) $\rightarrow$ **23/23 tests PASS 100%**. |
| **8. Cập nhật phân công công việc (Assignee)** | ✅ Hoàn thành | Cập nhật người phụ trách thành `@khongpc-ptit` (Khổng Phú Cường) trên cả GitHub Issue #41 và tài liệu điều phối `docs/Sprint1.md`. |

---

## 2. 🐳 MÔI TRƯỜNG CƠ SỞ DỮ LIỆU & DOCKER COMPOSE

Để các thành viên trong nhóm có thể kéo code về và thiết lập ngay môi trường CSDL trong 1 câu lệnh, tệp [`docker-compose.yml`](file:///d:/UNIVERSITY_PTIT/YEAR_4/PM/project/docker-compose.yml) được cấu hình tại thư mục gốc:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: gamified-todo-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: gamified_todo
    volumes:
      - mongodb_data:/data/db
    networks:
      - gamified-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.runCommand('ping').ok"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  mongo-express:
    image: mongo-express:1.0.2-no-distroless
    container_name: gamified-todo-mongo-express
    restart: unless-stopped
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_SERVER: mongodb
      ME_CONFIG_MONGODB_PORT: 27017
      ME_CONFIG_MONGODB_ENABLE_ADMIN: "true"
      ME_CONFIG_BASICAUTH: "false"
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - gamified-network

volumes:
  mongodb_data:
    driver: local
    name: gamified-todo-mongodb-data

networks:
  gamified-network:
    driver: bridge
```

### 💡 Lợi ích của kiến trúc Docker này:
1. **Khởi động 1 chạm:** Chạy `npm run docker:up` (hoặc `docker compose up -d`) là CSDL MongoDB sẵn sàng hoạt động trên cổng `27017`.
2. **Giao diện quản lý trực quan (Mongo Express):** Mở trình duyệt tại `http://localhost:8081` để xem, thêm, sửa, xóa trực tiếp các document và collection mà không cần cài thêm phần mềm ngoài như MongoDB Compass.
3. **Lưu trữ bền vững (Data Persistence):** Sử dụng Named Volume `gamified-todo-mongodb-data` đảm bảo dữ liệu không bị mất khi tắt container.
4. **Healthcheck đồng bộ:** Container `mongo-express` chỉ khởi chạy khi dịch vụ `mongodb` đã sẵn sàng nhận kết nối (`service_healthy`).

---

## 3. 📂 CẤU TRÚC PHÂN RÃ THƯ MỤC CHUẨN TOÀN DỰ ÁN

```text
pm-subject_gamified-todo-application/
├── .github/
│   ├── workflows/                      # GitHub Actions CI/CD workflows
│   │   ├── promote-ready.yml           # Đồng bộ Kanban Board Project V2
│   │   ├── auto-in-progress-on-branch.yml
│   │   ├── pr-convention-check.yml
│   │   └── deadline-reminder.yml
│   ├── ISSUE_TEMPLATE/                 # Issue Templates cho Tech Task, Bug, Config
│   └── PULL_REQUEST_TEMPLATE.md        # PR Template đa năng
├── client/                             # Frontend SPA (React 19 + TypeScript + Vite)
│   ├── src/
│   │   ├── components/                 # Component giao diện dùng chung
│   │   ├── hooks/                      # Custom React hooks (useTasks...)
│   │   ├── services/                   # Axios API Client cấu hình baseURL & interceptors
│   │   ├── types/                      # TypeScript Interfaces cho Frontend
│   │   └── test/                       # Vitest UI Component tests
│   ├── .env.example                    # Mẫu biến môi trường Frontend
│   ├── package.json
│   └── tsconfig.json
├── server/                             # Backend RESTful API (Node.js + TypeScript)
│   ├── src/
│   │   ├── config/                     # Cấu hình CSDL: db.ts (Mongoose Pooling)
│   │   ├── controllers/                # Tầng Controller tiếp nhận HTTP request
│   │   ├── middlewares/                # Auth JWT, Error handling middlewares
│   │   ├── models/                     # Mongoose Schemas (Task.ts, User.ts...)
│   │   ├── routes/                     # Router endpoints (/api/v1/tasks...)
│   │   ├── services/                   # Business Logic, Anti-gaming rules
│   │   ├── types/                      # TypeScript DTOs & Express Request types
│   │   ├── app.ts                      # Cấu hình Express app, Middlewares & Health API
│   │   └── server.ts                   # Entry point khởi chạy máy chủ
│   ├── tests/                          # Jest Integration & Unit test suites
│   │   ├── db.test.ts                  # Test kết nối CSDL & Health Check
│   │   └── task.test.ts                # Test nghiệp vụ Task Management
│   ├── .env.example                    # Mẫu biến môi trường Backend
│   ├── jest.config.ts                  # Cấu hình Jest & ts-jest độc lập
│   ├── package.json
│   └── tsconfig.json
├── docs/                               # Single Source of Truth (SSOT)
│   ├── [DOC-11] System Design Document.md
│   ├── [TECH-S1-01] Task Data Model & API Contract.md
│   ├── Sprint1.md                      # Bảng điều phối tiến độ Sprint 1
│   ├── GITHUB-WORKFLOWS-GUIDE.md       # Cẩm nang 4 GitHub Actions Workflows
│   └── reports/                        # Các báo cáo kỹ thuật chính thức
│       ├── TECH-S1-00-setup-project-db.md
│       └── TECH-S1-03-view-task-list.md
├── .dockerignore                       # Loại trừ các file rác khi build Docker
├── .env.example                        # Mẫu cấu hình môi trường tổng thể
├── docker-compose.yml                  # Cấu hình chạy MongoDB & Mongo Express
├── package.json                        # Scripts điều phối tổng thể dự án
└── README.md                           # Cẩm nang khởi chạy dự án toàn diện
```

---

## 4. ⚙️ CHI TIẾT TRIỂN KHAI BACKEND & KẾT NỐI MONGOOSE ODM

### 4.1. Cấu hình Connection Pooling trong `server/src/config/db.ts`
Tuân thủ Mục 1.2 & 4.3 trong `[DOC-11]`, kết nối CSDL được tối ưu hóa cho Free Tier với Connection Pooling:
* `maxPoolSize: 10`: Giới hạn tối đa 10 kết nối đồng thời nhằm không vượt hạn mức của MongoDB Atlas Free Tier (500 kết nối).
* `serverSelectionTimeoutMS: 5000`: Hết thời gian chờ 5 giây nếu không kết nối được máy chủ MongoDB.
* `socketTimeoutMS: 45000`: Timeout cho các socket không phản hồi sau 45 giây.
* `mongoose.disconnect()`: Cơ chế ngắt kết nối an toàn khi ứng dụng dừng hoặc dọn dẹp sau khi chạy xong test suite.

### 4.2. Endpoint Health Check chuẩn JSON Envelope Pattern
Được triển khai tại `server/src/app.ts`:
* Route: `GET /api/v1/health`
* Phản hồi mẫu:
  ```json
  {
    "success": true,
    "data": {
      "status": "UP",
      "database": "connected",
      "databaseConnected": true,
      "environment": "development"
    },
    "message": "System is healthy and database is connected",
    "timestamp": "2026-11-16T10:30:00.000Z"
  }
  ```

---

## 5. 🛠️ KHẮC PHỤC LỖI KỸ THUẬT TRONG QUÁ TRÌNH KIỂM THỬ

Trong quá trình hoàn thiện file `server/tests/db.test.ts`, chúng tôi đã phát hiện và xử lý triệt để 2 vấn đề kỹ thuật quan trọng:

1. **Lỗi `Property 'readyState' is not declared configurable` trong Jest:**
   * *Nguyên nhân:* Thuộc tính `mongoose.connection.readyState` là một getter nội bộ không thể cấu hình lại (`non-configurable`), khiến hàm `jest.spyOn(mongoose.connection, 'readyState', 'get')` bị Jest từ chối và ném exception.
   * *Giải pháp:* Refactor kịch bản kiểm thử: Đọc trực tiếp kiểu dữ liệu và giá trị trả về của `readyState` trên `GET /api/v1/health` mà không can thiệp vào prototype của Mongoose.
2. **Lỗi `Multiple configurations found (jest.config.ts vs package.json)`:**
   * *Nguyên nhân:* File `server/jest.config.ts` vừa được tạo nhưng trong `server/package.json` vẫn còn trường `"jest": { ... }` gây xung đột.
   * *Giải pháp:* Xóa bỏ trường `"jest"` trong `package.json`, chuyển toàn bộ cấu hình sang `jest.config.ts` độc lập và chuẩn hóa.
3. **Lỗi `disconnectDB` không gọi close khi chưa kết nối:**
   * *Nguyên nhân:* Hàm cũ kiểm tra điều kiện `if (readyState !== 0)` nên khi mock `close` bị bỏ qua.
   * *Giải pháp:* Chuyển sang sử dụng phương thức chuẩn `await mongoose.disconnect()` giúp đảm bảo ngắt toàn bộ pool kết nối an toàn trong mọi trường hợp.

---

## 6. 🧪 KẾT QUẢ KIỂM THỬ TỰ ĐỘNG TOÀN DỰ ÁN

Lệnh thực thi từ thư mục gốc:
```bash
npm test
```

### Kết quả chi tiết:
* **Backend Test Suite (`server/tests/`):** **15/15 PASS (100%)**
  * `tests/db.test.ts`:
    * ✅ 1. GET /health - Endpoint kiểm tra sức khỏe cơ bản phản hồi 200 OK
    * ✅ 2. GET /api/v1/health - Trả về đúng JSON Envelope Pattern chuẩn DOC-11
    * ✅ 3. connectDB cấu hình kết nối Mongoose với Connection Pooling chuẩn xác
    * ✅ 4. connectDB xử lý lỗi kết nối và ném exception trong môi trường test
    * ✅ 5. disconnectDB gọi mongoose.disconnect an toàn khi dừng ứng dụng
  * `tests/task.test.ts`: 10/10 tests PASS (Authentication, Empty state, Data isolation, Filtering, Sorting).
* **Frontend Test Suite (`client/src/test/`):** **8/8 PASS (100%)**
  * `TaskList.test.tsx`: 8/8 tests PASS (Loading skeleton, Empty state, Render tasks, Priority badges, Error alert).
* **Biên dịch TypeScript (`npm run build`):**
  * `server/`: `tsc` hoàn thành **0 lỗi**.
  * `client/`: `tsc -b && vite build` hoàn thành **0 lỗi** (Tạo bundle `dist/`).

---

## 7. 📖 HƯỚNG DẪN KHỞI CHẠY CHO THÀNH VIÊN TRONG NHÓM

Khi kéo nhánh về, các thành viên chỉ cần thực hiện 3 bước đơn giản:

```bash
# 1. Khởi động CSDL MongoDB qua Docker (chỉ mất 5 giây)
npm run docker:up

# 2. Khởi động Backend (chạy tại http://localhost:5000)
npm run dev:server

# 3. Khởi động Frontend (chạy tại http://localhost:5173)
npm run dev:client
```
*Truy cập bảng quản trị CSDL trực quan tại:* `http://localhost:8081`  
*Kiểm tra sức khỏe hệ thống tại:* `http://localhost:5000/api/v1/health`

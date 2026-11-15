# 📋 BÁO CÁO KỸ THUẬT: [TECH-S1-03] XEM DANH SÁCH CÔNG VIỆC & MIGRATION BACKEND TYPESCRIPT

> **Ngày thực hiện:** 15/11/2026  
> **Người thực hiện:** AI Assistant (Antigravity) & `@khongpc-ptit`  
> **Nhánh phát triển:** `feat/tech-s1-03-view-task-list`  
> **Pull Request:** [PR #40](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/pull/40) (Target: `develop`)  
> **Liên kết Issues:** Closes [#29](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/29), Refs [#19](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/19)

---

## 1. 🎯 MỤC TIÊU & YÊU CẦU ĐÃ ĐẠT ĐƯỢC

1. **[US-S1-02 / TECH-S1-03] Xem danh sách công việc:**
   - Người dùng xem được toàn bộ danh sách công việc của riêng mình (nguyên tắc cô lập dữ liệu theo `user_id`).
   - Hỗ trợ lọc danh sách theo `status` (`TODO`, `IN_PROGRESS`, `COMPLETED`) và `priority` (`LOW`, `MEDIUM`, `HIGH`).
   - Sắp xếp mặc định: mới nhất lên đầu (`created_at: -1`).
   - Frontend hiển thị đầy đủ 3 trạng thái UX: **Đang tải (Skeleton)**, **Danh sách rỗng (Empty State)**, và **Báo lỗi kết nối (Error Alert)**.
2. **Backend TypeScript Migration (Yêu cầu kỹ thuật cốt lõi):**
   - Chuyển đổi 100% mã nguồn backend từ JavaScript sang TypeScript nghiêm ngặt (`strict: true`).
   - Thiết lập hệ thống kiểu dữ liệu (`types/`), DTOs, Mongoose Schema Models có type-checking.
   - Cấu hình Jest với `ts-jest` chạy trực tiếp unit/integration test trên file `.ts`.

---

## 2. 📂 CẤU TRÚC FILE MỚI & THAY ĐỔI TRONG DỰ ÁN

### 🔙 Phía Backend (`server/`)
```text
server/
├── tsconfig.json                # Cấu hình TypeScript compiler (Strict mode, ES2022, CommonJS)
├── package.json                 # Scripts build/start/dev/test và dependencies mới (tsx, ts-jest, @types/*)
├── src/
│   ├── types/                   # Định nghĩa Interface & Types
│   │   ├── api.types.ts         # Response JSON Envelope pattern (success, data, error, timestamp)
│   │   ├── express.d.ts         # Mở rộng Express.Request để chứa req.user (id, email)
│   │   ├── task.types.ts        # ITask, CreateTaskDTO, ListTasksQueryDTO, TaskPriority, TaskStatus
│   │   └── user.types.ts        # IUser Mongoose document interface
│   ├── config/
│   │   └── db.ts                # Mongoose connection & disconnect type-safe
│   ├── models/
│   │   ├── Task.ts              # Model Task + Compound Index { user_id: 1, status: 1 } + pre-save XP
│   │   └── User.ts              # Model User
│   ├── middlewares/
│   │   ├── auth.middleware.ts   # Xác thực Bearer JWT token, gán req.user
│   │   └── error.middleware.ts  # Xử lý route 404 và Global Error Handler chuẩn JSON envelope
│   ├── services/
│   │   └── task.service.ts      # Business logic: lọc dữ liệu, validate query, sort, cô lập user_id
│   ├── controllers/
│   │   └── task.controller.ts   # Tiếp nhận HTTP request, gọi service, bọc response envelope
│   ├── routes/
│   │   └── task.routes.ts       # Router /api/v1/tasks gắn middleware verifyToken
│   ├── app.ts                   # Cấu hình Express app, CORS, Morgan, Health Check
│   └── server.ts                # Khởi động kết nối MongoDB và lắng nghe PORT
└── tests/
    └── task.test.ts             # 10 test cases tự động (Xác thực, Empty, Ownership, Query, Sort)
```

### 🖥️ Phía Frontend (`client/`)
```text
client/
├── src/
│   ├── types/
│   │   └── task.ts              # Types giao diện: Task, TaskFilter, Priority, Status
│   ├── services/
│   │   └── task.service.ts      # Axios client giao tiếp API /api/v1/tasks có Bearer token
│   ├── components/
│   │   ├── TaskList.tsx         # Component danh sách công việc (Skeleton, Empty, List, Badges)
│   │   └── TaskList.css         # CSS theo đúng Wireframe Core MVP Screens.html
│   ├── pages/
│   │   └── DashboardPage.tsx    # Trang Dashboard tích hợp TaskList và Quick Create Form
│   └── test/
│       └── TaskList.test.tsx    # 8 test cases Vitest kiểm thử toàn diện UI
```

---

## 3. 🧪 KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITE)

### Backend Tests (`server/tests/task.test.ts`): **10/10 PASS**
1. `GET /api/v1/tasks` không có Authorization header -> **Trả về 401 UNAUTHORIZED**.
2. `GET /api/v1/tasks` với token không hợp lệ -> **Trả về 401 UNAUTHORIZED**.
3. `GET /api/v1/tasks` khi chưa có task -> **Trả về 200, mảng rỗng `[]`, total = 0**.
4. `GET /api/v1/tasks` trả về đúng danh sách kèm các trường: `title`, `priority`, `xp_reward`, `status`, `due_date`.
5. **Ownership Isolation:** Đảm bảo User A không bao giờ thấy hoặc truy vấn được task của User B.
6. Lọc trạng thái `?status=TODO` hoạt động chính xác.
7. Truyền sai trạng thái `?status=INVALID` -> **Trả về 400 INVALID_STATUS**.
8. Lọc độ ưu tiên `?priority=HIGH` hoạt động chính xác.
9. Truyền sai độ ưu tiên `?priority=INVALID` -> **Trả về 400 INVALID_PRIORITY**.
10. Sắp xếp mặc định luôn là `{ created_at: -1 }` (mới nhất lên đầu).

### Frontend Tests (`client/src/test/TaskList.test.tsx`): **8/8 PASS**
1. Hiển thị Skeleton loading khi đang fetch dữ liệu.
2. Hiển thị Empty State khi danh sách trả về rỗng kèm nút "Tạo ngay".
3. Render danh sách các công việc với đúng tiêu đề, priority badge và điểm thưởng XP (10, 20, 30 XP).
4. Hiển thị thông báo lỗi thân thiện khi API gặp sự cố và có nút "Thử lại".
5. Xử lý logic gọi lại API khi bấm nút "Thử lại".
6. Render đúng định dạng ngày đến hạn (Due date).
7. Gửi đúng query filter `status` khi người dùng chuyển bộ lọc.
8. Gửi đúng query filter `priority` khi người dùng lọc theo mức ưu tiên.

---

## 4. 🚀 HƯỚNG DẪN CHẠY THỬ NGHIỆM TRÊN MÁY LOCAL

### Chạy Backend:
```bash
cd server
npm install        # (Nếu chưa cài các gói mới)
npm run build      # Biên dịch TypeScript sang dist/
npm run dev        # Chạy máy chủ dev tại http://localhost:5000 (hot reload với tsx)
npm test           # Chạy toàn bộ 10 unit/integration tests
```

### Chạy Frontend:
```bash
cd client
npm install
npm run dev        # Chạy máy chủ Vite tại http://localhost:5173
npm test           # Chạy 8 unit tests với Vitest
npm run build      # Kiểm tra build production
```

---

## 5. 💡 BƯỚC TIẾP THEO THEO LỘ TRÌNH SPRINT 1
- **Merge Pull Request #40** vào nhánh `develop` trên GitHub sau khi bạn rà soát code.
- Chuẩn bị triển khai task kế tiếp:
  - **[TECH-S1-04] Triển khai chức năng cập nhật công việc** (Issue #30 / US-S1-03)
  - Hoặc **[TECH-S1-02] Triển khai chức năng tạo công việc** (Issue #28 / US-S1-01)

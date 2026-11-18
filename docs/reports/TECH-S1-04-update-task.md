# 📋 BÁO CÁO KỸ THUẬT: [TECH-S1-04] TRIỂN KHAI CHỨC NĂNG CẬP NHẬT CÔNG VIỆC (FRONTEND + BACKEND)

> **Ngày thực hiện:** 18/11/2026  
> **Người thực hiện:** Mạnh Hùng (`@mhunglee20405`)  
> **Nhánh phát triển:** `feat/tech-s1-04-update-task`  
> **User Story cha:** [US-S1-03] Cập nhật công việc (#20) thuộc [FEAT-01] Quản lý công việc (#16)  
> **Liên kết Issues:** Closes [#30](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/30), Refs [#20](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/20)

---

## 1. 🎯 MỤC TIÊU & YÊU CẦU KỸ THUẬT ĐÃ ĐẠT ĐƯỢC

### 🔙 Phía Backend REST API
- **Endpoint:** `PUT /api/v1/tasks/:id`
- **Bảo mật & Quyền sở hữu (Ownership Isolation):**
  - Xác thực Bearer JWT token qua `verifyToken` middleware (trả về 401 UNAUTHORIZED nếu thiếu/sai).
  - Kiểm tra định dạng `:id` (24 ký tự hex của MongoDB ObjectId). Trả về 400 INVALID_ID nếu không hợp lệ.
  - Tìm kiếm nhiệm vụ theo `:id`. Trả về 404 TASK_NOT_FOUND nếu không tìm thấy.
  - Kiểm tra quyền sở hữu: `task.user_id.toString() === req.user.id`. Trả về 403 FORBIDDEN nếu user cố tình cập nhật task của người khác.
- **Ràng buộc nghiệp vụ & Validation (theo DOC-11 & TECH-S1-01):**
  - `title`: Bắt buộc nếu được truyền, không được rỗng sau khi `trim()`, độ dài 1–200 ký tự. Báo 400 TITLE_REQUIRED hoặc TITLE_TOO_LONG.
  - `description`: Tối đa 1000 ký tự. Báo 400 DESCRIPTION_TOO_LONG.
  - `priority`: Enum `["LOW", "MEDIUM", "HIGH"]`. Tự động tính toán lại điểm thưởng `xp_reward` tương ứng (LOW: 10, MEDIUM: 20, HIGH: 30 XP). Báo 400 INVALID_PRIORITY nếu sai.
  - `due_date`: Định dạng ISO 8601 hợp lệ hoặc `null` (hỗ trợ xóa ngày hạn chót). Báo 400 INVALID_DUE_DATE nếu sai định dạng.
  - `status`: Enum `["TODO", "IN_PROGRESS", "COMPLETED"]`. Báo 400 INVALID_STATUS nếu sai. Tự động gắn `completed_at = new Date()` khi chuyển sang `COMPLETED`, và reset `completed_at = null` khi chuyển về `TODO`/`IN_PROGRESS`.
  - **Bảo vệ toàn vẹn dữ liệu:** Ngăn chặn tuyệt đối việc can thiệp các trường hệ thống `user_id`, `created_at`, `_id`.
  - Trả về chuẩn Response Envelope: `{ success: true, data: updatedTask, message: "Cập nhật nhiệm vụ thành công", timestamp: ... }`.

### 🖥️ Phía Frontend (React + TypeScript)
- **Modal Chỉnh sửa công việc (`EditTaskModal.tsx`):**
  - Thiết kế bám sát Wireframe `Core MVP Screens.html`: Overlay `#overlay`, Modal `.modal`, form `#edit-form`.
  - Hỗ trợ Accessibility: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-invalid`, và phím `Escape` để đóng modal, click backdrop.
  - Tải thông tin hiện tại vào biểu mẫu (pre-fill `title`, `description`, `priority`, `due_date`, `status`).
  - Validation Client-side: Chặn tiêu đề rỗng, độ dài <= 200, focus và báo lỗi ngay dưới ô input.
  - Trạng thái submit (`submitting`): Disable nút và hiển thị "Đang lưu…" ngăn chặn duplicate submit.
- **Tích hợp vào Trang Dashboard & TaskList:**
  - Nút sửa `.edit` trên từng dòng công việc (`TaskRow`) kích hoạt modal với dữ liệu task tương ứng.
  - Gọi API `taskService.updateTask(id, payload)` và cập nhật tức thì danh sách trong state `useTasks`.
  - Dữ liệu được lưu vĩnh viễn vào MongoDB và giữ nguyên trạng thái khi tải lại trang.
  - Hiển thị Toast thông báo thành công: "Đã lưu thay đổi".

---

## 2. 📂 CÁC TỆP TIN THAY ĐỔI VÀ TẠO MỚI

```text
pm-subject_gamified-todo-application/
├── server/
│   ├── src/
│   │   ├── types/task.types.ts           # Bổ sung interface UpdateTaskDTO
│   │   ├── services/task.service.ts       # Bổ sung method updateTask với validation và ownership check
│   │   ├── controllers/task.controller.ts # Bổ sung controller updateTask bọc response envelope
│   │   └── routes/task.routes.ts          # Đăng ký route PUT /api/v1/tasks/:id
│   └── tests/
│       └── task.test.ts                   # Bổ sung 16 test cases kiểm thử API cập nhật task
├── client/
│   ├── src/
│   │   ├── types/task.types.ts           # Bổ sung interface UpdateTaskRequestDTO
│   │   ├── services/task.service.ts       # Bổ sung hàm updateTask gọi PUT /tasks/:id
│   │   ├── components/
│   │   │   └── EditTaskModal.tsx          # Component Modal chỉnh sửa công việc chuẩn wireframe
│   │   ├── hooks/useTasks.ts              # Cung cấp hàm updateTask cập nhật state và API
│   │   ├── pages/Dashboard.tsx            # Tích hợp EditTaskModal, quản lý state và toast
│   │   ├── styles/globals.css             # Bổ sung styling modal, overlay, field, error, toast
│   │   └── test/
│   │       └── EditTaskModal.test.tsx     # 9 test cases kiểm thử giao diện & validation modal
└── docs/
    ├── Sprint1.md                         # Cập nhật trạng thái hoàn thành [TECH-S1-04]
    └── reports/
        └── TECH-S1-04-update-task.md      # Tài liệu báo cáo kỹ thuật hoàn thành task
```

---

## 3. 🧪 KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (TEST RESULTS)

### 🔙 Backend Unit & Integration Tests (Supertest + Jest)
```text
PASS tests/task.test.ts
  GET /api/v1/tasks - [US-S1-02 / TECH-S1-03] View Task List
    √ 10 tests passed
  PUT /api/v1/tasks/:id - [US-S1-03 / TECH-S1-04] Update Task
    Xác thực bảo mật (Authentication)
      √ 1. Trả về 401 UNAUTHORIZED khi không có Header Authorization
      √ 2. Trả về 401 UNAUTHORIZED khi token không hợp lệ
    Kiểm tra định dạng ID & Quyền sở hữu (Validation & Authorization)
      √ 3. Trả về 400 INVALID_ID khi :id không đúng 24 hex ký tự MongoDB ObjectId
      √ 4. Trả về 404 TASK_NOT_FOUND khi không tìm thấy task với ID đã cung cấp
      √ 5. Trả về 403 FORBIDDEN khi người dùng cập nhật task thuộc sở hữu của người khác
    Kiểm tra tính hợp lệ dữ liệu đầu vào (Input Validation)
      √ 6. Trả về 400 TITLE_REQUIRED khi title là chuỗi rỗng sau khi trim()
      √ 7. Trả về 400 TITLE_TOO_LONG khi title vượt quá 200 ký tự
      √ 8. Trả về 400 DESCRIPTION_TOO_LONG khi description vượt quá 1000 ký tự
      √ 9. Trả về 400 INVALID_PRIORITY khi priority không thuộc LOW/MEDIUM/HIGH
      √ 10. Trả về 400 INVALID_STATUS khi status không thuộc TODO/IN_PROGRESS/COMPLETED
      √ 11. Trả về 400 INVALID_DUE_DATE khi due_date không phải định dạng ngày hợp lệ
    Cập nhật thành công (Update Success)
      √ 12. Cập nhật thành công tiêu đề và mô tả, trả về Response Envelope 200 OK
      √ 13. Tự động tính toán lại xp_reward khi cập nhật độ ưu tiên (LOW -> HIGH => 30 XP)
      √ 14. Hỗ trợ cập nhật due_date mới và xóa hạn chót khi truyền null
      √ 15. Tự động gán completed_at khi đổi status sang COMPLETED và reset khi chuyển về TODO
      √ 16. Bảo vệ các trường hệ thống không bị ghi đè (user_id, created_at, _id)
PASS tests/db.test.ts
  √ 5 tests passed

Test Suites: 2 passed, 2 total
Tests:       31 passed, 31 total (16 tests mới cho TECH-S1-04)
```

### 🖥️ Frontend Unit & Component Tests (Vitest + Testing Library)
```text
PASS src/test/TaskList.test.tsx (8 tests)
PASS src/test/EditTaskModal.test.tsx (9 tests)
  √ 1. Không render modal khi isOpen = false hoặc task = null
  √ 2. Điền sẵn thông tin hiện tại của task vào biểu mẫu (Pre-fill Data)
  √ 3. Validate lỗi khi tiêu đề bị để trống và chặn submit
  √ 4. Validate lỗi khi tiêu đề vượt quá 200 ký tự
  √ 5. Gửi dữ liệu cập nhật hợp lệ khi submit form thành công
  √ 6. Hỗ trợ xóa ngày hạn chót (clear due_date) và gửi null
  √ 7. Gọi onClose khi click nút Hủy hoặc nút Đóng ✕
  √ 8. Đóng modal khi nhấn phím Escape
  √ 9. Đóng modal khi click ra ngoài backdrop (overlay)

Test Files:  2 passed, 2 total
Tests:       17 passed, 17 total (9 tests mới cho TECH-S1-04)
```

### 📦 Build & Type-checking
- Server: `npm run build` -> `tsc` biên dịch thành công 0 lỗi.
- Client: `npm run build` -> `tsc -b && vite build` thành công 0 lỗi.
- Lint: `npm run lint` -> 0 lỗi.

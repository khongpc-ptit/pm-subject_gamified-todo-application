# 📋 BÁO CÁO KỸ THUẬT: [TECH-S1-10] TRIỂN KHAI CHỨC NĂNG XEM & CẬP NHẬT HỒ SƠ NGƯỜI DÙNG (FRONTEND + BACKEND)

> **Ngày thực hiện:** 23/11/2026  
> **Người thực hiện:** Mạnh Hùng (`@mhunglee20405`) & AI Assistant  
> **Nhánh phát triển:** `feat/tech-s1-10-user-profile`  
> **Pull Request:** Target `develop`  
> **User Stories cha:** [US-S1-07] Xem hồ sơ người dùng (#24) & [US-S1-08] Cập nhật hồ sơ người dùng (#25) thuộc [FEAT-02] Xác thực người dùng & Quản lý tài khoản (#17)  
> **Liên kết Issues:** Closes [#36](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/36), Refs [#24](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/24), [#25](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/25)

---

## 1. 🎯 MỤC TIÊU & YÊU CẦU KỸ THUẬT ĐÃ ĐẠT ĐƯỢC

### 🔙 Phía Backend REST API
- **Endpoint GET:** `GET /api/v1/auth/me` (Yêu cầu JWT Bearer Token qua middleware `verifyToken`)
  - Trích xuất định danh người dùng `req.user.id` từ Access Token.
  - Truy vấn thông tin người dùng từ cơ sở dữ liệu MongoDB. Báo lỗi `404 USER_NOT_FOUND` nếu không tìm thấy.
  - Chuẩn hóa thông tin hồ sơ theo `UserProfileResponse`.
  - **Bảo mật tuyệt đối:** Loại bỏ hoàn toàn `password_hash`, `password`, `reset_password_hash`, `reset_password_expires` khỏi payload trả về.
  - Phản hồi chuẩn RESTful Response Envelope: `{ success: true, data: userProfile, message: "Lấy thông tin người dùng thành công", timestamp: ... }`.

- **Endpoint PUT:** `PUT /api/v1/auth/profile` (Yêu cầu JWT Bearer Token qua middleware `verifyToken`)
  - Cho phép người dùng cập nhật thông tin được phép: `full_name` (hoặc `fullName`).
  - **Validation & Ràng buộc toàn vẹn:**
    - Kiểm tra `full_name` bắt buộc, không được để trống hoặc chỉ chứa khoảng trắng (`trim()`). Báo `400 VALIDATION_ERROR` ("Vui lòng nhập họ và tên.").
    - Độ dài hợp lệ từ 2 đến 100 ký tự. Báo `400 VALIDATION_ERROR` ("Họ và tên phải có độ dài từ 2 đến 100 ký tự.").
  - **Ngăn chặn can thiệp dữ liệu trái phép (Field Protection & Ownership Isolation):**
    - Chỉ cho phép chỉnh sửa `full_name`. Bỏ qua/ngăn chặn mọi hành vi ghi đè lên các trường hệ thống và bảo mật: `email`, `_id`, `created_at`, `current_level`, `total_xp`, `current_streak`, `streak_freeze_count`, `password_hash`.
    - Người dùng chỉ cập nhật được hồ sơ của chính mình dựa trên ID từ JWT token.
  - Lưu thay đổi vào MongoDB và trả về hồ sơ đã cập nhật với thông báo `"Cập nhật hồ sơ thành công"`.

### 🖥️ Phía Frontend (React 19 + TypeScript + Vite)
- **Giao diện bám sát Wireframe `Core MVP Screens.html` (Màn hình 03 / Profile & Achievements):**
  - Xây dựng component `ProfilePage` (`client/src/pages/ProfilePage.tsx`) với tiêu đề, avatar viết tắt initials, họ tên, email tài khoản, huy hiệu cấp độ "Chiến binh · Cấp X".
  - Hiển thị lưới chỉ số Gamification (`.stats-grid`): Tổng điểm kinh nghiệm tích lũy (`total_xp`), chuỗi ngày kỷ luật (`current_streak`), số lượt đóng băng chuỗi (`streak_freeze_count`).
  - Biểu mẫu chỉnh sửa thông tin cá nhân (`#profile-edit-form`):
    - Ô nhập `Họ và tên` điền sẵn thông tin hiện tại, hỗ trợ kiểm tra dữ liệu tức thời (Client-side validation inline error).
    - Ô `Email tài khoản` ở chế độ read-only/disabled kèm ghi chú giải thích bảo mật.
    - Nút `Lưu thay đổi` (với trạng thái đang lưu chống bấm lặp) và nút `Đặt lại` khôi phục thông tin ban đầu.
    - Hiển thị thông báo thành công hoặc lỗi khi gọi API.
  - Khối danh mục huy hiệu thành tích (`.badgegrid`): Các mốc huy hiệu "Khởi đầu nan", "7 ngày bền bỉ", "Cột mốc cấp 5" phản ánh đúng trạng thái hoàn thành / phấn đấu của người dùng.
- **Tích hợp luồng điều hướng & Đồng bộ trạng thái:**
  - Tích hợp chuyển màn hình giữa `Dashboard` và `ProfilePage` thông qua `Sidebar` (menu "Profile & Achievements").
  - Nút quay lại `← Về Dashboard`.
  - Cập nhật đồng bộ thông tin người dùng ngay lập tức lên Header, Sidebar và `localStorage` (`questline_user`) khi lưu hồ sơ thành công.

---

## 2. 📂 CÁC TỆP TIN THAY ĐỔI VÀ TẠO MỚI

```text
pm-subject_gamified-todo-application/
├── server/
│   ├── src/
│   │   ├── types/user.types.ts           # Bổ sung UpdateProfileDTO
│   │   ├── services/auth.service.ts       # Bổ sung getProfile và updateProfile logic
│   │   ├── controllers/auth.controller.ts # Bổ sung getProfile và updateProfile controller handlers
│   │   └── routes/auth.routes.ts          # Đăng ký GET /me và PUT /profile với verifyToken
│   └── tests/
│       └── profile.test.ts                # 12 automated integration tests bao phủ 100% kịch bản Profile
├── client/
│   ├── src/
│   │   ├── types/auth.types.ts           # Bổ sung UpdateProfileRequestDTO
│   │   ├── services/auth.service.ts       # Bổ sung getProfile và updateProfile API calls
│   │   ├── pages/ProfilePage.tsx         # Màn hình Profile & Achievements hoàn chỉnh
│   │   ├── pages/Dashboard.tsx           # Tích hợp chuyển đổi màn hình Profile và đồng bộ User state
│   │   ├── App.tsx                       # Truyền onUpdateUser vào Dashboard
│   │   ├── styles/globals.css            # Thêm CSS .profile-card, .profile-avatar, .stats-grid, .badge
│   │   └── test/
│   │       └── ProfilePage.test.tsx      # 8 unit/integration tests cho component ProfilePage
└── docs/
    ├── Sprint1.md                        # Cập nhật trạng thái [TECH-S1-10] Hoàn thành
    └── reports/
        └── TECH-S1-10-user-profile.md    # Tài liệu báo cáo chi tiết kỹ thuật
```

---

## 3. 🧪 KẾT QUẢ KIỂM THỬ (AUTOMATED TESTS)

### 🔙 Backend Tests (Jest + Supertest): `server/tests/profile.test.ts`
- **12/12 tests PASS:**
  1. Trả về 401 UNAUTHORIZED khi không cung cấp Authorization header
  2. Trả về 401 UNAUTHORIZED khi token không hợp lệ hoặc hết hạn
  3. Trả về 404 USER_NOT_FOUND khi tài khoản không tồn tại trong CSDL
  4. Trả về 200 OK cùng thông tin hồ sơ đã chuẩn hóa khi token hợp lệ (loại bỏ hoàn toàn password_hash)
  5. Trả về 401 UNAUTHORIZED khi cập nhật mà thiếu Authorization header
  6. Trả về 400 VALIDATION_ERROR khi full_name bị bỏ trống hoặc chỉ chứa khoảng trắng
  7. Trả về 400 VALIDATION_ERROR khi full_name có độ dài ít hơn 2 ký tự
  8. Trả về 400 VALIDATION_ERROR khi full_name có độ dài vượt quá 100 ký tự
  9. Trả về 404 USER_NOT_FOUND khi cập nhật user không tồn tại
  10. Cập nhật thành công họ tên hợp lệ và tự động trim()
  11. Hỗ trợ trường fullName (camelCase) từ biểu mẫu Frontend
  12. Không cho phép sửa đổi các trường hệ thống và bảo mật (`email`, `xp`, `level`, `streak`, `password_hash`)

*Tổng kiểm thử Backend toàn bộ dự án:* **8/8 test suites PASS, 71/71 tests PASS.**

### 🖥️ Frontend Tests (Vitest + React Testing Library): `client/src/test/ProfilePage.test.tsx`
- **8/8 tests PASS:**
  1. Hiển thị chính xác thông tin hồ sơ và các chỉ số gamification
  2. Khởi tạo biểu mẫu với họ tên hiện tại và trường email read-only
  3. Validate lỗi khi họ và tên rỗng hoặc ít hơn 2 ký tự
  4. Validate lỗi khi họ và tên vượt quá 100 ký tự
  5. Nút Đặt lại khôi phục giá trị họ tên ban đầu và xóa cảnh báo lỗi
  6. Cập nhật hồ sơ thành công, gọi onUpdateUser và hiển thị thông báo
  7. Hiển thị thông báo lỗi khi API cập nhật hồ sơ trả về lỗi
  8. Nút quay lại Dashboard kích hoạt callback onNavigateBack

*Tổng kiểm thử Frontend toàn bộ dự án:* **4/4 test files PASS, 34/34 tests PASS.**

---

## 4. ✅ CHECKLIST HOÀN THÀNH (DEFINITION OF DONE)
- [x] Triển khai API GET `/api/v1/auth/me` và PUT `/api/v1/auth/profile` chuẩn Envelope Pattern.
- [x] Kiểm tra phân quyền và cô lập dữ liệu theo `req.user.id`.
- [x] Loại bỏ hoàn toàn các thông tin bảo mật nhạy cảm (`password_hash`, reset tokens).
- [x] Validate chặt chẽ dữ liệu đầu vào `full_name` (2–100 ký tự).
- [x] Giao diện Profile hiển thị thông tin cá nhân và gamification stats bám sát Wireframe.
- [x] Biểu mẫu cập nhật phản hồi nhanh, cập nhật realtime trên giao diện và lưu trữ cục bộ.
- [x] 100% Unit Test & Integration Test vượt qua cả 2 tầng Frontend và Backend.
- [x] TypeScript build pass 0 lỗi trên cả Client và Server.

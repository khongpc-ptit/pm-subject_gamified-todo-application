# 📋 BÁO CÁO KỸ THUẬT: [TECH-S1-08] TRIỂN KHAI CHỨC NĂNG ĐĂNG KÝ TÀI KHOẢN (FRONTEND + BACKEND)

> **Ngày thực hiện:** 18/11/2026  
> **Người thực hiện:** Khổng Phú Cường (`@khongpc-ptit`) & AI Assistant  
> **Nhánh phát triển:** `feat/tech-s1-08-user-registration`  
> **User Story cha:** [US-S1-05] Đăng ký tài khoản (#22) thuộc [FEAT-02] Xác thực người dùng & Quản lý tài khoản (#17)  
> **Liên kết Issues:** Closes [#34](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/34), Refs [#22](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/22)

---

## 1. 🎯 MỤC TIÊU & YÊU CẦU KỸ THUẬT ĐÃ ĐẠT ĐƯỢC

### 🔙 Phía Backend REST API
- **Endpoint:** `POST /api/v1/auth/register` (Public)
- **User Schema & Data Modeling:**
  - Cập nhật Mongoose Schema `User` với email (unique, lowercase, trim, regex validation), `password_hash`, `full_name` (minlength 2, maxlength 100), và các trường Gamification mặc định: `current_level = 1`, `total_xp = 0`, `current_streak = 0`, `last_active_date = null`, `streak_freeze_count = 1`.
  - Tự động quản lý timestamps `created_at` và `updated_at`.
- **Validation & Ràng buộc nghiệp vụ:**
  - `full_name`: Bắt buộc, không được rỗng sau khi `trim()`, độ dài 2–100 ký tự. Báo `400 VALIDATION_ERROR` nếu vi phạm.
  - `email`: Bắt buộc, định dạng email hợp lệ (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`). Báo `400 VALIDATION_ERROR` nếu vi phạm.
  - `password`: Bắt buộc, tối thiểu 6 ký tự. Báo `400 VALIDATION_ERROR` nếu < 6 ký tự.
  - **Kiểm tra trùng lặp email:** Chuẩn hóa lowercase và truy vấn DB; nếu đã tồn tại báo lỗi `409 EMAIL_ALREADY_EXISTS` ("Email này đã được sử dụng.").
- **Bảo mật & Mã hóa:**
  - Mã hóa mật khẩu thô bằng **Bcrypt (salt rounds = 10)**. Không bao giờ lưu mật khẩu gốc.
  - **TUYỆT ĐỐI KHÔNG trả về `password_hash`** hoặc `password` trong API Response.
  - Ký JWT Access Token (HS256, hạn 7 ngày) đính kèm trong response.
  - Trả về chuẩn Response Envelope: `{ success: true, data: { token, user }, message: "Đăng ký tài khoản thành công", timestamp: ... }`.

### 🖥️ Phía Frontend (React 19 + TypeScript + Vite)
- **Giao diện bám sát Wireframe `Authentication.html`:**
  - Xây dựng component `RegisterForm` và trang `AuthPage` với thiết kế nhận diện thương hiệu Questline: `.login-card`, `.brand`, `.brand-mark` 'q', tab chuyển đổi Đăng nhập / Đăng ký (`#login-mode`, `#register-mode`).
  - Hỗ trợ đầy đủ Accessibility (`aria-describedby`, `aria-invalid`, `aria-live`, `aria-pressed`, `aria-controls`).
  - Nút bật/tắt hiển thị mật khẩu và xác nhận mật khẩu ("Hiện" / "Ẩn").
- **Client-side Validation:**
  - Kiểm tra họ và tên, email đúng định dạng regex, mật khẩu tối thiểu 6 ký tự, và so khớp mật khẩu xác nhận.
  - Hiển thị thông báo lỗi inline ngay dưới từng ô input và focus vào ô lỗi đầu tiên.
  - Chống duplicate submission với trạng thái loading (`disabled={isSubmitting}`).
- **Xử lý lỗi từ Server:**
  - Bắt lỗi 409 `EMAIL_ALREADY_EXISTS` từ backend và hiển thị cảnh báo ngay tại ô Email.
  - Lưu token (`questline_jwt_token`) và user profile vào `localStorage`.

---

## 2. 📂 CÁC TỆP TIN THAY ĐỔI VÀ TẠO MỚI

```text
pm-subject_gamified-todo-application/
├── server/
│   ├── src/
│   │   ├── types/user.types.ts           # IUser, RegisterDTO, UserProfileResponse, AuthResponseData
│   │   ├── models/User.ts                # Mongoose User schema với validation & index email
│   │   ├── services/auth.service.ts       # Service đăng ký, băm Bcrypt, ký JWT, lọc password_hash
│   │   ├── controllers/auth.controller.ts # Controller POST /register bọc response envelope
│   │   ├── routes/auth.routes.ts          # Định nghĩa router /api/v1/auth
│   │   └── app.ts                         # Mount router auth vào ứng dụng
│   └── tests/
│       └── auth.test.ts                   # 13 automated test cases bao phủ 100% kịch bản đăng ký
├── client/
│   ├── src/
│   │   ├── types/auth.types.ts           # UserProfile, RegisterRequestDTO, AuthResponseData
│   │   ├── services/auth.service.ts       # Axios auth client lưu trữ session LocalStorage
│   │   ├── components/RegisterForm.tsx    # Biểu mẫu đăng ký tài khoản chuẩn Wireframe
│   │   ├── pages/AuthPage.tsx             # Trang xác thực chuyển đổi tab Đăng ký / Đăng nhập
│   │   ├── styles/globals.css             # Styling auth-card, auth-switch, password-wrap, status
│   │   ├── App.tsx                        # Tích hợp điều hướng giữa AuthPage và Dashboard
│   │   └── test/
│   │       └── RegisterForm.test.tsx      # 9 component tests kiểm thử biểu mẫu & luồng đăng ký
└── docs/
    ├── Sprint1.md                         # Cập nhật trạng thái hoàn thành [TECH-S1-08]
    └── reports/
        └── TECH-S1-08-user-registration.md# Báo cáo kỹ thuật chi tiết
```

---

## 3. 🧪 KẾT QUẢ KIỂM THỬ TỰ ĐỘNG

- **Backend Tests (`npm --prefix server test`):** **28/28 tests passed** (13 test cases mới cho Auth Registration).
- **Frontend Tests (`npm --prefix client test`):** **17/17 tests passed** (9 test cases mới cho RegisterForm & AuthPage).
- **Build Server & Client (`npm run build`):** Biên dịch thành công 100% không có lỗi.

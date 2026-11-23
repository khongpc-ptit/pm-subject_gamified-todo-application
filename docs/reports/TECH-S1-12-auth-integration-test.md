# TECH-S1-12 · Authentication and Account Management Integration

> **Issue:** [#38](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/38)  
> **Parent Feature:** [FEAT-02] Xác thực người dùng & Quản lý tài khoản (#17)  
> **User Stories Covered:** US-S1-05 (#22), US-S1-06 (#23), US-S1-07 (#24), US-S1-08 (#25), US-S1-09 (#26)  
> **Status:** 100% Passed (All Acceptance Criteria Verified)  
> **Verification Date:** 23 November 2026

---

## 1. Executive Summary

Bộ kịch bản kiểm thử tích hợp toàn diện (End-to-End & Integration Tests) cho tính năng Xác thực người dùng & Quản lý tài khoản (FEAT-02) đã hoàn thành và đạt tỷ lệ kiểm thử thành công 100%. Toàn bộ 5 User Stories thành phần đã được kiểm chứng đồng bộ trên cả Backend (Node.js/Express + Mongoose + JWT) và Frontend (React + TypeScript + Vitest).

Sau khi User Story #36 (`TECH-S1-10: Xem & Cập nhật hồ sơ người dùng`) được hoàn tất, toàn bộ các tiêu chí nghiệm thu còn lại cho Profile và tính cô lập dữ liệu giữa nhiều tài khoản (User A & User B) đã được xác minh thành công.

---

## 2. Ma trận kết quả kiểm thử (Test Matrix)

| User Story | Phạm vi kiểm thử | File kịch bản kiểm thử | Kết quả | Ghi chú |
|---|---|---|---|---|
| **US-S1-05** (#22) | Đăng ký tài khoản, chuẩn hóa email, từ chối trùng lặp, băm mật khẩu Bcrypt salt=10, khởi tạo chỉ số Gamification | `server/tests/auth.test.ts`<br>`server/tests/auth.e2e.test.ts`<br>`client/src/test/RegisterForm.test.tsx` | **PASS** | Bảo vệ tuyệt đối: không để lộ `password_hash` trong API response |
| **US-S1-06** (#23) | Đăng nhập hợp lệ, chống vét cạn tài khoản (uniform error), cấp phát JWT token, đăng xuất và hủy phiên | `server/tests/login.test.ts`<br>`server/tests/auth.e2e.test.ts`<br>`client/src/test/AuthSession.integration.test.tsx` | **PASS** | Xóa sạch token khỏi `localStorage`, điều hướng về màn hình Đăng nhập |
| **US-S1-07** (#24) | Xem thông tin hồ sơ cá nhân (`GET /api/v1/auth/me`), hiển thị cấp bậc, tổng điểm XP, chuỗi ngày streak | `server/tests/profile.test.ts`<br>`server/tests/auth.e2e.test.ts`<br>`client/src/test/ProfilePage.test.tsx`<br>`client/src/test/AuthProfile.integration.test.tsx` | **PASS** | Không lộ trường nhạy cảm (`password_hash`, `reset_password_hash`) |
| **US-S1-08** (#25) | Cập nhật hồ sơ (`PUT /api/v1/auth/profile`), validate họ tên (2-100 ký tự), cô lập dữ liệu Account A và B, chống can thiệp trường hệ thống | `server/tests/profile.test.ts`<br>`server/tests/auth.e2e.test.ts`<br>`client/src/test/ProfilePage.test.tsx`<br>`client/src/test/AuthProfile.integration.test.tsx` | **PASS** | Chặn ghi đè `email`, `total_xp`, `current_level`, `streak_freeze_count`, `password_hash` |
| **US-S1-09** (#26) | Quên mật khẩu, gửi email kèm token 15 phút, đặt lại mật khẩu mới, hủy token dùng 1 lần, đăng nhập lại bằng mật khẩu mới | `server/tests/password.test.ts`<br>`server/tests/password.integration.test.ts`<br>`server/tests/auth.e2e.test.ts`<br>`client/src/test/PasswordReset.integration.test.tsx` | **PASS** | Mật khẩu cũ bị vô hiệu hóa; token đã dùng bị từ chối với mã 400 |

---

## 3. Nghiệm thu chi tiết Hồ sơ người dùng sau #36 (Profile Acceptance)

1. **Khởi tạo và hiển thị thông tin:**
   - Tạo 2 tài khoản thử nghiệm A (`usera@isolation.test`) và B (`userb@isolation.test`).
   - Đăng nhập với tài khoản A: Màn hình Profile hiển thị đúng tên, email, cấp bậc, tổng điểm XP và chuỗi streak.
2. **Cập nhật họ tên và đồng bộ trạng thái:**
   - Cập nhật tên mới cho A qua form Profile (`PUT /api/v1/auth/profile`).
   - Tên mới được lưu vào CSDL, hiển thị đồng bộ trên thanh điều hướng Sidebar và phản ánh chính xác qua `GET /api/v1/auth/me`.
3. **Validation dữ liệu đầu vào:**
   - Gửi họ tên rỗng (`"   "`), tên 1 ký tự (`"A"`), hoặc tên dài hơn 100 ký tự: Hệ thống chặn validation ở cả Client (báo lỗi trên form không gửi API) và Backend (trả về `400 VALIDATION_ERROR`).
   - Dữ liệu họ tên cũ trong CSDL được bảo toàn nguyên vẹn sau khi validation thất bại.
4. **Cô lập dữ liệu đa người dùng (Multi-tenant Isolation):**
   - Tài khoản A cập nhật họ tên: Hồ sơ của tài khoản B hoàn toàn không bị ảnh hưởng.
   - Gọi `GET /api/v1/auth/me` với token B vẫn giữ nguyên thông tin ban đầu của B.
5. **Bảo vệ trường hệ thống (Shielding System Fields):**
   - Tài khoản A cố tình truyền payload chứa `total_xp: 99999`, `current_level: 99`, `email: "hacker@test.com"`, `password_hash: "..."`.
   - Backend chỉ cập nhật `full_name`, toàn bộ các trường hệ thống và bảo mật được giữ nguyên giá trị hợp lệ.
6. **Xác thực bảo mật (Access Control):**
   - Mọi yêu cầu không có Bearer token, token sai chữ ký, hoặc token hết hạn đều bị từ chối ngay lập tức với mã phản hồi `401 UNAUTHORIZED`.

---

## 4. Hướng dẫn chạy và tái hiện kiểm thử (Reproduction Guide)

### Cài đặt môi trường
```bash
npm --prefix server install
npm --prefix client install
```

### Chạy kiểm thử tự động Backend (Server)
```bash
# Chạy toàn bộ 9 test suites của server
npm --prefix server test

# Chạy riêng kịch bản End-to-End Authentication Lifecycle
npm --prefix server test -- tests/auth.e2e.test.ts

# Chạy kiểm thử tích hợp trực tiếp với MongoDB (nếu có môi trường DB cục bộ)
TEST_MONGODB_URI="mongodb://localhost:27017" npm --prefix server test -- tests/auth.integration.test.ts tests/password.integration.test.ts
```

### Chạy kiểm thử tự động Frontend (Client)
```bash
# Chạy toàn bộ 8 test suites của client
npm --prefix client test -- --run

# Chạy riêng kiểm thử điều hướng và cập nhật hồ sơ người dùng
npm --prefix client test -- --run src/test/AuthProfile.integration.test.tsx src/test/AuthSession.integration.test.tsx
```

### Kiểm tra build sản phẩm
```bash
npm --prefix server run build
npm --prefix client run build
```

---

## 5. Kết luận nghiệm thu (Acceptance Conclusion)

- **Tổng số test suites đạt chuẩn:** 9 server suites (74 tests passed) + 8 client suites (47 tests passed) = **121 passing tests**, 0 flaky tests.
- **Biên dịch TypeScript:** 0 lỗi cú pháp / type checking ở cả client và server.
- **Kết luận:** Technical Task `[TECH-S1-12]` và User Story cha `[FEAT-02]` đã đạt 100% điều kiện nghiệm thu, sẵn sàng cho Tech Lead xem xét và đóng Sprint 1.

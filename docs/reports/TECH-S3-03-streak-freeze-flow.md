# 📋 BÁO CÁO KỸ THUẬT: [TECH-S3-03] TRIỂN KHAI API & GIAO DIỆN ĐÓNG BĂNG CHUỖI (STREAK FREEZE FLOW)

> **Ngày thực hiện:** 25/11/2026  
> **Người thực hiện:** Lê Mạnh Hùng (`@mhunglee20405`)  
> **Nhánh phát triển:** `feat/tech-s3-03-streak-freeze-flow`  
> **Pull Request:** Target `develop`  
> **User Story cha:** [US-S3-02] Sử dụng đóng băng chuỗi (Streak Freeze)  
> **Liên kết Issues:** Closes [#75](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/75)  
> **Tài liệu tham chiếu:** [`docs/[DOC-11] System Design Document.md`](../[DOC-11]%20System%20Design%20Document.md) (Mục 3.2, 4.2), [`docs/[TECH-S3-01] Badges, Streak & Notification API Contract.md`](../[TECH-S3-01]%20Badges,%20Streak%20&%20Notification%20API%20Contract.md) (Mục 2.4, 4.1), [`docs/plan.md`](../plan.md) (US-S3-02)

---

## 1. 🎯 MỤC TIÊU & KẾT QUẢ KỸ THUẬT

### 1.1. Backend (`POST /api/v1/gamification/freeze-streak`)
- **Xác thực bảo mật:** Áp dụng `authMiddleware` (`verifyToken` JWT Bearer HS256) bảo vệ route `/api/v1/gamification/freeze-streak`.
- **Xử lý nghiệp vụ tại `gamificationService.freezeStreak(userId)`:**
  - Tuần tự hóa thao tác trên cùng người dùng qua hàng đợi `withUserXP` chống race condition khi có request đồng thời.
  - Kiểm tra `user.streak_freeze_count > 0`; nếu `<= 0` trả về `400 Bad Request` (`NO_FREEZE_REMAINING`: `"Bạn không còn lượt đóng băng chuỗi nào để sử dụng."`).
  - Kiểm tra trạng thái đã bảo vệ trong ngày (`streak_frozen_date === todayVN` theo `Asia/Ho_Chi_Minh` UTC+7) để tránh trừ trùng lượt đóng băng.
  - Trừ `1` lượt `streak_freeze_count`, ghi nhận `streak_frozen_date = YYYY-MM-DD` và phản hồi theo chuẩn **JSON Envelope Pattern** (`success`, `data: { streak_freeze_count, current_streak, is_protected, frozen_date, message }`, `message`, `timestamp`).
- **Đồng bộ với Cronjob `00:05 UTC+7` (`server/src/cron/streakResetJob.ts`):**
  - Khi người dùng đã chủ động đóng băng chuỗi trong ngày hôm qua (`user.streak_frozen_date === yesterdayStr`), đợt quét tự động lúc `00:05 UTC+7` giữ nguyên `current_streak` (`MAINTAIN_FREEZE`) mà không reset về 0 và không trừ thêm lượt đóng băng lần hai.

### 1.2. Frontend (`StreakCard.tsx` & `gamificationService.ts`)
- **API Client (`client/src/services/gamificationService.ts`):** Kết nối `POST /api/v1/gamification/freeze-streak` qua `apiClient` có đính kèm JWT token.
- **Component `StreakCard` (`client/src/components/gamification/StreakCard.tsx`):**
  - Hiển thị số ngày `current_streak` hiện tại kèm biểu tượng ngọn lửa rực sáng (`.streak-card-flame.active`).
  - Hiển thị số lượt đóng băng còn lại kèm biểu tượng bông tuyết `❄️`.
  - Nút **Kích hoạt đóng băng khẩn cấp** mở hộp thoại xác nhận (**Confirmation Dialog**, chuẩn WAI-ARIA `role="dialog"`, `aria-modal="true"`), hỗ trợ đóng qua `Hủy`, `✕`, backdrop hoặc phím `Escape`.
  - Quản lý trạng thái loading (`Đang kích hoạt…`), chặn double-submit, bắn Toast notification thành công/thất bại và đồng bộ thời gian thực qua `GamificationContext` lên `Header`, `Dashboard` và `HabitsPage`.

---

## 2. 🧪 KẾT QUẢ KIỂM THỬ & XÁC MINH

- **Backend (`Jest` + `Supertest`):**
  - Kịch bản mới `server/tests/streak-freeze.test.ts`: **9 passed** (bao phủ 401 JWT, default 1 freeze, 200 OK envelope, 400 `NO_FREEZE_REMAINING`, 400 `STREAK_ALREADY_FROZEN`, 404 `USER_NOT_FOUND`, chống race condition đồng thời, tích hợp Cronjob `processUserStreak`).
  - Toàn bộ dự án Backend: **17/17 active test suites passed** (196 tests passed, 0 failures), `npm run build` (`tsc`) đạt 0 lỗi.
- **Frontend (`Vitest` + `React Testing Library`):**
  - Kịch bản mới `client/src/test/StreakFreeze.test.tsx`: **7 passed** (API service, render UI, confirmation dialog, loading & chống double-click, error toast 400, disabled khi hết lượt, tích hợp `HabitsPage`).
  - Toàn bộ dự án Frontend: **13/13 test files passed** (81 tests passed, 0 failures), `npm run lint` (`oxlint`) 0 lỗi, `npm run build` (`tsc -b && vite build`) thành công.

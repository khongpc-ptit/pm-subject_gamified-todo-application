# 📋 BÁO CÁO KỸ THUẬT: [TECH-S3-04] XÂY DỰNG DỊCH VỤ KÍCH HOẠT HUY HIỆU TỰ ĐỘNG (BADGE TRIGGER ENGINE)

> **Ngày thực hiện:** 25/11/2026  
> **Người thực hiện:** Lê Mạnh Hùng (`@mhunglee20405`)  
> **Nhánh phát triển:** `feat/tech-s3-04-badge-trigger-engine`  
> **Pull Request:** Target `develop`  
> **User Story cha:** [US-S3-03] Mở khóa huy hiệu thành tích (Badges)  
> **Liên kết Issues:** Closes [#76](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/76)  
> **Tài liệu tham chiếu:** [`docs/[DOC-11] System Design Document.md`](../[DOC-11]%20System%20Design%20Document.md) (Mục 3.2, 4.2), [`docs/[TECH-S3-01] Badges, Streak & Notification API Contract.md`](../[TECH-S3-01]%20Badges,%20Streak%20&%20Notification%20API%20Contract.md) (Mục 2.1–2.3, 5), [`docs/plan.md`](../plan.md) (US-S3-03)

---

## 1. 🎯 MỤC TIÊU & KẾT QUẢ KỸ THUẬT

### 1.1. Dịch vụ Kích hoạt Huy hiệu Tự động (`server/src/services/badgeService.ts`)
- Triển khai `BadgeService.checkAndAwardBadges(userId: string): Promise<IBadge[]>` (export cả singleton `badgeService` và hàm `checkAndAwardBadges`).
- Quét và đánh giá tự động 3 nhóm điều kiện từ Collection `badges`:
  1. **`TASK_COUNT`:** Đếm số lượng công việc hoàn thành (`Task.countDocuments({ user_id, status: 'COMPLETED' })`) so sánh với `FIRST_TASK` (1), `TASK_10` (10), `TASK_50` (50), `TASK_100` (100).
  2. **`STREAK_DAYS`:** Đối chiếu `user.current_streak` với `STREAK_3` (3), `STREAK_7` (7), `STREAK_30` (30).
  3. **`LEVEL_REACH`:** Đối chiếu `user.current_level` với `LEVEL_2` (2), `LEVEL_5` (5), `LEVEL_10` (10).
- **Cơ chế Idempotency (Chống cấp trùng tuyệt đối):**
  - Lọc bỏ toàn bộ `badge_id` đã tồn tại trong `user_badges` trước khi cấp phát.
  - Bắt lỗi trùng khóa MongoDB `E11000` từ Unique Compound Index `{ user_id: 1, badge_id: 1 }` để ngăn chặn race condition và không sinh thông báo trùng lặp.
- **Phát thông báo thành tích:** Với mỗi huy hiệu mới mở khóa, tự động chèn bản ghi vào Collection `notifications` (`type: 'ACHIEVEMENT'`, `title: 'Chúc mừng mở khóa huy hiệu!'`, `message: 'Bạn đã đạt được huy hiệu ${badge.title}'`, `is_read: false`).

### 1.2. Tích hợp Kích hoạt Tự động (4 điểm kích hoạt)
- **Hoàn thành Task (`server/src/services/task.service.ts`):** Gọi `badgeService.checkAndAwardBadges(userId)` trong `completeTaskForUser` (trả kèm mảng `unlocked_badges` trong response) và khi cập nhật trạng thái sang `COMPLETED` trong `updateTaskForUser`.
- **Check-in Thói quen (`server/src/services/habit.service.ts`):** Gọi `badgeService.checkAndAwardBadges(userId)` trong `checkInHabit` và trả kèm `unlocked_badges` trong `CheckInHabitResponseData`.
- **Thăng cấp Level (`server/src/services/level.service.ts`):** Gọi `badgeService.checkAndAwardBadges(userId)` trong `processXPAddition` khi `result.level_up === true`.
- **Cronjob Quét Chuỗi Streak (`server/src/cron/streakResetJob.ts`):** Gọi `badgeService.checkAndAwardBadges(userIdStr)` trong `processUserStreak` khi `action === 'INCREMENT'`.

---

## 2. 🧪 KẾT QUẢ KIỂM THỬ & XÁC MINH

- **Kịch bản mới (`server/tests/badge.service.test.ts`):** **11/11 passed** (bao phủ đủ 3 loại điều kiện `TASK_COUNT`, `STREAK_DAYS`, `LEVEL_REACH`, mở khóa đồng thời nhiều huy hiệu, bỏ qua huy hiệu đã có, bắt lỗi `E11000` race condition, và xác minh đủ 4 điểm tích hợp Task/Habit/Level/Streak Cronjob).
- **Toàn bộ dự án Backend (`Jest`):** **17/17 active test suites passed** (**197 tests passed**, 0 failures).
- **Biên dịch TypeScript (`npm run build`):** `tsc` đạt 0 lỗi.

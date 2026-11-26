# 📋 BÁO CÁO KIỂM THỬ: [TECH-S3-08] KIỂM THỬ TỰ ĐỘNG TÍCH HỢP STREAK, BADGES & NOTIFICATIONS

> **Ngày thực hiện:** 26/11/2026  
> **Người thực hiện:** Lê Mạnh Hùng (`@mhunglee20405`)  
> **Nhánh phát triển:** `test/tech-s3-08-streak-badges-notifications-test`  
> **Pull Request:** Target `develop`  
> **Phạm vi User Stories:** Toàn bộ `[US-S3-01]` → `[US-S3-05]` (Kiểm thử tích hợp Sprint 3)  
> **Liên kết Issues:** Closes [#80](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/80)  
> **Tài liệu tham chiếu:** [`docs/plan.md`](../plan.md) (Sprint 3), [`docs/[DOC-11] System Design Document.md`](../[DOC-11]%20System%20Design%20Document.md), [`docs/[TECH-S3-01] Badges, Streak & Notification API Contract.md`](../[TECH-S3-01]%20Badges,%20Streak%20&%20Notification%20API%20Contract.md)

---

## 1. 🎯 PHẠM VI BỘ KIỂM THỬ ĐÃ TRIỂN KHAI

1. **Streak & Freeze Suite ([`server/tests/streak.test.ts`](../../server/tests/streak.test.ts)):**
   - Kiểm tra quy đổi múi giờ Việt Nam `UTC+7` (`Asia/Ho_Chi_Minh`) không lệch ngày tại ranh giới nửa đêm `16:59:59.999Z` ↔ `17:00:00.000Z`, đầu tháng và giao thừa.
   - Kiểm tra Cronjob `processUserStreak` / `runStreakScan`: tăng streak (+1) khi có Task hoàn thành hoặc Habit check-in hôm qua; tự động trừ 1 freeze và tạo thông báo `REMINDER` khi vắng mặt; reset `current_streak = 0` khi hết freeze.
   - Kiểm tra API `POST /api/v1/gamification/freeze-streak` (401 khi thiếu JWT, 200 OK khi còn lượt freeze, 400 `NO_FREEZE_REMAINING` khi hết lượt).
   - Kèm kịch bản tích hợp MongoDB thật (`describeWithMongo`) chạy trên GitHub Actions CI (`TEST_MONGODB_URI`).

2. **Badges Suite ([`server/tests/badges.test.ts`](../../server/tests/badges.test.ts)):**
   - Mở khóa huy hiệu `FIRST_TASK` ngay lần đầu hoàn thành task và phát thông báo `ACHIEVEMENT`.
   - Mở khóa huy hiệu `STREAK_7` khi đạt chuỗi 7 ngày liên tục qua Cronjob.
   - Xác minh Unique Compound Index `{ user_id: 1, badge_id: 1 }` trên Schema `UserBadge` và cơ chế chống cấp trùng khi gặp lỗi `E11000`.
   - Kiểm tra API `GET /api/v1/gamification/badges` trả về đúng cờ `is_unlocked: true/false`, `unlocked_at` và tiến độ `%`.
   - Kèm kịch bản tích hợp MongoDB thật (`describeWithMongo`) kiểm tra thực tế Unique Index `11000` và toàn bộ luồng E2E.

3. **Notifications Suite ([`server/tests/notifications.test.ts`](../../server/tests/notifications.test.ts)):**
   - Tự động tạo thông báo loại `ACHIEVEMENT` khi mở khóa huy hiệu.
   - Kiểm tra API `GET /api/v1/notifications` trả về đúng danh sách thông báo và `unread_count`.
   - Kiểm tra API `PATCH /api/v1/notifications/:id/read` (bao gồm 400 `INVALID_ID`) và `PATCH /api/v1/notifications/read-all`.
   - Kiểm tra nghiêm ngặt **Data Isolation**: User B không thể xem hay đánh dấu đã đọc thông báo của User A (`404 NOTIFICATION_NOT_FOUND`).
   - Kèm kịch bản tích hợp MongoDB thật (`describeWithMongo`) xác minh toàn bộ luồng trên CSDL thực.

---

## 2. 🧪 KẾT QUẢ CHẠY KIỂM THỬ & BUILD

- **Backend (`server/`):**
  - `npm test` (`jest --runInBand`): **20/20 active test suites passed** (**225 tests passed**, 0 failures).
  - `npm run build` (`tsc`): **0 lỗi biên dịch**.
- **Frontend (`client/`):**
  - `npm test` (`vitest run`): **15/15 test files passed** (**87 tests passed**, 0 failures).
  - `npm run lint` (`oxlint`): **0 errors**.
  - `npm run build` (`tsc -b && vite build`): **Build thành công**.

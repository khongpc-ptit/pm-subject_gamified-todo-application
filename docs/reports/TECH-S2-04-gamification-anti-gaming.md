# 📋 BÁO CÁO KỸ THUẬT: [TECH-S2-04] XÂY DỰNG GAMIFICATION CORE ENGINE & CHỐNG GIAN LẬN (ANTI-GAMING)

> **Ngày thực hiện:** 24/11/2026  
> **Người thực hiện:** Lê Mạnh Hùng (`@mhunglee20405`) & AI Assistant  
> **Nhánh phát triển:** `feat/tech-s2-04-gamification-anti-gaming`  
> **Pull Request:** Target `develop`  
> **User Story cha:** [US-S2-04] Cơ chế giới hạn điểm thưởng và hoàn tác (Anti-gaming) thuộc [FEAT-03] Gamification Engine  
> **Liên kết Issues:** Closes [#59](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/59)  
> **Tài liệu tham chiếu:** [`docs/[DOC-11] System Design Document.md`](../[DOC-11]%20System%20Design%20Document.md) (Mục 4.3), [`docs/[TECH-S2-01] Habit Data Model & Gamification API Contract.md`](../[TECH-S2-01]%20Habit%20Data%20Model%20&%20Gamification%20API%20Contract.md) (Mục 5, Mục 7)

---

## 1. 🎯 MỤC TIÊU & YÊU CẦU KỸ THUẬT ĐÃ ĐẠT ĐƯỢC

### 🔙 Gamification Core Engine (`server/src/services/gamification.service.ts` & `gamificationService.ts`)
- **Quy đổi điểm thưởng XP (`calculateTaskXP`):**
  - Task ưu tiên Thấp (`LOW`): **+10 XP**
  - Task ưu tiên Trung bình (`MEDIUM`): **+20 XP** (mặc định)
  - Task ưu tiên Cao (`HIGH`): **+30 XP**
  - Check-in thói quen (`HABIT` / `CHECK_IN`): **+15 XP**
  - Hỗ trợ chuẩn hóa hoa/thường (`low`, `Medium`, `HIGH`) và xử lý an toàn giá trị rỗng/không xác định.

- **Cơ chế chống gian lận & Kiểm soát trần điểm hàng ngày (`checkDailyXPCap`):**
  - **Múi giờ Việt Nam (`Asia/Ho_Chi_Minh` UTC+7):** Tính toán chính xác chuỗi ngày `YYYY-MM-DD` và khung thời gian từ `00:00:00` đến `23:59:59.999` theo giờ Việt Nam. Đảm bảo trần điểm tự động reset chính xác vào lúc 00:00 nửa đêm.
  - **Tổng hợp XP trong ngày (`getCurrentDayXP`):** Tổng XP = tổng XP các Tasks hoàn thành trong ngày + tổng XP các Habit logs check-in trong ngày.
  - **Quy tắc Daily XP Cap = 200 XP:**
    - Nếu `currentDayXP >= 200`: `xp_earned = 0`, trả về cờ `is_cap_reached = true`, `remaining_xp = 0`.
    - Nếu `currentDayXP + xpToAdd > 200`: `xp_earned = Math.max(0, 200 - currentDayXP)`, trả về cờ `is_cap_reached = true`, `remaining_xp = 0`.
    - Nếu `currentDayXP + xpToAdd <= 200`: `xp_earned = xpToAdd`, `is_cap_reached = (currentDayXP + xp_earned >= 200)`, `remaining_xp = 200 - (currentDayXP + xp_earned)`.

- **Cơ chế hoàn tác điểm thưởng (`revertTaskXP`):**
  - Khi người dùng chuyển trạng thái Task từ `COMPLETED` ngược lại `TODO` hoặc `IN_PROGRESS`, tự động trừ đúng số điểm kinh nghiệm tương ứng khỏi `user.total_xp`.
  - Đảm bảo `user.total_xp >= 0` (không bao giờ âm).
  - Tự động tính toán lại `user.current_level` theo công thức Level chuẩn $L = \lfloor \sqrt{\text{Total\_XP}} / 10 \rfloor + 1$ (tự động giáng cấp nếu điểm rơi xuống dưới ngưỡng).

### 🔌 Tích hợp Task APIs
- **API Hoàn thành công việc: `PATCH /api/v1/tasks/:id/complete`:**
  - Tích hợp `gamificationService.calculateTaskXP` và `gamificationService.checkDailyXPCap`.
  - Cập nhật `user.total_xp`, `user.last_active_date`, `user.current_level` và cờ `level_up`.
  - Lưu `task.xp_earned` và trả về chuẩn Response Envelope chứa dữ liệu Gamification (`xp_earned`, `total_xp`, `current_level`, `level_up`, `next_level_xp`, `is_cap_reached`).
  - Đảm bảo tính Idempotent: Gọi complete lần 2 trên task đã xong không cộng thêm XP (`xp_earned = 0`).
- **API Cập nhật công việc: `PUT /api/v1/tasks/:id`:**
  - Khi chuyển từ `COMPLETED` sang `TODO` / `IN_PROGRESS`: Gọi `revertTaskXP`, reset `completed_at = null`, `xp_earned = 0`.
  - Khi chuyển từ `TODO` sang `COMPLETED`: Tự động gán `completed_at`, kiểm tra Daily Cap và cộng XP cho người dùng.

---

## 2. 📂 CÁC TỆP TIN THAY ĐỔI VÀ TẠO MỚI

```text
pm-subject_gamified-todo-application/
├── server/
│   ├── src/
│   │   ├── types/
│   │   │   ├── gamification.types.ts       # Định nghĩa DailyXPCapResult, RevertXPResult, CompleteTaskGamificationData
│   │   │   └── task.types.ts               # Bổ sung xp_earned?: number vào ITask
│   │   ├── models/
│   │   │   └── Task.ts                     # Thêm trường xp_earned (default: 0) vào taskSchema
│   │   ├── services/
│   │   │   ├── gamification.service.ts     # Core Engine: calculateTaskXP, checkDailyXPCap, revertTaskXP, UTC+7 helpers
│   │   │   ├── gamificationService.ts      # Re-export theo chuẩn camelCase
│   │   │   └── task.service.ts             # Tích hợp gamification vào completeTask và updateTask (revert XP)
│   │   └── controllers/
│   │       └── task.controller.ts          # Cập nhật thông báo kèm XP hoặc thông báo chạm trần 200 XP
│   └── tests/
│       └── gamification.service.test.ts    # 25 automated unit tests bao phủ 100% các nhánh
└── docs/
    └── reports/
        └── TECH-S2-04-gamification-anti-gaming.md # Báo cáo chi tiết kỹ thuật
```

---

## 3. 🧪 KẾT QUẢ KIỂM THỬ (AUTOMATED TESTS)

### 🔙 Gamification Core Tests: `server/tests/gamification.service.test.ts`
- **25/25 tests PASS:**
  1. `calculateTaskXP`: trả về 10 XP cho LOW
  2. `calculateTaskXP`: trả về 20 XP cho MEDIUM
  3. `calculateTaskXP`: trả về 30 XP cho HIGH
  4. `calculateTaskXP`: trả về 15 XP cho HABIT / CHECK_IN
  5. `calculateTaskXP`: trả về mặc định 20 XP khi không truyền hoặc giá trị lạ
  6. `getVietnamDateString`: định dạng YYYY-MM-DD theo múi giờ `Asia/Ho_Chi_Minh`
  7. `getVietnamDayRangeUTC`: bao phủ chính xác 00:00:00 đến 23:59:59.999 giờ VN
  8. `calculateLevel`: tính toán chính xác $L = \lfloor \sqrt{X}/10 \rfloor + 1$
  9. `calculateRequiredXP` & `calculateNextLevelXP`: tính đúng điểm ngưỡng
  10. `getCurrentDayXP`: tính tổng XP từ task completed và habit logs trong ngày
  11. `getCurrentDayXP`: trả về 0 khi không có hoạt động trong ngày
  12. `checkDailyXPCap`: cộng đủ XP khi chưa chạm trần
  13. `checkDailyXPCap`: chạm đúng trần 200 XP và đánh dấu `is_cap_reached = true`
  14. `checkDailyXPCap`: vượt trần 200 XP -> điều chỉnh số XP thực nhận = `max(0, 200 - currentDayXP)`
  15. `checkDailyXPCap`: đã đạt trần 200 XP -> trả về `xp_earned = 0` và `is_cap_reached = true`
  16. `checkDailyXPCap`: nếu currentDayXP > 200 -> trả về `xp_earned = 0` và `is_cap_reached = true`
  17. `checkDailyXPCap`: xử lý an toàn khi xpToAdd là 0 hoặc số âm
  18. `revertTaskXP`: trừ đúng số XP và cập nhật DB
  19. `revertTaskXP`: đảm bảo total_xp không âm khi trừ nhiều hơn điểm hiện có
  20. `revertTaskXP`: tự động giáng cấp nếu total_xp rơi xuống dưới ngưỡng cấp bậc
  21. `revertTaskXP`: ném lỗi 404 USER_NOT_FOUND khi không tìm thấy người dùng
  22. Task Complete API: tính XP theo độ ưu tiên HIGH (+30 XP) và cập nhật level
  23. Task Complete API: chặn cộng điểm khi đã chạm trần 200 XP trong ngày
  24. Task Complete API: idempotent retry không cộng thêm XP
  25. Task Update API: tự động gọi `revertTaskXP` khi đổi status COMPLETED về TODO

*Toàn bộ test suites Backend:* **12/12 passed (3 skipped integration), 125/125 tests passed.**  
*Toàn bộ test suites Frontend:* **9/9 test files, 53/53 tests passed.**  
*Toàn bộ dự án build:* **0 compile error, 0 lint error.**

---

## 4. ✅ CHECKLIST HOÀN THÀNH (DEFINITION OF DONE)
- [x] Code hoàn thành và đáp ứng toàn bộ yêu cầu kỹ thuật.
- [x] Logic tính XP theo priority (LOW 10, MEDIUM 20, HIGH 30, Habit 15).
- [x] Daily XP Cap = 200 XP chuẩn múi giờ Việt Nam (UTC+7, reset lúc 00:00).
- [x] Revert XP hoạt động chính xác khi hoàn tác task về TODO.
- [x] Tích hợp vào `PATCH /api/v1/tasks/:id/complete` và `PUT /api/v1/tasks/:id`.
- [x] 100% automated tests vượt qua.

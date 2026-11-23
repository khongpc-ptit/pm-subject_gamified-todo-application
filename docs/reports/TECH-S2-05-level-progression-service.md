# 📋 BÁO CÁO KỸ THUẬT: [TECH-S2-05] TRIỂN KHAI DỊCH VỤ TÍNH TOÁN CẤP ĐỘ (LEVEL PROGRESSION SERVICE)

> **Ngày thực hiện:** 24/11/2026  
> **Người thực hiện:** Lê Mạnh Hùng (`@mhunglee20405`) & AI Assistant  
> **Nhánh phát triển:** `feat/tech-s2-05-level-progression-service`  
> **Pull Request:** Target `develop`  
> **User Story cha:** [US-S2-05] Thăng cấp độ và theo dõi thanh tiến trình thuộc [FEAT-03] Gamification Engine  
> **Liên kết Issues:** Closes [#60](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/60)  
> **Tài liệu tham chiếu:** [`docs/[DOC-11] System Design Document.md`](../[DOC-11]%20System%20Design%20Document.md) (Mục 4.3), [`docs/[TECH-S2-01] Habit Data Model & Gamification API Contract.md`](../[TECH-S2-01]%20Habit%20Data%20Model%20&%20Gamification%20API%20Contract.md) (Mục 6)

---

## 1. 🎯 MỤC TIÊU & YÊU CẦU KỸ THUẬT ĐÃ ĐẠT ĐƯỢC

### 🔙 Thuật toán & Dịch vụ Quản lý Cấp bậc (`server/src/services/levelService.ts` & `server/src/utils/gamificationUtils.ts`)
- **Công thức tính cấp độ chuẩn (`calculateLevel`):**
  $$\text{Level}(X) = \left\lfloor \frac{\sqrt{X}}{10} \right\rfloor + 1$$
  - Trong đó: $X = \text{user.total\_xp}$.
  - Xác thực và kiểm thử chính xác các mốc biên:
    - `0 – 99 XP` $\rightarrow$ **Level 1**
    - `100 – 399 XP` $\rightarrow$ **Level 2** (100 XP chạm ngưỡng lên cấp 2)
    - `400 – 899 XP` $\rightarrow$ **Level 3** (400 XP chạm ngưỡng lên cấp 3)
    - `900 – 1599 XP` $\rightarrow$ **Level 4** (900 XP chạm ngưỡng lên cấp 4)
    - `1600 – 2499 XP` $\rightarrow$ **Level 5** (1600 XP chạm ngưỡng lên cấp 5)
    - `2500 – 3599 XP` $\rightarrow$ **Level 6**
    - `3600 XP+` $\rightarrow$ **Level 7+**
  - Xử lý an toàn các giá trị đầu vào dị thường: số âm, 0, null, undefined, NaN đều trả về Level 1 an toàn.

- **Điểm kinh nghiệm ngưỡng để đạt cấp (`calculateRequiredXP`):**
  $$\text{Required\_XP}(L) = (10 \times (L - 1))^2$$
  - Mốc mẫu: Level 1: 0 XP; Level 2: 100 XP; Level 3: 400 XP; Level 4: 900 XP; Level 5: 1600 XP; Level 6: 2500 XP.

- **Điểm kinh nghiệm cần thiết để lên cấp tiếp theo (`calculateNextLevelXP`):**
  $$\text{Next\_Level\_XP}(L) = (10 \times L)^2$$
  - Mốc mẫu: Level 1: 100 XP; Level 2: 400 XP; Level 3: 900 XP; Level 4: 1600 XP; Level 5: 2500 XP; Level 6: 3600 XP.

- **Tỷ lệ phần trăm tiến trình trong cấp hiện tại (`calculateProgressPercent`):**
  $$\text{Progress\_Percent} = \min\left(100, \max\left(0, \frac{\text{Total\_XP} - \text{Required\_XP}(L)}{\text{Next\_Level\_XP}(L) - \text{Required\_XP}(L)} \times 100\% \right)\right)$$
  - Chống lỗi chia cho 0: Kiểm tra `range = Next_Level_XP - Required_XP`. Nếu $\le 0$, trả về 0%.
  - Giới hạn phạm vi: `[0%, 100%]`.
  - Làm tròn 2 chữ số thập phân (`round(percent * 100) / 100`).

- **Hệ thống Danh hiệu Cấp bậc (`getLevelTitle`):**
  - Level 1: **Tập sự** *(Novice)*
  - Level 2: **Chiến binh** *(Warrior)*
  - Level 3: **Tinh anh** *(Elite)*
  - Level 4: **Cao thủ** *(Master)*
  - Level 5: **Chuyên gia** *(Expert)*
  - Level 6+: **Huyền thoại** *(Legendary)*

- **Logic kiểm tra thăng cấp tự động (`checkLevelProgression` / `levelService.checkLevelUp`):**
  - So sánh `old_level` và `new_level`.
  - Nếu `new_level > old_level`: Đánh dấu `level_up = true`.
  - Hỗ trợ nhảy nhiều cấp độ cùng lúc (multi-level jump).
  - Khi revert XP: `new_level < old_level`, `level_up = false`.

- **Tích hợp Database & Persistence (`LevelService`):**
  - `processXPAddition(userId, xpToAdd)`: Tự động cập nhật `total_xp` và `current_level` vào User model trong MongoDB, lưu database và trả về `LevelUpResult`.
  - `getUserLevelProgress(userId)`: Truy xuất hồ sơ người dùng và trả về đối tượng `LevelProgress` đầy đủ (`current_level`, `total_xp`, `required_xp`, `next_level_xp`, `current_level_xp`, `level_xp_range`, `progress_percent`, `title`, `title_en`).

---

## 2. 📂 CÁC TỆP TIN THAY ĐỔI VÀ TẠO MỚI

```text
pm-subject_gamified-todo-application/
├── server/
│   ├── src/
│   │   ├── types/
│   │   │   ├── level.types.ts              # Định nghĩa LevelTitleInfo, LevelProgress, LevelUpResult
│   │   │   └── gamification.types.ts       # Re-export level.types
│   │   ├── utils/
│   │   │   └── gamificationUtils.ts        # Thuật toán tính Level, Required_XP, Next_Level_XP, Progress_Percent, Titles
│   │   ├── services/
│   │   │   ├── level.service.ts            # LevelService implementation với DB operations
│   │   │   ├── levelService.ts             # Re-export alias LevelService & levelService
│   │   │   ├── gamification.service.ts     # Re-export và đồng bộ với gamificationUtils
│   │   │   └── task.service.ts             # Tích hợp levelService.checkLevelUp và trả về progress_percent
│   └── tests/
│       └── level.service.test.ts           # 26 unit test cases bao phủ 100% các nhánh
├── client/
│   └── src/
│       └── utils/
│           └── gamificationUtils.ts        # Frontend utility đồng bộ cho TECH-S2-07
└── docs/
    └── reports/
        └── TECH-S2-05-level-progression-service.md # Báo cáo kỹ thuật chi tiết
```

---

## 3. 🧪 KẾT QUẢ KIỂM THỬ (TEST RESULTS)

- **Backend Unit Tests:**
  ```bash
  npm --prefix server test -- tests/level.service.test.ts
  ```
  - **Kết quả:** 26/26 tests passed (100% pass).
  - Toàn bộ test suite backend: 13 passed test suites (151 tests passed, 0 failures).

- **Client Tests:**
  ```bash
  npm --prefix client test
  ```
  - **Kết quả:** 9/9 test files passed (53 tests passed).

- **Build Check:**
  - `server`: `tsc` $\rightarrow$ 0 lỗi biên dịch.
  - `client`: `tsc -b && vite build` $\rightarrow$ Build thành công.

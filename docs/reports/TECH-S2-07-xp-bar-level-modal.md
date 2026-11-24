# 📋 BÁO CÁO KỸ THUẬT: [TECH-S2-07] TÍCH HỢP XP BAR, LEVEL BADGE & MODAL LEVEL UP TRÊN FRONTEND

> **Ngày thực hiện:** 24/11/2026  
> **Người thực hiện:** Lê Mạnh Hùng (`@mhunglee20405`) & AI Assistant  
> **Nhánh phát triển:** `feat/tech-s2-07-xp-bar-level-modal`  
> **Pull Request:** Target `develop`  
> **User Story cha:** [US-S2-05] Thăng cấp độ và theo dõi thanh tiến trình (Refs [US-S2-03]) thuộc [FEAT-03] Gamification Engine  
> **Liên kết Issues:** Closes [#62](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/62)  
> **Tài liệu tham chiếu:** [`docs/[TECH-S2-01] Habit Data Model & Gamification API Contract.md`](../[TECH-S2-01]%20Habit%20Data%20Model%20&%20Gamification%20API%20Contract.md) (Mục 6), [`docs/wireframe/Core MVP Screens.html`](../wireframe/Core%20MVP%20Screens.html)

---

## 1. 🎯 MỤC TIÊU & YÊU CẦU KỸ THUẬT ĐÃ ĐẠT ĐƯỢC

### 1. Component Thanh Tiến Trình Kinh Nghiệm (`client/src/components/gamification/XPProgressBar.tsx`)
- **Hiển thị trực quan trên Header / Navigation:**
  - Hiển thị mức tiến độ trong cấp độ hiện tại, phần trăm hoàn thành và số XP cần để lên cấp tiếp theo (ví dụ: `75/100 XP · 75%` kèm `Cấp 2 (còn 25 XP)`).
  - Sử dụng công thức chuẩn từ `gamificationUtils`:
    $$\text{Progress\_Percent} = \min\left(100, \max\left(0, \frac{\text{Total\_XP} - \text{Required\_XP}}{\text{Next\_Level\_XP} - \text{Required\_XP}} \times 100\% \right)\right)$$
- **Hiệu ứng chuyển động mượt mà (Smooth CSS Transition):**
  - Thanh fill tiến trình chuyển động mượt mà với `transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1)`.
  - Hiệu ứng đổ bóng phát sáng gradient tinh tế (`linear-gradient(90deg, #5b7c5e, #345b46)`).
- **Trợ năng & Tùy biến:**
  - Hỗ trợ chuẩn WAI-ARIA: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label`.
  - Hỗ trợ các kích thước: `sm`, `md`, `lg`.

### 2. Component Huy Hiệu Cấp Độ (`client/src/components/gamification/LevelBadge.tsx`)
- **Icon cấp độ & Hình tượng khiên:**
  - Hiển thị khiên cấp độ đa giác `.level-icon` (`clip-path: polygon(...)`) với số cấp độ nổi bật.
  - Tích hợp biểu tượng glyph cho từng cấp: Level 1 (♟), Level 2 (♞), Level 3 (♝), Level 4 (♜), Level 5 (♛), Level 6+ (♚ / 👑).
- **Hệ thống danh hiệu tương ứng:**
  - Level 1: **Tập sự** *(Novice)*
  - Level 2: **Chiến binh** *(Warrior)*
  - Level 3: **Tinh anh** *(Elite)*
  - Level 4: **Cao thủ** *(Master)*
  - Level 5: **Chuyên gia** *(Expert)*
  - Level 6+: **Huyền thoại** *(Legendary)*
- **Chế độ linh hoạt:** Hỗ trợ chế độ hiển thị đầy đủ (kèm danh hiệu và subtitle) hoặc chế độ `iconOnly`.

### 3. Modal Chúc Mừng Thăng Cấp (`client/src/components/gamification/LevelUpModal.tsx`)
- **Kích hoạt tự động thời gian thực:**
  - Tự động bật khi nhận được cờ `level_up: true` từ API hoàn thành công việc hoặc check-in thói quen.
- **Hiệu ứng pháo giấy ăn mừng (Confetti Animation):**
  - Tích hợp hệ thống 40 mảnh confetti đa sắc màu rơi tự do với hiệu ứng xoay, rơi và lắc lư 60 FPS (`@keyframes confetti-fall` & `@keyframes confetti-shake`).
  - Thiết kế siêu nhẹ thuần CSS/SVG, không làm tăng bundle size và không phụ thuộc thư viện nặng ngoài.
- **Nội dung & Tương tác:**
  - Huy hiệu cấp độ mới với hiệu ứng nhịp đập ăn mừng (pulse glow).
  - Thông báo danh hiệu mới đạt được và số XP đã tích lũy.
  - Nút "Tiếp tục chinh phục ↗" cho phép người dùng tiếp tục hành trình làm việc.
  - Đóng linh hoạt qua nút `×`, click ngoài overlay hoặc nhấn phím `Escape`.

### 4. Quản lý State Toàn cục (`client/src/context/GamificationContext.tsx`)
- Đồng bộ dữ liệu `total_xp` và `current_level` theo thời gian thực trên toàn bộ ứng dụng.
- Cập nhật nhất quán giữa các màn hình Dashboard, Habits và Profile mà không cần tải lại trang.
- Bọc ứng dụng trong `GamificationProvider` tại `App.tsx`.

---

## 2. 📂 CÁC TỆP TIN THAY ĐỔI VÀ TẠO MỚI

```text
pm-subject_gamified-todo-application/
├── client/
│   ├── src/
│   │   ├── context/
│   │   │   └── GamificationContext.tsx           # Context quản lý state XP, Level và Modal toàn cục
│   │   ├── components/
│   │   │   ├── gamification/
│   │   │   │   ├── XPProgressBar.tsx             # Component thanh tiến trình XP
│   │   │   │   ├── LevelBadge.tsx                # Component huy hiệu cấp độ & danh hiệu
│   │   │   │   └── LevelUpModal.tsx              # Modal chúc mừng thăng cấp kèm Confetti
│   │   │   ├── Header.tsx                        # Tích hợp LevelBadge & XPProgressBar
│   │   │   └── TaskRow.tsx                       # Kích hoạt gamification update khi hoàn thành task
│   │   ├── pages/
│   │   │   └── Dashboard.tsx                     # Đồng bộ state & tích hợp LevelUpModal
│   │   ├── types/
│   │   │   └── task.types.ts                     # Thêm interface CompleteTaskResponseData
│   │   ├── services/
│   │   │   └── task.service.ts                   # Cập nhật completeTask trả về CompleteTaskResponseData
│   │   ├── styles/
│   │   │   └── globals.css                       # CSS cho XP Bar, Badge, Modal và Confetti
│   │   └── test/
│   │       └── GamificationUI.test.tsx           # 16 unit tests kiểm thử toàn diện
└── docs/
    └── reports/
        └── TECH-S2-07-xp-bar-level-modal.md      # Báo cáo kỹ thuật
```

---

## 3. 🧪 KẾT QUẢ KIỂM THỬ (TEST RESULTS)

- **Frontend Tests (`Vitest`):**
  - **11 test files passed** (71/71 tests passed, 0 failures).
  - Bao phủ toàn diện `XPProgressBar`, `LevelBadge`, `LevelUpModal`, `GamificationContext` và `Header`.
- **Backend Tests (`Jest`):**
  - **13 test suites passed** (151 tests passed, 0 failures).
- **Build Check:**
  - `client`: `tsc -b && vite build` $\rightarrow$ 0 lỗi biên dịch, build thành công.
  - `server`: `tsc` $\rightarrow$ 0 lỗi biên dịch.

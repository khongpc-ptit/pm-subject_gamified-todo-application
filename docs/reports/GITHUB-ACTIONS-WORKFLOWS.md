# 📋 BÁO CÁO KỸ THUẬT: THIẾT LẬP HỆ THỐNG GITHUB ACTIONS WORKFLOWS TỰ ĐỘNG HÓA DỰ ÁN

> **Ngày thực hiện:** 16/11/2026  
> **Người thực hiện:** Senior DevOps Engineer (`@khongpc-ptit`)  
> **Mục tiêu:** Tự động hóa vòng đời công việc, quản lý phụ thuộc (Unblock -> Ready), theo dõi tiến độ (Branch -> In Progress), kiểm soát chất lượng PR (In Review) và giám sát Deadline (Nhắc nhở & Cảnh báo quá hạn).

---

## 1. 🏷️ HỆ THỐNG NHÃN TRẠNG THÁI (STATUS LABELS) ĐÃ TẠO

Đã khởi tạo và cấu hình 4 nhãn trạng thái chính trên GitHub:
1. **`status: blocked`** (`#D93F0B` - Đỏ cam): Đang bị chặn bởi task phụ thuộc (`Blocked by`).
2. **`status: ready`** (`#0E8A16` - Xanh lá): Đã đủ điều kiện thực thi (không còn task chặn).
3. **`status: in-progress`** (`#1D76DB` - Xanh dương): Đang triển khai code trên branch.
4. **`status: in-review`** (`#5319E7` - Tím): Đã mở Pull Request chờ review/test.

---

## 2. 📊 BẢNG ÁNH XẠ TRẠNG THÁI BAN ĐẦU CỦA 13 TECHNICAL TASKS

| Mã Task | #ID GitHub | Tiêu đề Task | Blocked by (#ID) | Trạng thái gán ban đầu | Lý do |
|---|:---:|---|---|:---:|---|
| **TECH-S1-00** | **#41** | `[TECH-S1-00] Setup Project Structure, Database & ORM Connection` | *Không có* | **`status: ready`** | Task nền tảng đầu tiên, sẵn sàng làm ngay |
| **TECH-S1-01** | **#27** | `[TECH-S1-01] Xác định Task Data Model & API Contract` | *Không có* | **`status: ready`** | Đã hoàn thành (CLOSED) |
| **TECH-S1-02** | **#28** | `[TECH-S1-02] Triển khai chức năng tạo công việc (Frontend + Backend)` | #41, #27 | **`status: blocked`** | Đang chờ task #41 hoàn thành |
| **TECH-S1-03** | **#29** | `[TECH-S1-03] Triển khai chức năng xem danh sách công việc (Frontend + Backend)` | #41, #27 | **`status: ready`** | Đã hoàn thành (CLOSED) |
| **TECH-S1-04** | **#30** | `[TECH-S1-04] Triển khai chức năng cập nhật công việc (Frontend + Backend)` | #41, #27 | **`status: blocked`** | Đang chờ task #41 hoàn thành |
| **TECH-S1-05** | **#31** | `[TECH-S1-05] Triển khai chức năng hoàn thành công việc (Frontend + Backend)` | #41, #27 | **`status: blocked`** | Đang chờ task #41 hoàn thành |
| **TECH-S1-06** | **#32** | `[TECH-S1-06] Kiểm thử tích hợp Task Management` | #28, #29, #30, #31 | **`status: blocked`** | Đang chờ các task #28, #30, #31 hoàn thành |
| **TECH-S1-07** | **#33** | `[TECH-S1-07] Xác định User Data Model & Authentication API Contract` | *Không có* | **`status: ready`** | Đã hoàn thành (CLOSED) |
| **TECH-S1-08** | **#34** | `[TECH-S1-08] Triển khai chức năng đăng ký tài khoản (Frontend + Backend)` | #41, #33 | **`status: blocked`** | Đang chờ task #41 hoàn thành |
| **TECH-S1-09** | **#35** | `[TECH-S1-09] Triển khai chức năng đăng nhập, đăng xuất & quản lý phiên (Frontend + Backend)` | #41, #33 | **`status: blocked`** | Đang chờ task #41 hoàn thành |
| **TECH-S1-10** | **#36** | `[TECH-S1-10] Triển khai chức năng xem & cập nhật hồ sơ người dùng (Frontend + Backend)` | #41, #33, #35 | **`status: blocked`** | Đang chờ các task #41, #35 hoàn thành |
| **TECH-S1-11** | **#37** | `[TECH-S1-11] Triển khai chức năng đặt lại mật khẩu đã quên (Frontend + Backend + Email)` | #41, #33 | **`status: blocked`** | Đang chờ task #41 hoàn thành |
| **TECH-S1-12** | **#38** | `[TECH-S1-12] Kiểm thử tích hợp Authentication & Account Management` | #34, #35, #36, #37 | **`status: blocked`** | Đang chờ các task #34 đến #37 hoàn thành |

---

## 3. ⚙️ HỆ THỐNG 4 GITHUB ACTIONS WORKFLOWS ĐÃ TẠO

### 1. `auto-unblock-issues.yml` (.github/workflows/auto-unblock-issues.yml)
- **Kích hoạt:** Khi có bất kỳ Issue nào được đóng (`issues: types: [closed]`) hoặc chạy thủ công (`workflow_dispatch`).
- **Nghiệp vụ:**
  - Quét toàn bộ Issues đang `open`.
  - Phân tích dòng `Blocked by` để trích xuất các `#ID`.
  - Kiểm tra trạng thái của tất cả task chặn; nếu 100% đã `closed`, tự động:
    - Gỡ nhãn `status: blocked`, gắn nhãn `status: ready`.
    - Để lại comment thông báo và tag tên `@assignees`: *"🔓 **Unblocked & Ready!** Tất cả các task phụ thuộc tiên quyết đã hoàn thành..."* (chống trùng lặp).

### 2. `auto-in-progress-on-branch.yml` (.github/workflows/auto-in-progress-on-branch.yml)
- **Kích hoạt:** Khi nhánh mới được tạo (`create`) hoặc `push` vào các nhánh `feat/**`, `fix/**`, `chore/**`, `docs/**`, `test/**`.
- **Nghiệp vụ:**
  - Trích xuất mã task từ tên nhánh (ví dụ: `feat/tech-s1-02-create-task` -> `TECH-S1-02`).
  - Tìm Issue tương ứng trên GitHub, gỡ `status: ready` / `status: blocked` và gắn `status: in-progress`.
  - Comment 1 lần duy nhất: *"🚀 Branch `<tên_nhánh>` đã được khởi tạo bởi @<người_tạo>..."*

### 3. `pr-convention-check.yml` (.github/workflows/pr-convention-check.yml)
- **Kích hoạt:** Khi Pull Request được tạo hoặc cập nhật (`pull_request: types: [opened, edited, synchronize, reopened]`).
- **Nghiệp vụ:**
  - Kiểm tra PR Title theo regex `^\[(TECH-S\d+-\d+|BUG-[A-Z0-9-]+|CONF-[A-Z0-9-]+|DOC-[A-Z0-9-]+)\]\s+.+`.
  - Kiểm tra PR Body bắt buộc phải có `(Closes|Fixes|Refs)\s+#\d+`.
  - Nếu vi phạm: Tạo comment cảnh báo hướng dẫn chi tiết và đánh dấu `core.setFailed`.
  - Nếu hợp lệ: Tự động tìm các Issue được liên kết và chuyển sang `status: in-review`.

### 4. `deadline-reminder.yml` (.github/workflows/deadline-reminder.yml)
- **Kích hoạt:** Định kỳ 08:00 sáng giờ Việt Nam hàng ngày (`cron: '0 1 * * *'`) hoặc chạy thủ công (`workflow_dispatch`).
- **Nghiệp vụ:**
  - Trích xuất ngày Deadline từ Issue Body theo định dạng `DD/MM/YYYY`.
  - So sánh với ngày hiện tại (múi giờ `Asia/Ho_Chi_Minh`):
    - Còn `<= 24h`: Comment nhắc nhở nhẹ nhàng tag tên người phụ trách.
    - Đã quá hạn: Comment cảnh báo quá hạn nhắc nhở cập nhật tiến độ (tránh spam trong vòng 20 tiếng).

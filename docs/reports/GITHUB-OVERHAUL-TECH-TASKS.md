# 📋 BÁO CÁO KỸ THUẬT: ĐẠI TU CƠ CHẾ QUẢN LÝ DỰ ÁN TRÊN GITHUB & CHUẨN HÓA 13 TECHNICAL TASKS

> **Ngày thực hiện:** 16/11/2026  
> **Người thực hiện:** Technical Project Manager & DevOps Engineer (`@khongpc-ptit`)  
> **Mô hình quản lý mới:**  
> - **Trello:** Quản lý Feature, User Story và tiến độ tổng quan qua GitHub Power-Up.  
> - **GitHub:** CHỈ quản lý Technical Tasks (`label: tech-task`), Branches và Pull Requests.

---

## 1. 🎯 TỔNG QUAN CÁC CÔNG VIỆC ĐÃ HOÀN THÀNH

1. **Dọn dẹp Issues:**
   - Xóa vĩnh viễn 11 Issues Feature (`[FEAT-01]`, `[FEAT-02]`) và User Story (`[US-S1-01]` đến `[US-S1-09]`) trên GitHub (tương ứng các issue `#16` đến `#26`).
   - Bảo toàn nguyên vẹn 100% lịch sử và bằng chứng của các Technical Task đã hoàn thành trước đó: `#27` (`TECH-S1-01`), `#29` (`TECH-S1-03`), `#33` (`TECH-S1-07`) cùng các PR tương ứng (#39, #40).
2. **Khởi tạo Task nền tảng `[TECH-S1-00]`:**
   - Tạo mới Issue `#41` cho `[TECH-S1-00] Setup Project Structure, Database & ORM Connection`.
   - Nâng tổng số Technical Tasks trong Sprint 1 lên đúng **13 Issues** (`TECH-S1-00` đến `TECH-S1-12`).
3. **Chuẩn hóa Templates & Workflows:**
   - Ghi đè file `.github/ISSUE_TEMPLATE/3-tech-task.md` với cấu trúc quản lý phụ thuộc mới (`Blocked by`, `Blocks`, liên kết Trello).
   - Xóa bỏ các template thừa không còn dùng: `.github/ISSUE_TEMPLATE/1-feature.md`, `2-user-story.md`, `.github/workflows/auto-close-parent.yml`.
   - Cập nhật `.github/PULL_REQUEST_TEMPLATE.md` chỉ yêu cầu khai báo `Closes #<tech_task_id>`.
   - Đã push các thay đổi template lên nhánh `develop` (commit `1bd1822`).
4. **Cập nhật & Đồng bộ 13 Technical Tasks:**
   - Gán Milestone `Sprint 1` (Hạn chót: `18/11/2026`).
   - Gán Label `tech-task`.
   - Gán Assignee đúng theo phân công của nhóm.
   - Điền chính xác số `#ID` thật trên GitHub vào các mục `Blocked by`, `Blocks` và `Closes #<id>` cho từng Issue.

---

## 2. 📊 BẢNG TỔNG HỢP 13 TECHNICAL TASKS TRÊN GITHUB

| Mã Task | #ID GitHub | Tiêu đề Task | Blocked by (#ID) | Blocks (#ID) | Assignee | Deadline | Trạng thái | Link Issue |
|---|:---:|---|---|---|---|:---:|:---:|---|
| **TECH-S1-00** | **#41** | `[TECH-S1-00] Setup Project Structure, Database & ORM Connection` | *Không có* | #28, #29, #30, #31, #34, #35, #36, #37 | `@kiennarutonbmn1` | 06/11/2026 | OPEN | [#41](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/41) |
| **TECH-S1-01** | **#27** | `[TECH-S1-01] Xác định Task Data Model & API Contract` | *Không có* | #28, #29, #30, #31, #32 | `@khongpc-ptit` | 07/11/2026 | **CLOSED** | [#27](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/27) |
| **TECH-S1-02** | **#28** | `[TECH-S1-02] Triển khai chức năng tạo công việc (Frontend + Backend)` | #41, #27 | #32 | `@kiennarutonbmn1` | 10/11/2026 | OPEN | [#28](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/28) |
| **TECH-S1-03** | **#29** | `[TECH-S1-03] Triển khai chức năng xem danh sách công việc (Frontend + Backend)` | #41, #27 | #32 | `@khongpc-ptit` | 10/11/2026 | **CLOSED** | [#29](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/29) |
| **TECH-S1-04** | **#30** | `[TECH-S1-04] Triển khai chức năng cập nhật công việc (Frontend + Backend)` | #41, #27 | #32 | `@mhunglee20405` | 10/11/2026 | OPEN | [#30](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/30) |
| **TECH-S1-05** | **#31** | `[TECH-S1-05] Triển khai chức năng hoàn thành công việc (Frontend + Backend)` | #41, #27 | #32 | `@kiennarutonbmn1` | 09/11/2026 | OPEN | [#31](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/31) |
| **TECH-S1-06** | **#32** | `[TECH-S1-06] Kiểm thử tích hợp Task Management` | #28, #29, #30, #31 | *Không có* | `@mhunglee20405`<br>`@khongpc-ptit`<br>`@kiennarutonbmn1` | 13/11/2026 | OPEN | [#32](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/32) |
| **TECH-S1-07** | **#33** | `[TECH-S1-07] Xác định User Data Model & Authentication API Contract` | *Không có* | #34, #35, #36, #37, #38 | `@khongpc-ptit` | 17/11/2026 | **CLOSED** | [#33](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/33) |
| **TECH-S1-08** | **#34** | `[TECH-S1-08] Triển khai chức năng đăng ký tài khoản (Frontend + Backend)` | #41, #33 | #38 | `@khongpc-ptit` | 18/11/2026 | OPEN | [#34](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/34) |
| **TECH-S1-09** | **#35** | `[TECH-S1-09] Triển khai chức năng đăng nhập, đăng xuất & quản lý phiên (Frontend + Backend)` | #41, #33 | #36, #38 | `@kiennarutonbmn1` | 18/11/2026 | OPEN | [#35](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/35) |
| **TECH-S1-10** | **#36** | `[TECH-S1-10] Triển khai chức năng xem & cập nhật hồ sơ người dùng (Frontend + Backend)` | #41, #33, #35 | #38 | `@mhunglee20405` | 18/11/2026 | OPEN | [#36](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/36) |
| **TECH-S1-11** | **#37** | `[TECH-S1-11] Triển khai chức năng đặt lại mật khẩu đã quên (Frontend + Backend + Email)` | #41, #33 | #38 | `@kiennarutonbmn1` | 18/11/2026 | OPEN | [#37](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/37) |
| **TECH-S1-12** | **#38** | `[TECH-S1-12] Kiểm thử tích hợp Authentication & Account Management` | #34, #35, #36, #37 | *Không có* | `@mhunglee20405`<br>`@khongpc-ptit`<br>`@kiennarutonbmn1` | 18/11/2026 | OPEN | [#38](https://github.com/khongpc-ptit/pm-subject_gamified-todo-application/issues/38) |

# 📋 BÁO CÁO KỸ THUẬT: ĐỒNG BỘ GITHUB PROJECTS V2 GRAPHQL API & TỰ ĐỘNG DI CHUYỂN CỘT (BACKLOG ↔ READY)

> **Ngày thực hiện:** 16/11/2026  
> **Người thực hiện:** Senior DevOps Engineer (`@khongpc-ptit`)  
> **Mục tiêu:** Nâng cấp workflow tự động hóa để đồng bộ trực tiếp trạng thái thẻ giữa cột **`Backlog`** và **`Ready`** trên bảng **GitHub Projects V2** qua GraphQL API khi Issue được tạo, sửa hoặc đóng.

---

## 1. 🔄 CƠ CHẾ HOẠT ĐỘNG TOÀN DIỆN CỦA WORKFLOW MỚI

File cấu hình: [`.github/workflows/auto-unblock-issues.yml`](file:///d:/UNIVERSITY_PTIT/YEAR_4/PM/project/.github/workflows/auto-unblock-issues.yml)

### 🔹 Nhánh A – Khi Issue được tạo (`opened`), cập nhật (`edited`), hoặc mở lại (`reopened`):
1. Phân tích nội dung dòng `- **Blocked by...**` của Issue:
   - **Nếu bị chặn (có `#ID` vẫn đang `OPEN`):**
     - Gắn nhãn `status: blocked`, gỡ `status: ready`.
     - Tự động gọi GraphQL API chuyển thẻ trên GitHub Project V2 về cột **`Backlog`**.
   - **Nếu không bị chặn (ghi `Không có` hoặc tất cả blocker đã `CLOSED`):**
     - Gỡ nhãn `status: blocked`, gắn nhãn `status: ready`.
     - Tự động gọi GraphQL API chuyển thẻ trên GitHub Project V2 sang cột **`Ready`**.

### 🔹 Nhánh B – Khi có một Issue được đóng (`closed`) hoặc chạy thủ công (`workflow_dispatch`):
1. Quét toàn bộ các Issues đang `OPEN` trong repository.
2. Với mỗi task bị chặn trước đó:
   - Nếu **100% các Issue blocker đã chuyển sang `CLOSED`**:
     - Gỡ nhãn `status: blocked`, gắn nhãn `status: ready`.
     - Gọi GraphQL API tự động kéo thẻ từ **`Backlog`** sang **`Ready`**.
     - Đăng comment thông báo mở khóa và tag `@assignees` (có cơ chế chống comment trùng lặp).

---

## 2. 📊 BẢNG TỔNG HỢP TRẠNG THÁI 13 TECHNICAL TASKS

| Mã Task | #ID GitHub | Tiêu đề Task | Blocked by (#ID) | Label hiện tại | Cột đồng bộ trên GitHub Project |
|---|:---:|---|---|:---:|:---:|
| **TECH-S1-00** | **#41** | `[TECH-S1-00] Setup Project Structure, Database & ORM Connection` | *Không có* | `status: ready` | **`Ready`** |
| **TECH-S1-01** | **#27** | `[TECH-S1-01] Xác định Task Data Model & API Contract` | *Không có* | `status: ready` (CLOSED) | **`Ready`** |
| **TECH-S1-02** | **#28** | `[TECH-S1-02] Triển khai chức năng tạo công việc (Frontend + Backend)` | #41, #27 | `status: blocked` | **`Backlog`** |
| **TECH-S1-03** | **#29** | `[TECH-S1-03] Triển khai chức năng xem danh sách công việc (Frontend + Backend)` | #41, #27 | `status: ready` (CLOSED) | **`Ready`** |
| **TECH-S1-04** | **#30** | `[TECH-S1-04] Triển khai chức năng cập nhật công việc (Frontend + Backend)` | #41, #27 | `status: blocked` | **`Backlog`** |
| **TECH-S1-05** | **#31** | `[TECH-S1-05] Triển khai chức năng hoàn thành công việc (Frontend + Backend)` | #41, #27 | `status: blocked` | **`Backlog`** |
| **TECH-S1-06** | **#32** | `[TECH-S1-06] Kiểm thử tích hợp Task Management` | #28, #29, #30, #31 | `status: blocked` | **`Backlog`** |
| **TECH-S1-07** | **#33** | `[TECH-S1-07] Xác định User Data Model & Authentication API Contract` | *Không có* | `status: ready` (CLOSED) | **`Ready`** |
| **TECH-S1-08** | **#34** | `[TECH-S1-08] Triển khai chức năng đăng ký tài khoản (Frontend + Backend)` | #41, #33 | `status: blocked` | **`Backlog`** |
| **TECH-S1-09** | **#35** | `[TECH-S1-09] Triển khai chức năng đăng nhập, đăng xuất & quản lý phiên (Frontend + Backend)` | #41, #33 | `status: blocked` | **`Backlog`** |
| **TECH-S1-10** | **#36** | `[TECH-S1-10] Triển khai chức năng xem & cập nhật hồ sơ người dùng (Frontend + Backend)` | #41, #33, #35 | `status: blocked` | **`Backlog`** |
| **TECH-S1-11** | **#37** | `[TECH-S1-11] Triển khai chức năng đặt lại mật khẩu đã quên (Frontend + Backend + Email)` | #41, #33 | `status: blocked` | **`Backlog`** |
| **TECH-S1-12** | **#38** | `[TECH-S1-12] Kiểm thử tích hợp Authentication & Account Management` | #34, #35, #36, #37 | `status: blocked` | **`Backlog`** |

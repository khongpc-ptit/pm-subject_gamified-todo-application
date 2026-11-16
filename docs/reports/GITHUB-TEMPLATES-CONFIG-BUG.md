# 📋 BÁO CÁO KỸ THUẬT: CẤU HÌNH LABELS, ISSUE TEMPLATES (BUG & CONFIG) VÀ NÂNG CẤP PR TEMPLATE

> **Ngày thực hiện:** 16/11/2026  
> **Người thực hiện:** DevOps Engineer (`@khongpc-ptit`)  
> **Phạm vi tác vụ:** Mở rộng hệ thống Issue Templates & Pull Request Template hỗ trợ đầy đủ luồng Bugfix và Cấu hình hệ thống (Config/Infrastructure).

---

## 1. 🏷️ CÁC LABELS MỚI ĐÃ KHỞI TẠO TRÊN GITHUB

Đã bổ sung thành công 2 labels mới trên repository GitHub:
1. **`bug`**:
   - **Mã màu:** `#EF4444` (Đỏ)
   - **Mô tả:** *"Lỗi phát sinh cần sửa"*
2. **`config`**:
   - **Mã màu:** `#F59E0B` (Vàng hổ phách)
   - **Mô tả:** *"Cấu hình hệ thống, Database, Docker, CI/CD, Tài liệu"*

---

## 2. 📝 CÁC ISSUE TEMPLATES MỚI TRONG `.github/ISSUE_TEMPLATE/`

Hệ thống Issue Template hiện gồm 3 mẫu chuẩn:
1. `3-tech-task.md`: Technical Task (`[TECH-S1-xx]`, label: `tech-task`) - *Giữ nguyên vẹn*.
2. `4-bug-report.md`: Báo cáo lỗi (`[BUG-S1-xx]`, label: `bug`) với đầy đủ các mục:
   - Mô tả lỗi, Các bước tái hiện (Steps to Reproduce).
   - Kết quả mong đợi vs Thực tế.
   - Ảnh chụp màn hình / Log lỗi Backend/Console.
   - Mức độ nghiêm trọng (Severity: Critical, Major, Minor/UI).
   - Quy chuẩn Branch & PR: `fix/bug-s1-xx-...`, khai báo `Fixes #...` và `Refs #...`.
3. `5-config-chore.md`: Công việc cấu hình hạ tầng (`[CONF-S1-xx]`, label: `config`) với:
   - Nội dung cấu hình / Cài đặt.
   - Tác động tới nhóm: biến môi trường mới trong `.env.example`, lệnh cần chạy lại ở local.
   - Dependencies (`Blocked by`, `Blocks`).
   - Definition of Done, Branch & PR: `chore/conf-s1-xx-...`, khai báo `Closes #...`.

---

## 3. 🌿 NÂNG CẤP FILE `.github/PULL_REQUEST_TEMPLATE.md` ĐA NĂNG

Mẫu PR mới được thiết kế hỗ trợ trọn vẹn cả 3 nhóm công việc:
- **Phần 1 - Phân loại PR:** Chọn 1 loại chính: Technical Task, Bugfix, hoặc Config/Chore/Docs.
- **Phần 2 - Liên kết Issue & Trello:** Hỗ trợ linh hoạt cả `Closes #<id>` (Tech/Config) lẫn `Fixes #<id>` (Bugfix), đính kèm mã thẻ Trello.
- **Phần 3 - Tóm tắt nội dung thay đổi:** Tùy chỉnh theo từng loại PR (thay đổi kỹ thuật, Root Cause & Solution của Bug, hoặc hướng dẫn lệnh chạy lại cho Config).
- **Phần 4 - Phân hệ tác động:** Backend, Frontend, Database/ORM, Config/DevOps, Docs, Tests.
- **Phần 5 - Hướng dẫn kiểm thử & Screenshots.**
- **Phần 6 - Checklist kiểm duyệt.**

---

## 4. 🔒 BẢO TOÀN DỮ LIỆU
- Toàn bộ 13 Technical Tasks của Sprint 1 (`TECH-S1-00` đến `TECH-S1-12`) được **giữ nguyên vẹn 100%**, không có bất kỳ thay đổi nào về Issue ID, Title, Body, Assignee hay Milestone.

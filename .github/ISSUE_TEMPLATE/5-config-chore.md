---
name: Config / Infrastructure Task
about: Công việc cấu hình dự án, Database, Docker, CI/CD, cài đặt thư viện hoặc tài liệu
title: "[CONF-S1-xx] "
labels: config
assignees: ''
---

## Nội dung cấu hình / Cài đặt
*(Mô tả chi tiết các cấu hình hệ thống, môi trường hoặc tài liệu cần thiết lập)*
- [ ] 
- [ ] 

## Tác động tới các thành viên khác trong nhóm
- **Biến môi trường mới trong .env.example:** Có / Không (nếu có ghi rõ tên biến)
- **Lệnh cần chạy lại sau khi pull nhánh mặc định:** npm install, npm test, npm run dev
- **Blocked by (Chờ task nào):** Không có (hoặc #1, #2)
- **Blocks (Đang chặn các task nào):** Không có (hoặc #3, #4)

## Definition of Done
- [ ] Cấu hình chạy ổn định ở local và không làm gãy môi trường của các thành viên khác
- [ ] Đã cập nhật .env.example và hướng dẫn trong README.md (nếu có)
- [ ] PR được review và merge

## Quy chuẩn Branch & PR
- **Branch:** chore/conf-s1-xx-ten-cau-hinh (hoặc docs/...)
- **PR Title:** [CONF-S1-xx] Mô tả cấu hình
- **PR Body:** Khai báo Closes #<số_issue_này>

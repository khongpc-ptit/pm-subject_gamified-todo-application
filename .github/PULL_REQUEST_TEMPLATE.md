## 🏷 1. Phân loại Pull Request (Chọn 1 loại chính)
<!-- Đánh dấu [x] vào loại PR tương ứng với công việc của bạn -->
- [ ] 🛠 **Technical Task (Feature / Test):** Triển khai công việc kỹ thuật trong Sprint (`[TECH-S1-xx]`)
- [ ] 🐛 **Bugfix / Hotfix:** Sửa lỗi phát sinh trong quá trình code hoặc kiểm thử (`[BUG-S1-xx]`)
- [ ] ⚙️ **Config / Chore / Docs:** Cài đặt hạ tầng, Database, Docker, CI/CD, `.env` hoặc tài liệu (`[CONF-S1-xx]` / `[DOC-xx]`)

---

## 🔗 2. Liên kết Issue & Trello
<!-- 
- Với Tech Task hoặc Config: Dùng "Closes #<số_issue>"
- Với Bugfix: Dùng "Fixes #<số_issue_bug>" (kèm "Refs #<số_tech_task>" nếu có)
-->
- **Đóng Issue trên GitHub (Closes / Fixes):** Closes #
- **Liên quan đến Issue khác (nếu có):** Refs #
- **Mã thẻ trên Trello (US / TECH):** <!-- VD: [US-S1-01] / [TECH-S1-02] -->

---

## 📝 3. Tóm tắt nội dung thay đổi
<!-- Điền vào mục tương ứng với loại PR của bạn -->

### A. Nếu là Technical Task:
- **Các thay đổi chính (Frontend / Backend / API):**
  - 

### B. Nếu là Bugfix (Sửa lỗi):
- **Nguyên nhân gây lỗi (Root Cause):** 
- **Giải pháp khắc phục (Solution):** 

### C. Nếu là Config / Chore / Docs:
- **Cấu hình / Thư viện / Tài liệu đã thêm hoặc sửa:** 
- **Lệnh cần chạy lại ở local sau khi pull (VD: `npm install`, `npx prisma migrate dev`):** 

---

## 🔍 4. Phân hệ tác động (Scope of Changes)
- [ ] Backend (API, Service, Middleware, Validation)
- [ ] Frontend (UI Component, Page, State, Form)
- [ ] Database / ORM (Schema, Migration, Seed data)
- [ ] Configuration / DevOps (Docker, `.env.example`, Dependencies, GitHub Actions)
- [ ] Documentation / API Contract (`README.md`, Swagger, Docs)
- [ ] Testing (Unit Test, Integration Test, E2E)

---

## 🧪 5. Hướng dẫn kiểm thử (How to Test) & Ảnh chụp màn hình
1. 
2. 

---

## ✅ 6. Checklist trước khi gửi Review
- [ ] **Đặt đúng chuẩn Branch & PR Title:**
  - Tech Task: `feat/tech-s1-xx-...` | `[TECH-S1-xx] Mô tả ngắn`
  - Bugfix: `fix/bug-s1-xx-...` | `[BUG-S1-xx] Fix ...`
  - Config / Docs: `chore/...` hoặc `docs/...` | `[CONF-S1-xx] / [TECH-S1-xx] Mô tả ngắn`
- [ ] Code đã chạy thử thành công ở local, không lỗi build/lint.
- [ ] Không commit nhầm file `.env` hoặc thông tin nhạy cảm.
- [ ] Đã cập nhật `.env.example` và `README.md` (nếu có thêm biến môi trường mới).

# TECH-S3-06 · API thông báo nội bộ

Issue #78 · US-S3-05

- `GET /api/v1/notifications` trả 20 thông báo mới nhất của tài khoản và số chưa đọc của toàn bộ hộp thông báo.
- `PATCH /api/v1/notifications/:id/read` trả trạng thái đã đọc và số chưa đọc. ID sai định dạng trả 400. ID không thuộc tài khoản hoặc không tồn tại trả 404.
- `PATCH /api/v1/notifications/read-all` trả số bản ghi vừa cập nhật và số chưa đọc còn lại. Các thao tác cập nhật an toàn khi gọi lại.
- `notificationService.createNotification` dùng collection và trường theo DOC-11 để #74 và #76 tạo thông báo. Hai index theo tài khoản được tạo khi API khởi động.

Kiểm thử tích hợp dùng MongoDB riêng, JWT thật, hai tài khoản và hơn 20 bản ghi. Chạy với `TEST_MONGODB_URI` bằng `npm --prefix server test -- --runTestsByPath tests/notification-api.integration.test.ts`. Độ trễ dưới 50 ms trên dữ liệu triển khai cần được kiểm tra trên môi trường mục tiêu. Tích hợp thông báo tự sinh còn chờ #74 và #76.

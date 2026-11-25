# TECH-S3-06 · API thông báo nội bộ

Issue #78 · US-S3-05

- `GET /api/v1/notifications` trả 20 thông báo mới nhất của tài khoản và số chưa đọc của toàn bộ hộp thông báo.
- `PATCH /api/v1/notifications/:id/read` trả trạng thái đã đọc và số chưa đọc. ID sai định dạng trả 400. ID không thuộc tài khoản hoặc không tồn tại trả 404.
- `PATCH /api/v1/notifications/read-all` trả `modified_count` và xác nhận số bản ghi vừa cập nhật và số chưa đọc còn lại. Các thao tác cập nhật an toàn khi gọi lại.
- `notificationService.createNotification` dùng collection và trường theo DOC-11 để #74 và #76 tạo thông báo. Model Notification từ #73 khai báo hai index theo tài khoản.

Kiểm thử tích hợp dùng MongoDB riêng, JWT thật, hai tài khoản và hơn 20 bản ghi. Chạy với `TEST_MONGODB_URI` bằng `npm --prefix server test -- --runTestsByPath tests/notification-api.integration.test.ts`. Độ trễ dưới 50 ms trên dữ liệu triển khai cần được kiểm tra trên môi trường mục tiêu. Kiểm thử hoàn thành task đã xác nhận thông báo ACHIEVEMENT được tạo bởi engine #76 và xuất hiện trong API.

Đo local qua Express và MongoDB với 10.000 thông báo mẫu, 1.000 thông báo của tài khoản thử và 30 lượt sau khi làm nóng. P50 là 5,90 ms và P95 là 7,20 ms.

# TECH-S3-05 · Bộ sưu tập huy hiệu

Issue #77 · US-S3-04

- `GET /api/v1/gamification/badges` yêu cầu JWT và trả danh mục cùng tiến độ, trạng thái mở khóa và ngày đạt của người dùng hiện tại.
- Trang Bộ sưu tập hiển thị ảnh theo `icon_url` của seed, tải lười, hỗ trợ trạng thái trống, tải lỗi và thử lại. Huy hiệu khóa có ảnh xám và thanh tiến độ, huy hiệu đã đạt có ngày mở khóa.
- Sau khi tải danh mục ban đầu, ứng dụng kiểm tra lại khi hoàn thành công việc hoặc điểm danh. Huy hiệu mới trong phiên mở modal chúc mừng, không mở lại khi đã đóng. Nếu đồng thời thăng cấp, modal huy hiệu chờ người dùng đóng modal thăng cấp.
- Kiểm thử sử dụng dữ liệu mẫu theo DOC-11. Seed WebP phụ thuộc #73 và cấp huy hiệu thật sau hoạt động phụ thuộc #76.

Chạy `npm run build` và `npm test` với `TEST_MONGODB_URI` trỏ tới MongoDB phát triển. Kiểm thử API dùng hai tài khoản với quyền mở khóa khác nhau.

Đã chạy Edge với MongoDB thật ở chiều rộng 390 px. Danh mục khóa, tiến độ, modal sau khi thêm bản ghi mở khóa, nút Escape và trạng thái sau reload đều đạt.

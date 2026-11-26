# TECH-S3-07 · Chuông thông báo

Issue #79 · US-S3-05

Chuông trên Header hiển thị số thông báo chưa đọc, tự cập nhật mỗi 30 giây khi tab đang hiển thị, đồng thời cập nhật khi lấy lại tiêu điểm hoặc mở danh sách. Dropdown hiển thị thông báo theo ba loại, thông báo chưa đọc được đánh dấu riêng. Bấm vào thông báo hoặc bấm đánh dấu tất cả để cập nhật theo phản hồi API. Dropdown đóng khi bấm bên ngoài hoặc nhấn Escape, hỗ trợ danh sách cuộn và bố cục trên màn hình hẹp.

API thông báo của #78 đã vào develop qua PR #89. Chuông dùng trực tiếp API này. Đã tích hợp hợp đồng Sprint 3 dùng id. Chuông cập nhật thêm ngay khi hoàn thành task hoặc điểm danh, bên cạnh cơ chế thăm dò và cập nhật khi lấy lại tiêu điểm.

Chạy `npm run build` và `npm test`. Kiểm thử UI dùng dữ liệu mẫu với ba loại thông báo, thao tác đọc, lỗi mạng và cập nhật khi lấy lại tiêu điểm.

Đã chạy Edge với Express và MongoDB thật ở chiều rộng 390 px. Dropdown nằm trong màn hình, số chưa đọc cập nhật từ 2 xuống 1 rồi 0, API lưu trạng thái đã đọc và Escape đóng danh sách.

Trên Edge 390 px, hoàn thành task đầu tiên sinh thông báo thành tích thật. Chuông cập nhật ngay, đọc từng mục làm số chưa đọc về 0 và trạng thái còn đúng khi đọc lại API.

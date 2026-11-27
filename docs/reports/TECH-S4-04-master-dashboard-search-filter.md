# TECH-S4-04 · Dashboard, Stats Hub và bộ lọc công việc

Issue #96 · US-S4-02 và US-S4-03

- Dashboard dùng `GET /api/v1/dashboard/summary` cho bốn chỉ số và biểu đồ 7 ngày. Các số liệu được tải lại sau khi tạo, sửa hoặc hoàn thành task, sau khi check-in và sau khi dùng lượt freeze.
- Form tạo nhanh, danh sách task và Habit Tracker dùng lại luồng hiện có. Biểu đồ tải bằng chunk riêng để màn hình ban đầu có thể hiển thị mà không chờ Recharts.
- Tìm tiêu đề không phân biệt hoa thường, debounce 300 ms. Trạng thái, ưu tiên và hai đầu khoảng hạn chót áp dụng đồng thời, bao gồm cả ngày đầu và ngày cuối theo múi giờ Việt Nam. Khi có giới hạn ngày, công việc không có hạn được loại khỏi kết quả. Nút xóa tất cả đặt lại ngay cả từ khóa chưa hết debounce.
- Bộ lọc chạy trên tập công việc đã tải của tài khoản. Việc gõ và đổi bộ lọc không phát sinh request đến API.

## Kiểm thử

1. Cài dependency cho server và client. Đặt `TEST_MONGODB_URI` trỏ tới MongoDB phát triển rồi chạy `npm run build` và `npm test`.
2. Bộ test Dashboard xác minh debounce 300 ms, lọc kết hợp, ranh giới ngày UTC+7 và xóa lọc. Test tích hợp kiểm tra bốn chỉ số lấy từ summary API và sự hiện diện của form, Habit Tracker, biểu đồ.
3. Đăng nhập trên trình duyệt, tạo task và habit. Hoàn thành task rồi check-in habit trên Dashboard để kiểm tra tỷ lệ hoàn thành, XP và biểu đồ. Dùng tổ hợp từ khóa, trạng thái, ưu tiên và hạn chót rồi xóa lọc.

Đã kiểm tra trên Edge với Express và MongoDB thật. Bộ lọc kết hợp và nút xóa lọc hoạt động, hoàn thành một trong hai task đưa tỷ lệ lên 50%, check-in cộng thêm 15 XP, và biểu đồ 7 ngày hiển thị.

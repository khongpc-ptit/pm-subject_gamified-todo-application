# TECH-S2-06 · Điểm danh thói quen

Issue #61 · US-S2-02 và US-S2-03

## Hành vi

- `POST /api/v1/habits/:id/check-in` yêu cầu JWT và dùng ngày tại `Asia/Ho_Chi_Minh`. Thói quen không thuộc tài khoản hoặc đã ngừng theo dõi trả về `404 HABIT_NOT_FOUND`. Điểm danh trùng ngày trả về `400 HABIT_ALREADY_CHECKED_IN`.
- Điểm danh hợp lệ tăng streak của thói quen, ghi XP thực nhận vào log, cập nhật ngày hoạt động và tổng XP của tài khoản. Mức thưởng là tối đa 15 XP, dùng chung trần 200 XP/ngày với task. Khi đã đủ 200 XP, điểm danh vẫn được ghi với 0 XP.
- Phản hồi trả về cấp độ, cờ thăng cấp và mốc XP tiếp theo. Habit Tracker cập nhật thẻ, XP trên Header và thông báo dựa trên phản hồi API. Lỗi mạng cho phép thử lại.
- Hoạt động thay đổi XP của cùng tài khoản được xử lý tuần tự trong một tiến trình API. Điều kiện ghi MongoDB ngăn hai log điểm danh thành công cho cùng thói quen và ngày. Nếu ghi hồ sơ thất bại, API hoàn tác log và streak vừa ghi. Trần XP đồng thời giữa nhiều tiến trình API chưa được kiểm chứng.

## Kiểm thử

1. Cài thư viện bằng `npm --prefix server ci` và `npm --prefix client ci`.
2. Đặt `TEST_MONGODB_URI` tới MongoDB phát triển và chạy `npm run build` rồi `npm test`. Bộ test check-in tạo và dọn database ngẫu nhiên.
3. Kiểm tra đường biên 00:00 UTC+7, điểm danh trùng đồng thời, quyền sở hữu, rollback khi ghi hồ sơ lỗi, cùng chia trần XP giữa task và habit, và cấp 2 tại 100 XP.
4. Đăng nhập, mở Thói quen, tạo một thói quen rồi bấm Check-in. Kiểm tra streak, nút đã check-in, toast và XP trên Header. Tải lại để kiểm tra dữ liệu đã lưu.

Đã chạy trên Edge với API Express và MongoDB thật. Tạo thói quen, điểm danh +15 XP, cập nhật Header và kiểm tra lại sau khi tải trang đều đạt.

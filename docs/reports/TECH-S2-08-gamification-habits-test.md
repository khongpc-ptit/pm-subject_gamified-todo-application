# TECH-S2-08 · Kiểm thử tích hợp Habits và Gamification

Issue #63 · US-S2-01 đến US-S2-05

| Kịch bản | Kiểm thử | Phạm vi |
| --- | --- | --- |
| Tạo, xem và ngừng theo dõi thói quen | `server/tests/habits.test.ts` | Tiêu đề rỗng hoặc dài hơn 200 ký tự, quyền sở hữu và soft delete |
| Điểm danh hằng ngày | `server/tests/habits.test.ts`, `server/tests/habit-check-in.test.ts` | +15 XP, tăng streak, chống trùng, mốc ngày UTC+7 |
| XP theo ưu tiên và trần ngày | `server/tests/gamification.test.ts` | 10/20/30 XP, thưởng một phần tại ngưỡng 200, thưởng 0 khi đã chạm trần |
| Hoàn tác | `server/tests/gamification.test.ts` | Chỉ trừ XP thực nhận, lặp cập nhật không trừ lần hai |
| Thăng cấp | `server/tests/gamification.test.ts` | Mốc 100 XP trả Level 2, `level_up: true` và ngưỡng kế tiếp 400 XP |

GitHub Actions cấp một MongoDB riêng cho job. Mỗi suite tạo một database ngẫu nhiên và dọn sau khi chạy. Job chạy build và toàn bộ test với `TEST_MONGODB_URI`. Chạy local bằng cách đặt cùng biến này trỏ tới MongoDB phát triển, sau đó chạy `npm run build` và `npm test`.

Hai fixture xác thực cũ được sửa để chạy cùng bộ test MongoDB. Tài khoản mới có 1 lượt freeze theo đặc tả. Test vòng đời dùng token thật do API sinh và thu qua adapter email giả lập. Suite Password Reset riêng vẫn kiểm chứng giao tiếp SMTP thật.

## Kiểm thử giao diện sau khi merge #62

`client/src/test/Sprint2Gamification.integration.test.tsx` chạy qua App, Dashboard, Habit Tracker và Profile với phản hồi API mẫu. Bộ test kiểm tra tiến độ và XP còn thiếu, modal khi hoàn thành task hoặc điểm danh đạt 100 XP, đóng modal và đồng bộ cấp độ giữa các màn hình. Khi chạm trần 200 XP, task vẫn hoàn thành, hiển thị cảnh báo, XP giữ nguyên và modal thăng cấp không xuất hiện.

Kiểm tra trên Edge với Express và MongoDB thật đã đạt. Hai tài khoản thử nghiệm lần lượt hoàn thành task từ 70 XP và điểm danh từ 85 XP. Cả hai đạt Cấp 2 tại đúng 100 XP. Modal hiển thị khi đạt mốc, Header và Profile đồng bộ, dữ liệu vẫn đúng sau khi tải lại và modal không tự mở lại.

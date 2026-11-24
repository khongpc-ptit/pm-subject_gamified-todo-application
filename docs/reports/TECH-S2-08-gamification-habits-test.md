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

Giao diện XP Bar, badge và modal chúc mừng còn phụ thuộc #62. Sau khi #62 vào nhánh đích, kiểm tra việc đồng bộ XP trên Dashboard, Habits và Profile, rồi kiểm tra modal chỉ xuất hiện khi API trả `level_up: true`.

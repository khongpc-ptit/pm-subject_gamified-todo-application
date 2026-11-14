# **REQUIREMENTS ELICITATION RECORDS**

## **1\. MỤC ĐÍCH VÀ PHƯƠNG PHÁP THU THẬP YÊU CẦU**

### **1.1. Mục đích tài liệu**

Tài liệu Hồ sơ Thu thập Yêu cầu Phần mềm (DOC-07) ghi nhận toàn bộ thông tin khảo sát, biên bản phỏng vấn và các yêu cầu thô (Raw Requirements) thu thập từ các bên liên quan trong giai đoạn Lập kế hoạch (Tuần 2). Đây là cơ sở đầu vào để Business Analyst và Product Owner phân tích, sàng lọc trước khi chuẩn hóa thành Bản đặc tả yêu cầu phần mềm (DOC-08: SRS Baseline) và Danh mục sản phẩm ban đầu (DOC-09: Initial Product Backlog).

### **1.2. Phương pháp thực hiện**

Hoạt động thu thập yêu cầu được Nguyễn Trung Kiên (BA) chủ trì phối hợp cùng Lê Mạnh Hùng (PO) thực hiện thông qua 03 phương thức:

* **Phỏng vấn bán cấu trúc:** Phỏng vấn chuyên sâu ThS. Lý Tuấn Anh (Project Sponsor) để xác định mục tiêu học thuật, ràng buộc kỹ thuật; phỏng vấn người dùng đại diện để tìm hiểu nguyên nhân bỏ cuộc khi dùng các ứng dụng To-Do truyền thống.  
* **Khảo sát bảng hỏi trực tuyến:** Thu thập dữ liệu định lượng từ 35 sinh viên và người đi làm trẻ tuổi về thói quen quản lý thời gian và phản ứng với các cơ chế Gamification.  
* **Hội thảo yêu cầu nội bộ (Requirements Workshop):** Làm việc giữa 03 thành viên nhóm để rà soát tính khả thi kỹ thuật, đối chiếu hạn ngạch đám mây (Free Tier 0 USD) và định hình khung tính năng cho bản phát hành MVP.

## **2\. KẾ HOẠCH VÀ KẾT QUẢ CÁC PHIÊN THU THẬP (SESSIONS LOG)**

| Mã phiên | Phương thức thực hiện | Đối tượng tham gia | Thời điểm | Kết quả đầu ra chính |
| :---- | :---- | :---- | :---- | :---- |
| **SES-01** | Phỏng vấn bán cấu trúc 1-1 | ThS. Lý Tuấn Anh (Project Sponsor) | Ngày 1, Tuần 2 | Xác lập các ràng buộc học thuật, phạm vi MVP, chuẩn CSDL quan hệ 3NF và yêu cầu triển khai thực tế. |
| **SES-02** | Khảo sát trực tuyến qua biểu mẫu | 35 sinh viên và nhân sự văn phòng trẻ | Ngày 2–4, Tuần 2 | Số liệu định lượng: 68.6% thường xuyên trì hoãn; 82.9% từng bỏ app To-Do cũ; 85.7% ủng hộ cơ chế Gamification. |
| **SES-03** | Phỏng vấn người dùng chuyên sâu | 05 người dùng đại diện (3 sinh viên, 2 lập trình viên) | Ngày 4, Tuần 2 | Nỗi đau cốt lõi: App cũ nhàm chán; kỳ vọng: Tạo việc nhanh, có cơ chế chuỗi ngày (Streak) và điểm kinh nghiệm (XP). |
| **SES-04** | Hội thảo yêu cầu nội bộ | Cường (PM/Tech Lead), Hùng (PO), Kiên (BA) | Ngày 5, Tuần 2 | Thống nhất ranh giới MVP; phát hiện các bài toán kỹ thuật: lệch múi giờ Streak, chống cày điểm ảo XP, quota Free Tier. |

## **3\. NỘI DUNG THU THẬP CHI TIẾT TỪ CÁC BÊN LIÊN QUAN**

### **3.1. Ý kiến và Ràng buộc từ Project Sponsor (ThS. Lý Tuấn Anh \- Phiên SES-01)**

* **Về quy trình quản lý dự án:** Đồ án phải tuân thủ nghiêm ngặt mô hình Hybrid (kết hợp kiểm soát đường cơ sở Thác nước và nhịp độ thực thi Scrum 5 Sprint), hoàn thành đầy đủ chuỗi 21 tài liệu quản lý theo chuẩn PTIT/PMBOK và bàn giao đúng hạn 11 tuần.  
* **Về phạm vi tính năng MVP:** Tập trung xử lý trọn vẹn bài toán quản lý nhiệm vụ cá nhân và kích hoạt động lực bằng Gamification. Kiên quyết không đưa các tính năng mạng xã hội phức tạp (như chat nhóm, kết bạn) vào MVP để tránh phình to phạm vi (Scope Creep).  
* **Về tiêu chuẩn kỹ thuật:** Hệ thống bắt buộc phải tách biệt Frontend (Next.js) và Backend (Node.js/Prisma); CSDL MongoDB phải đạt chuẩn 3NF; phải có kịch bản kiểm thử tự động và triển khai thực tế trên môi trường đám mây có thể truy cập kiểm tra được.

### **3.2. Dữ liệu khảo sát và Phỏng vấn người dùng mục tiêu (Phiên SES-02 & SES-03)**

* **Nguyên nhân từ bỏ ứng dụng To-Do truyền thống:** 57.1% người dùng phản ánh giao diện chỉ toàn danh sách chữ gây cảm giác áp lực; 51.4% người dùng từ bỏ do thiếu cơ chế khen thưởng và không tạo được cảm giác thành tựu khi hoàn thành công việc.  
* **Kỳ vọng đối với Gamification:**

  * 77.1% mong muốn có thuật toán chuỗi ngày liên tục (Daily Streak) và cơ chế cứu chuỗi (Streak Freeze) khi có việc bận đột xuất.  
  * 65.7% hào hứng với việc tích lũy điểm kinh nghiệm (XP) để thăng cấp độ tài khoản (Level) như game RPG.  
  * 54.3% mong muốn mở khóa các huy hiệu thành tích (Badges) để ghi nhận nỗ lực.  
* **Yêu cầu về trải nghiệm sử dụng:** Tốc độ tạo công việc phải nhanh (dưới 10 giây); phân biệt rõ ràng giữa việc phát sinh trong ngày (One-off Task) và thói quen lặp lại (Recurring Habit); có biểu đồ trực quan thống kê tỷ lệ hoàn thành công việc.

### **3.3. Đánh giá tính khả thi kỹ thuật từ Hội thảo nội bộ (Phiên SES-04)**

* **Quy tắc chống gian lận điểm (Anti-gaming Business Rule):** Khổng Phú Cường (Tech Lead) cảnh báo nguy cơ người dùng tạo task ảo rồi tick hoàn thành liên tục để cày cấp. Nhóm thống nhất bắt buộc phải cài đặt trần kinh nghiệm tối đa trong ngày (Daily XP Cap) và chặn cộng điểm lặp lại khi hoàn tác tác vụ.  
* **Xử lý múi giờ đối với thuật toán chuỗi ngày:** Máy chủ đám mây hoạt động theo giờ quốc tế UTC, trong khi người dùng ở Việt Nam hoạt động theo múi giờ UTC+7. Để tránh việc chuỗi Streak bị reset sai thời điểm (07:00 sáng), CSDL phải lưu trữ chuẩn ISO và cấu hình Cronjob quét reset theo đúng mốc 00:00 giờ địa phương (UTC+7).  
* **Kiểm soát hạ tầng với ngân sách 0 USD:** Khai thác tối đa hạn mức miễn phí (Free Tier) của Vercel, Render và Supabase; nén toàn bộ hình ảnh huy hiệu sang định dạng WebP và áp dụng kỹ thuật Lazy Loading để không làm vượt ngưỡng băng thông và kết nối CSDL.

## **4\. DANH MỤC YÊU CẦU THÔ TRƯỚC KHI CHUẨN HÓA (RAW REQUIREMENTS CATALOG)**

Toàn bộ các yêu cầu thu thập từ các phiên làm việc được tổng hợp, đánh giá và phân loại sơ bộ trước khi chuyển sang tài liệu SRS:

| Mã yêu cầu thô | Nguồn gốc | Mô tả yêu cầu thô ban đầu | Phân loại sơ bộ | Quyết định trong phạm vi MVP |
| :---- | :---- | :---- | :---- | :---- |
| **RAW-01** | Sponsor | Xác thực tài khoản người dùng an toàn, bảo mật thông tin cá nhân. | Chức năng (FR) | **Chấp thuận đưa vào MVP** (Sử dụng JWT và mã hóa Bcrypt). |
| **RAW-02** | User Survey | Tạo, xem, cập nhật, xóa nhanh các nhiệm vụ làm một lần trong ngày. | Chức năng (FR) | **Chấp thuận đưa vào MVP** (Xây dựng module One-off Task). |
| **RAW-03** | User Interview | Tạo và theo dõi các thói quen lặp lại theo chu kỳ ngày hoặc tuần. | Chức năng (FR) | **Chấp thuận đưa vào MVP** (Xây dựng module Recurring Habit). |
| **RAW-04** | User Survey | Cộng điểm kinh nghiệm (XP) khi hoàn thành việc và tự động tính cấp độ (Level). | Chức năng (FR) | **Chấp thuận đưa vào MVP** (Thuật toán Gamification XP & Level). |
| **RAW-05** | Tech Lead | Giới hạn điểm XP tối đa trong ngày và chặn cộng điểm dồn khi tick lại việc cũ. | Ràng buộc nghiệp vụ | **Chấp thuận đưa vào MVP** (Business Rule: Daily XP Cap). |
| **RAW-06** | User Interview | Theo dõi chuỗi ngày liên tục (Daily Streak) và cho phép đóng băng chuỗi (Streak Freeze). | Chức năng (FR) | **Chấp thuận đưa vào MVP** (Thuật toán Daily Streak & Freeze). |
| **RAW-07** | User Survey | Hệ thống danh hiệu, huy hiệu (Badge) tự động mở khóa khi đạt mốc thành tựu. | Chức năng (FR) | **Chấp thuận đưa vào MVP** (Hệ sinh thái Badge Trigger). |
| **RAW-08** | User Interview | Dashboard trực quan hóa dữ liệu thống kê tỷ lệ hoàn thành công việc theo tuần. | Chức năng (FR) | **Chấp thuận đưa vào MVP** (Dashboard tỷ lệ % hoàn thành task). |
| **RAW-09** | User Interview | Nhắc nhở người dùng khi đến giờ thực hiện thói quen hoặc sắp hết hạn nhiệm vụ. | Chức năng (FR) | **Chấp thuận đưa vào MVP** (Thông báo nội bộ In-app Notification). |
| **RAW-10** | User Survey | Đăng nhập một chạm bằng tài khoản Google (OAuth). | Tiện ích (FR) | **Tạm hoãn (Should-have)**: Dành tài nguyên ưu tiên hoàn thiện luồng JWT lõi. |
| **RAW-11** | User Survey | Tính năng tạo nhóm làm việc chung để giao việc và thi đua điểm số cùng bạn bè. | Chức năng nhóm | **Bác bỏ (Out-of-Scope)**: CSDL nhóm phức tạp, làm loãng mục tiêu cá nhân của MVP. |
| **RAW-12** | User Interview | Bảng xếp hạng toàn cầu (Global Leaderboard) so tài điểm số giữa tất cả người dùng. | Gamification xã hội | **Bác bỏ (Out-of-Scope)**: Tránh tiêu cực và rủi ro bảo mật dữ liệu người dùng Pilot. |
| **RAW-13** | User Survey | Tích hợp AI tự động phân tích và gợi ý chia nhỏ nhiệm vụ lớn thành việc con. | Trí tuệ nhân tạo | **Bác bỏ (Out-of-Scope)**: Vượt trần ngân sách 0 USD (chi phí gọi API AI ngoài). |
| **RAW-14** | Sponsor / Tech | Phản hồi API trung bình dưới 300 ms, hệ thống hoạt động ổn định Uptime \> 99.5%. | Phi chức năng (NFR) | **Chấp thuận đưa vào MVP** (Tối ưu hóa chỉ mục CSDL và API). |
| **RAW-15** | Sponsor | Triển khai ứng dụng hoàn chỉnh trên môi trường điện toán đám mây công khai. | Ràng buộc triển khai | **Chấp thuận đưa vào MVP** (Triển khai CI/CD lên Vercel và Render). |

## **5\. KẾT LUẬN VÀ CHUYỂN GIAO SANG ĐẶC TẢ YÊU CẦU** 

### **5.1. Kết quả sàng lọc yêu cầu**

Qua 04 phiên làm việc, đội dự án đã tiếp nhận 15 yêu cầu thô và phân loại dứt khoát:

* **10 yêu cầu cốt lõi được phê duyệt vào phạm vi MVP (Must-have):** Gồm toàn bộ các yêu cầu chức năng nền tảng (RAW-01 đến RAW-09), ràng buộc phi chức năng (RAW-14) và điều kiện triển khai (RAW-15).  
* **01 yêu cầu tạm hoãn (Should-have):** Tính năng đăng nhập Google OAuth (RAW-10), chuyển vào danh mục dự phòng.  
* **04 yêu cầu bị bác bỏ khỏi phạm vi MVP (Out-of-Scope):** Gồm Nhiệm vụ nhóm (RAW-11), Bảng xếp hạng toàn cầu (RAW-12), Tính năng AI gợi ý task (RAW-13). Các yêu cầu này được lưu vết vào Future Product Backlog cho các giai đoạn phát triển tiếp theo sau khi kết thúc đồ án.

### **5.2. Chuyển giao sang các tài liệu tiếp theo**

Toàn bộ danh mục yêu cầu thô được chấp thuận là cơ sở trực tiếp để:

* **Biên soạ**n DOC-08: SRS Baseline: Chuẩn hóa các mục RAW thành danh mục yêu cầu chức năng (FR-01 đến FR-08) và yêu cầu phi chức năng (NFR-01 đến NFR-04) theo mẫu chuẩn IEEE 830 để thực hiện đóng băng đường cơ sở tại Cổng kiểm soát Stage Gate 2\.  
* **Khởi tạo** DOC-09: Initial Product Backlog: Chuyển dịch các yêu cầu chức năng thành các User Story chi tiết kèm tiêu chí chấp nhận Acceptance Criteria (AC) và gán điểm Story Points phục vụ lập kế hoạch cho 05 chu kỳ Sprint.


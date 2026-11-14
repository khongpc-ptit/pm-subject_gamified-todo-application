# **\[TECH-DOC\] USER & AUTH DATA MODEL & API CONTRACT (SPRINT 1\)**

- **Tham chiếu nền tảng:** Kế thừa trực tiếp lược đồ Collection users (MongoDB \+ Mongoose ODM), quy chuẩn bảo mật (Bcrypt, JWT) và chuẩn phản hồi RESTful Envelope từ DOC-11: System Design Document.
- **Mục tiêu:** Khóa cứng mô hình dữ liệu người dùng, quy tắc xác thực/mã hóa mật khẩu, cấu trúc JWT Payload và đặc tả Request/Response cho 03 endpoints xác thực (/register, /login, /me) để Frontend và Backend triển khai song song.

## **1\. BẢNG QUY TẮC RÀNG BUỘC VÀ XÁC THỰC DỮ LIỆU (USER FIELD & VALIDATION RULES)**

Áp dụng cho Collection users trong MongoDB:

| Tên trường (Field)                        | Kiểu dữ liệu (MongoDB / JSON) | Phân loại             | Ràng buộc nghiệp vụ & Quy tắc Validation                                                       | Xử lý phía Server (Backend / Mongoose)                                                                                                                     |
| :---------------------------------------- | :---------------------------- | :-------------------- | :--------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_id                                      | ObjectId / string             | Hệ thống sinh         | Chuỗi 24 ký tự Hexadecimal duy nhất.                                                           | Tự động khởi tạo bởi MongoDB; nhúng vào payload của JWT token dưới dạng id.                                                                                |
| email                                     | string                        | **Bắt buộc** (Unique) | Đúng định dạng email hợp lệ; tự động chuyển chữ thường (lowercase) và cắt khoảng trắng (trim). | Kiểm tra regex email; nếu đã tồn tại trong DB trả về 409 Conflict (EMAIL_ALREADY_EXISTS).                                                                  |
| password _(Input)_ / password_hash _(DB)_ | string                        | **Bắt buộc**          | Mật khẩu thô đầu vào tối thiểu **6 ký tự** (khuyến nghị \<= 72 ký tự theo giới hạn Bcrypt).    | Không lưu mật khẩu thô. Băm bằng **Bcrypt (saltRounds \= 10\)** trước khi lưu vào password_hash. **Tuyệt đối không trả password_hash trong API Response.** |
| full_name                                 | string                        | **Bắt buộc**          | Tự động trim(), không được rỗng, độ dài từ **2 đến 100 ký tự**.                                | Kiểm tra độ dài hợp lệ; trả về 400 Bad Request nếu rỗng hoặc không đạt chuẩn.                                                                              |
| current_level                             | number (Int)                  | Hệ thống quản lý      | Mặc định 1\. Read-only đối với API Auth.                                                       | Khởi tạo 1 khi đăng ký; tự động cập nhật theo công thức Gamification.                                                                                      |
| total_xp                                  | number (Int)                  | Hệ thống quản lý      | Mặc định 0\. Read-only đối với API Auth.                                                       | Khởi tạo 0 khi đăng ký.                                                                                                                                    |
| current_streak                            | number (Int)                  | Hệ thống quản lý      | Mặc định 0\. Read-only đối với API Auth.                                                       | Khởi tạo 0 khi đăng ký.                                                                                                                                    |
| last_active_date                          | string \| null                | Hệ thống quản lý      | Định dạng YYYY-MM-DD (múi giờ UTC+7). Mặc định null.                                           | Cập nhật khi người dùng hoàn thành Task hoặc check-in Habit.                                                                                               |
| streak_freeze_count                       | number (Int)                  | Hệ thống quản lý      | Mặc định 1 (tặng 1 lượt bảo vệ chuỗi khi tạo tài khoản).                                       | Khởi tạo 1 khi đăng ký.                                                                                                                                    |
| created_at, updated_at                    | Date / string                 | Hệ thống sinh         | Chuỗi thời gian chuẩn ISO 8601 UTC.                                                            | Tự động sinh và cập nhật qua Mongoose timestamps.                                                                                                          |

## **2\. QUY CHUẨN BẢO MẬT & CƠ CHẾ JWT TOKEN**

- **Mã hóa mật khẩu (Password Hashing):**
  - Sử dụng thư viện bcryptjs (hoặc bcrypt) với **Salt rounds \= 10**.
  - Khi đăng nhập, đối chiếu mật khẩu đầu vào với user.password_hash bằng bcrypt.compare(password, user.password_hash).
- **Cấu trúc JWT Access Token:**
  - Thuật toán ký: HS256 sử dụng khóa bí mật JWT_SECRET lưu trong biến môi trường (.env).
  - Thời hạn token (expiresIn): 7d (7 ngày) hoặc 24h theo cấu hình môi trường.
  - **JWT Payload:**  
    JSON  
    {  
     "id": "672a11112222333344445555",  
     "email": "user@ptit.edu.vn",  
     "iat": 1731585600,  
     "exp": 1732190400  
    }

- **Auth Middleware (verifyToken):**
  - Trích xuất token từ Header Authorization: Bearer \<JWT_TOKEN\>.
  - Nếu thiếu Header hoặc token sai/hết hạn, trả về ngay 401 Unauthorized (UNAUTHORIZED).
  - Nếu hợp lệ, giải mã và gán req.user \= { id: decoded.id, email: decoded.email } cho các controller phía sau (bao gồm module Task, Habit, Gamification).

## **3\. ĐẶC TẢ CHI TIẾT REQUEST / RESPONSE PAYLOAD**

### **3.1. Đăng ký tài khoản mới: POST /api/v1/auth/register**

1. **Quyền hạn:** Công khai (Public)
2. **Request Body (JSON):**

JSON  
{  
 "email": "kien.nt@ptit.edu.vn",  
 "password": "Password@123",  
 "full_name": "Nguyễn Trung Kiên"  
}

1. **Quy tắc xử lý tại Backend:**
   - Kiểm tra định dạng email, độ dài password (\>= 6 ký tự) và full_name (không rỗng).
   - Chuẩn hóa email về chữ thường và kiểm tra trùng lặp trong Collection users. Nếu đã tồn tại, trả về 409 Conflict (EMAIL_ALREADY_EXISTS).
   - Băm password bằng bcrypt.hash(password, 10\) và lưu tài liệu mới vào MongoDB với các giá trị Gamification mặc định.
   - Tạo JWT Access Token và trả về thông tin người dùng (đã loại bỏ password_hash).
2. **Response Thành công (201 Created):**

JSON  
{  
 "success": true,  
 "data": {  
 "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  
 "user": {  
 "\_id": "672a11112222333344445555",  
 "email": "kien.nt@ptit.edu.vn",  
 "full_name": "Nguyễn Trung Kiên",  
 "current_level": 1,  
 "total_xp": 0,  
 "current_streak": 0,  
 "last_active_date": null,  
 "streak_freeze_count": 1,  
 "created_at": "2026-11-14T14:00:00.000Z"  
 }  
 },  
 "message": "Đăng ký tài khoản thành công",  
 "timestamp": "2026-11-14T14:00:00.005Z"  
}

### **3.2. Đăng nhập hệ thống: POST /api/v1/auth/login**

1. **Quyền hạn:** Công khai (Public)
2. **Request Body (JSON):**

JSON  
{  
 "email": "kien.nt@ptit.edu.vn",  
 "password": "Password@123"  
}

- **Quy tắc xử lý tại Backend:**
  1. Kiểm tra email và password không được để trống.
  2. Tìm người dùng theo email (đã lowercase). Nếu không tìm thấy hoặc bcrypt.compare trả về false, trả về chung một thông báo lỗi 401 Unauthorized (INVALID_CREDENTIALS) để tránh lộ thông tin tài khoản tồn tại.
  3. Nếu hợp lệ, ký JWT Access Token mới và trả về kèm hồ sơ người dùng (ẩn password_hash).
- **Response Thành công (200 OK):**

JSON  
{  
 "success": true,  
 "data": {  
 "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  
 "user": {  
 "\_id": "672a11112222333344445555",  
 "email": "kien.nt@ptit.edu.vn",  
 "full_name": "Nguyễn Trung Kiên",  
 "current_level": 1,  
 "total_xp": 0,  
 "current_streak": 0,  
 "last_active_date": null,  
 "streak_freeze_count": 1,  
 "created_at": "2026-11-14T14:00:00.000Z"  
 }  
 },  
 "message": "Đăng nhập thành công",  
 "timestamp": "2026-11-14T14:05:00.005Z"  
}

### **3.3. Lấy thông tin người dùng hiện tại: GET /api/v1/auth/me**

- **Quyền hạn:** Authenticated User
- **Request Headers:** Authorization: Bearer \<JWT_TOKEN\>
- **Request Body:** Không có.
- **Quy tắc xử lý tại Backend:**
  1. Middleware verifyToken xác thực JWT và gắn req.user.id.
  2. Truy vấn User.findById(req.user.id).select('-password_hash').
  3. Nếu không tìm thấy user (ví dụ tài khoản đã bị xóa), trả về 404 Not Found (USER_NOT_FOUND).
- **Response Thành công (200 OK):**

JSON  
{  
 "success": true,  
 "data": {  
 "\_id": "672a11112222333344445555",  
 "email": "kien.nt@ptit.edu.vn",  
 "full_name": "Nguyễn Trung Kiên",  
 "current_level": 4,  
 "total_xp": 1450,  
 "current_streak": 12,  
 "last_active_date": "2026-11-14",  
 "streak_freeze_count": 1,  
 "created_at": "2026-11-14T14:00:00.000Z"  
 },  
 "message": "Lấy thông tin người dùng thành công",  
 "timestamp": "2026-11-14T14:10:00.005Z"  
}

## **4\. BẢNG MÃ LỖI MODULE AUTH (ERROR MAPPING SPECIFICATION)**

| HTTP Status | Mã lỗi (error.code)   | Tình huống phát sinh tại Server                                       | Quy tắc xử lý trên giao diện (Frontend)                          |
| :---------- | :-------------------- | :-------------------------------------------------------------------- | :--------------------------------------------------------------- |
| 400         | VALIDATION_ERROR      | Thiếu trường bắt buộc, email sai định dạng, hoặc password \< 6 ký tự. | Hiển thị thông báo lỗi inline ngay dưới ô nhập liệu tương ứng.   |
| 401         | INVALID_CREDENTIALS   | Email không tồn tại hoặc mật khẩu không khớp khi đăng nhập.           | Hiển thị thông báo: _"Email hoặc mật khẩu không chính xác"_.     |
| 401         | UNAUTHORIZED          | Thiếu Header Authorization, hoặc JWT token sai / hết hạn.             | Xóa token lưu cục bộ và chuyển hướng người dùng về trang /login. |
| 404         | USER_NOT_FOUND        | Không tìm thấy tài khoản tương ứng với id trong token khi gọi /me.    | Xóa token cục bộ và điều hướng về /login.                        |
| 409         | EMAIL_ALREADY_EXISTS  | Email đăng ký đã tồn tại trong Collection users.                      | Báo lỗi tại ô Email: _"Email này đã được sử dụng"_.              |
| 500         | INTERNAL_SERVER_ERROR | Lỗi máy chủ hoặc gián đoạn kết nối tới MongoDB Atlas.                 | Hiển thị Toast: _"Hệ thống đang bận, vui lòng thử lại sau"_.     |

## **5\. ĐỊNH NGHĨA KIỂU DỮ LIỆU TYPESCRIPT DÙNG CHUNG (SHARED TYPESCRIPT INTERFACES)**

Frontend (client/src/types/auth.types.ts) và Backend dùng chung bộ định nghĩa kiểu dữ liệu sau:

TypeScript  
export interface UserProfile {  
 \_id: string;  
 email: string;  
 full_name: string;  
 current_level: number;  
 total_xp: number;  
 current_streak: number;  
 last_active_date: string \| null;  
 streak_freeze_count: number;  
 created_at: string;  
}

export interface RegisterRequestDTO {  
 email: string;  
 password: string;  
 full_name: string;  
}

export interface LoginRequestDTO {  
 email: string;  
 password: string;  
}

export interface AuthResponseData {  
 token: string;  
 user: UserProfile;  
}

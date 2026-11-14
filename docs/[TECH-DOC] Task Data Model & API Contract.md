# **Task Data Model & API Contract (US-07, US-08, US-09, US-10)**

* **Tham chiếu nền tảng:** Kế thừa trực tiếp cấu trúc dữ liệu tasks và chuẩn RESTful Envelope từ DOC-11: System Design Document.  
* **Mục tiêu:** Khóa các quy tắc kiểm tra hợp lệ dữ liệu (Validation Rules) và payload request/response chi tiết để FE và BE triển khai song song.

## **1\. BẢNG QUY TẮC RÀNG BUỘC VÀ XÁC THỰC DỮ LIỆU (VALIDATION RULES)**

Áp dụng cho dữ liệu đầu vào khi Tạo mới (US-07) và Cập nhật (US-09):

| Trường (Field) | Kiểu dữ liệu | Bắt buộc | Ràng buộc nghiệp vụ & Validation | Kiểm tra phía Client (FE) | Kiểm tra phía Server (BE) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| title | String | **Có** | • Không được rỗng sau khi trim() • Độ dài: từ **1 đến 200 ký tự** | Chặn submit, báo lỗi nếu rỗng hoặc \> 200 ký tự. | Trả về 400 Bad Request nếu thiếu hoặc rỗng. |
| description | String | Không | • Chuỗi ký tự, tối đa 1000 ký tự • Mặc định: "" | Không giới hạn nếu để trống. | Cắt tỉa (trim), lưu chuỗi rỗng nếu không truyền. |
| priority | String | Không | • Chỉ chấp nhận: "LOW", "MEDIUM", "HIGH" • Mặc định: "MEDIUM" | Hiển thị dropdown/select, giá trị mặc định là Medium. | Kiểm tra enum; tự động tính xp\_reward tương ứng (LOW: 10, MEDIUM: 20, HIGH: 30). |
| due\_date | String / Date | Không | • Chuỗi ngày định dạng ISO 8601 (YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm:ss.sssZ) • Mặc định: null | Sử dụng DatePicker, cho phép xóa ngày (clear). | Kiểm tra tính hợp lệ của Date object; lưu null nếu không chọn. |
| status | String | Không | • Khởi tạo luôn là "TODO" • Enum: \["TODO", "IN\_PROGRESS", "COMPLETED"\] | Không hiển thị trường này trong form tạo mới. | Tự động gán "TODO" khi tạo mới; chỉ nhận cập nhật ở API tương ứng. |

## **2\. ĐẶC TẢ CHI TIẾT REQUEST / RESPONSE PAYLOAD**

Tất cả các endpoint đều yêu cầu Header: Authorization: Bearer \<JWT\_TOKEN\>. Mọi thao tác truy vấn và chỉnh sửa đều được Backend tự động gắn điều kiện { user\_id: req.user.id }.

### **2.1. \[US-07\] Tạo mới nhiệm vụ: POST /api/v1/tasks**

* **Request Body:**

**JSON**  
{  
  "title": "Nộp báo cáo kiến trúc hệ thống",  
  "description": "Kiểm tra lại Swagger trước khi nộp",  
  "priority": "HIGH",  
  "due\_date": "2026-11-10T17:00:00.000Z"  
}

* **Response Thành công (201 Created):**

**JSON**  
{  
  "success": true,  
  "data": {  
    "\_id": "672b1234abcd5678ef901234",  
    "user\_id": "672a11112222333344445555",  
    "title": "Nộp báo cáo kiến trúc hệ thống",  
    "description": "Kiểm tra lại Swagger trước khi nộp",  
    "priority": "HIGH",  
    "status": "TODO",  
    "due\_date": "2026-11-10T17:00:00.000Z",  
    "xp\_reward": 30,  
    "completed\_at": null,  
    "created\_at": "2026-11-05T15:00:00.000Z"  
  },  
  "message": "Tạo nhiệm vụ thành công",  
  "timestamp": "2026-11-05T15:00:00.000Z"  
}

### **2.2. \[US-08\] Xem danh sách nhiệm vụ: GET /api/v1/tasks**

* **Query Parameters (tùy chọn lọc):**  
  * status: TODO \| IN\_PROGRESS \| COMPLETED (nếu không truyền, trả về tất cả task của user).  
* **Response Thành công (200 OK \- Có dữ liệu):**

JSON  
{  
  "success": true,  
  "data": {  
    "tasks": \[  
      {  
        "\_id": "672b1234abcd5678ef901234",  
        "user\_id": "672a11112222333344445555",  
        "title": "Nộp báo cáo kiến trúc hệ thống",  
        "description": "Kiểm tra lại Swagger trước khi nộp",  
        "priority": "HIGH",  
        "status": "TODO",  
        "due\_date": "2026-11-10T17:00:00.000Z",  
        "xp\_reward": 30,  
        "completed\_at": null,  
        "created\_at": "2026-11-05T15:00:00.000Z"  
      }  
    \],  
    "total": 1  
  },  
  "timestamp": "2026-11-05T15:00:00.000Z"  
}

* **Response Thành công (200 OK \- Danh sách rỗng / Empty State):**

JSON  
{  
  "success": true,  
  "data": {  
    "tasks": \[\],  
    "total": 0  
  },  
  "timestamp": "2026-11-05T15:00:00.000Z"  
}

*(Yêu cầu FE: Khi tasks.length \=== 0, hiển thị giao diện Empty State và nút Tạo nhiệm vụ đầu tiên).*

### **2.3. \[US-09\] Cập nhật thông tin nhiệm vụ: PUT /api/v1/tasks/:id**

* **Path Parameter:** :id (Chuỗi 24 ký tự hex của MongoDB \_id).  
* **Request Body (chỉ gửi các trường cần cập nhật):**

JSON  
{  
  "title": "Nộp báo cáo kiến trúc hệ thống (Đã chỉnh sửa)",  
  "priority": "MEDIUM",  
  "due\_date": null  
}

* **Response Thành công (200 OK):**

JSON  
{  
  "success": true,  
  "data": {  
    "\_id": "672b1234abcd5678ef901234",  
    "user\_id": "672a11112222333344445555",  
    "title": "Nộp báo cáo kiến trúc hệ thống (Đã chỉnh sửa)",  
    "description": "Kiểm tra lại Swagger trước khi nộp",  
    "priority": "MEDIUM",  
    "status": "TODO",  
    "due\_date": null,  
    "xp\_reward": 20,  
    "completed\_at": null,  
    "created\_at": "2026-11-05T15:00:00.000Z"  
  },  
  "message": "Cập nhật nhiệm vụ thành công",  
  "timestamp": "2026-11-05T15:05:00.000Z"  
}

### **2.4. \[US-10\] Đánh dấu hoàn thành nhiệm vụ: PATCH /api/v1/tasks/:id/complete**

* **Path Parameter:** :id (Mã \_id của task cần hoàn thành).  
* **Request Body:** Không có (hoặc gửi {}).  
* **Xử lý Backend:**  
  1. Kiểm tra quyền sở hữu task.  
  2. Gán status \= "COMPLETED".  
  3. Gán completed\_at \= new Date().  
  4. *Lưu ý (Technical Note theo US-10):* Không thực hiện cộng điểm XP ở endpoint này; điểm thưởng XP sẽ được module Gamification xử lý độc lập tại US-02.  
* **Response Thành công (200 OK):**

JSON  
{  
  "success": true,  
  "data": {  
    "\_id": "672b1234abcd5678ef901234",  
    "user\_id": "672a11112222333344445555",  
    "title": "Nộp báo cáo kiến trúc hệ thống (Đã chỉnh sửa)",  
    "description": "Kiểm tra lại Swagger trước khi nộp",  
    "priority": "MEDIUM",  
    "status": "COMPLETED",  
    "due\_date": null,  
    "xp\_reward": 20,  
    "completed\_at": "2026-11-05T15:10:00.000Z",  
    "created\_at": "2026-11-05T15:00:00.000Z"  
  },  
  "message": "Nhiệm vụ đã được đánh dấu hoàn thành",  
  "timestamp": "2026-11-05T15:10:00.000Z"  
}

## **3\. BẢNG MÃ LỖI CHO MODULE TASK (ERROR MAPPING)**

Khi có lỗi phát sinh, Backend trả về định dạng { "success": false, "error": { "code", "message" }, "timestamp" } với các mã chuẩn sau:

| HTTP Status | Error Code | Tình huống phát sinh | Cách xử lý phía Frontend |
| :---- | :---- | :---- | :---- |
| 400 | TITLE\_REQUIRED | Trường title bị bỏ trống hoặc chỉ chứa khoảng trắng. | Hiển thị thông báo đỏ dưới ô input: "Vui lòng nhập tiêu đề nhiệm vụ". |
| 400 | TITLE\_TOO\_LONG | Tiêu đề vượt quá 200 ký tự. | Báo lỗi giới hạn độ dài cho người dùng. |
| 400 | INVALID\_PRIORITY | Giá trị priority không thuộc LOW/MEDIUM/HIGH. | Tự động chọn lại "MEDIUM". |
| 400 | INVALID\_ID | Định dạng :id không phải 24 ký tự hex của MongoDB. | Báo lỗi: "Định danh nhiệm vụ không hợp lệ". |
| 403 | FORBIDDEN | Nhiệm vụ tồn tại nhưng do tài khoản khác tạo ra. | Báo lỗi: "Bạn không có quyền thao tác trên nhiệm vụ này". |
| 404 | TASK\_NOT\_FOUND | Không tìm thấy task với :id đã cung cấp. | Thông báo task không tồn tại và tự động làm mới danh sách. |

## **4\. GIAO DIỆN TYPESCRIPT CHUNG (SHARED TYPE FOR FRONTEND & BACKEND)**

Frontend (client) và Backend (server) dùng chung định nghĩa kiểu dữ liệu này để tránh lệch trường:

TypeScript  
export type TaskPriority \= 'LOW' \| 'MEDIUM' \| 'HIGH';  
export type TaskStatus \= 'TODO' \| 'IN\_PROGRESS' \| 'COMPLETED';

export interface Task {  
  \_id: string;  
  user\_id: string;  
  title: string;  
  description: string;  
  priority: TaskPriority;  
  status: TaskStatus;  
  due\_date: string \| null;  
  xp\_reward: number;  
  completed\_at: string \| null;  
  created\_at: string;  
}

export interface CreateTaskDTO {  
  title: string;  
  description?: string;  
  priority?: TaskPriority;  
  due\_date?: string \| null;  
}

export interface UpdateTaskDTO {  
  title?: string;  
  description?: string;  
  priority?: TaskPriority;  
  due\_date?: string \| null;  
  status?: TaskStatus;  
}


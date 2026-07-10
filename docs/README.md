\# Hệ thống Quản trị Tri thức Đội phát triển Drone (RtR KMS)



\## 1. Tổng quan dự án

Hệ thống KMS này được thiết kế và xây dựng dựa trên kịch bản mô phỏng bối cảnh nghiên cứu của phòng R\&D thuộc tổ chức Real-Time Robotics (RtR) Việt Nam. Hệ thống phục vụ việc thu thập, lưu trữ, phân loại và thúc đẩy tái sử dụng các tri thức ẩn về quy trình hiệu chuẩn cảm biến, chẩn đoán nhật ký chuyến bay và các bài học kinh nghiệm kỹ thuật.



\## 2. Công nghệ triển khai bản mẫu (Tech Stack)

\* \*\*Frontend:\*\* React/HTML5, Tailwind CSS phục vụ xây dựng giao diện tương tác và chuyển đổi vai trò giả lập (Role Switcher).

\* \*\*Backend:\*\* Java Spring Boot (Spring Data JPA, Spring Web) đóng vai trò điều phối luồng nghiệp vụ quản trị tri thức.

\* \*\*Database:\*\* Supabase (PostgreSQL) đóng vai trò là Cơ sở tri thức tập trung (Centralized Knowledge Base) để lưu trữ động các thuộc tính tri thức.



\## 3. Các vai trò người dùng hệ thống (User Roles)

\* \*\*Knowledge Contributor (Phi công/Kỹ sư):\*\* Sử dụng biểu mẫu gửi báo cáo tình huống sự cố, đẩy dữ liệu lên qua API POST.

\* \*\*Reviewer / Expert (Kỹ sư trưởng):\*\* Thẩm định, kiểm duyệt, cập nhật trạng thái tri thức thông qua API PUT.

\* \*\*End User (Kỹ sư mới):\*\* Tra cứu, tìm kiếm bài học kinh nghiệm thông qua API GET kèm bộ lọc thông minh.



\## 4. Ranh giới giới hạn hệ thống (System Boundary)

> \*\*LƯU Ý CỐT LÕI:\*\* Hệ thống KMS này đóng vai trò tổ chức, phân loại, lưu trữ và thúc đẩy chia sẻ tri thức vận hành. Hệ thống này \*\*KHÔNG\*\* phải là phần mềm tự động giải mã log trực tiếp (Log Parser Engine), không phải hệ thống quản lý mạch pin vật lý (BMS), không phải phần mềm điều khiển bay và không tích hợp hạ tầng bảo mật mạng thực tế của doanh nghiệp. Toàn bộ kịch bản và dữ liệu lỗi phục vụ mục đích nghiên cứu học thuật của môn học KMS301.


\# Bộ biểu mẫu thuộc tính định danh tri thức \& Cấu trúc thực thể cơ sở dữ liệu



Mọi tài sản tri thức khi được tạo ra hoặc lưu trữ vào kho chứa của Supabase thông qua Java Spring Boot bắt buộc phải ánh xạ theo bộ trường dữ liệu thuộc tính cấu trúc sau:



| Thuộc tính (Metadata Field) | Loại dữ liệu Java | Ánh xạ cột PostgreSQL | Ý nghĩa quản trị tri thức |

| :--- | :--- | :--- | :--- |

| \*\*Title\*\* | `String` | `title` | Tên hiển thị tóm tắt của tài sản tri thức |

| \*\*Category\*\* | `String` | `category` | Vị trí phân loại nằm trên cây Taxonomy |

| \*\*KnowledgeType\*\* | `String` | `knowledge\_type` | Bản chất tri thức (Tacit / Explicit / Mixed) |

| \*\*Author\*\* | `String` | `author` | Định danh kỹ sư đóng góp tri thức vào hệ thống |

| \*\*Reviewer\*\* | `String` | `reviewer` | Kỹ sư trưởng chịu trách nhiệm thẩm định |

| \*\*Version\*\* | `String` | `version` | Quản lý phiên bản tri thức công nghệ (v1.0, v1.1...) |

| \*\*Tags\*\* | `List<String>` | `tags` (TEXT\[]) | Từ khóa cốt lõi để bộ máy tìm kiếm quét nhanh (#IMU, #Compass) |

| \*\*Summary\*\* | `String` | `summary` | Tóm tắt giải pháp giúp kỹ sư tra cứu nhanh |

| \*\*SeverityLevel\*\* | `String` | `severity\_level`| Mức độ nghiêm trọng của lỗi ảnh hưởng đến drone |

| \*\*RootCause\*\* | `String` | `root\_cause` | Diễn giải lý do gốc rễ gây ra sự cố phục vụ học tập |

| \*\*AttachmentUrl\*\* | `String` | `attachment\_url` | Đường dẫn liên kết tệp log hộp đen (.bin) đính kèm giả lập |

| \*\*Status\*\* | `String` | `status` | Trạng thái vòng đời kiểm duyệt (Pending/Approved) |


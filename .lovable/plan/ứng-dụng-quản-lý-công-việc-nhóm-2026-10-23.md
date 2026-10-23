# Ứng dụng quản lý công việc nhóm

## Mục tiêu

Admin giao việc cho nhân viên và xem tiến độ cả nhóm. Nhân viên xem việc của mình và cập nhật tiến độ. Toàn bộ giao diện bằng tiếng Việt.

## Tài khoản

- Trang đăng ký và đăng nhập dùng **email + mật khẩu**
- Ai cũng tự đăng ký được và mặc định là **nhân viên**.
- **Người đăng ký đầu tiên tự động thành admin.** Admin có thể nâng hoặc hạ quyền người khác trong trang "Thành viên".
  &nbsp;



## Chi tiết kỹ thuật

- Bật Lovable Cloud. Đăng nhập bằng email ảo suy ra từ tên đăng nhập (`username@app.local`), bật tự xác nhận.
- Bảng: `profiles` (id, username duy nhất, tên hiển thị), `user_roles` (enum admin/staff, tách riêng, hàm `has_role`), `tasks` (title, description, status enum todo/in_progress/done, priority enum low/medium/high, progress 0–100, deadline, assigned_to, created_by, timestamps).
- Trigger khi đăng ký: tạo profile; gán admin nếu là người đầu tiên, còn lại staff.
- RLS: admin toàn quyền tasks; staff SELECT/UPDATE task có assigned_to = mình, trigger chặn staff sửa cột ngoài status/progress.
- Trang đã đăng nhập nằm dưới `_authenticated`; trang admin kiểm tra vai trò.

Kéo thả dùng dnd-kit. Test cho quy tắc đồng bộ tiến độ/trạng thái.

2. Admin - Quản lý công việc

- **Tạo task mới** với các trường: tiêu đề, mô tả, mức độ ưu tiên (Low/Medium/High/Urgent), deadline, người đảm nhiệm
- **Sửa/Xóa** task đã tạo
- Giao task cho một hoặc nhiều staff

### 3. Admin - Dashboard tổng hợp

- **Chế độ Table:** Bảng hiển thị tất cả task với cột trạng thái, người phụ trách, deadline, mức ưu tiên. Có thể lọc và sắp xếp
- **Chế độ Kanban:** 4 cột (Todo, Doing, Review, Done) hiển thị task dạng card, có thể kéo thả giữa các cột
- Nút chuyển đổi giữa 2 chế độ xem
- Tổng quan nhanh: số task theo trạng thái, task sắp hết hạn

### 4. Staff - Xem công việc được giao

- Danh sách task được giao cho mình (cũng hỗ trợ 2 chế độ Table & Kanban)
- Lọc theo trạng thái, mức ưu tiên, deadline

### 5. Staff - Cập nhật tiến độ

- Thay đổi trạng thái task (Todo $\rightarrow$ Doing $\rightarrow$ Review $\rightarrow$ Done)
- Thêm ghi chú/comment vào task

### 6. Giao diện chung

- Sidebar navigation với các mục phù hợp vai trò
- Thiết kế clean, responsive
- Thông báo toast khi có thao tác thành công/lỗi

### Backend (Supabase)

- **Database:** bảng tasks, profiles, user_roles, task_comments
- **Authentication:** email/password
- **Row Level Security:** Admin xem tất cả, Staff chỉ xem task của mình
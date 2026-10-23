# Ứng dụng quản lý công việc nhóm

## Mục tiêu
Admin giao việc cho nhân viên và xem tiến độ cả nhóm. Nhân viên xem việc của mình và cập nhật tiến độ. Toàn bộ giao diện bằng tiếng Việt.

## Tài khoản
- Trang đăng ký và đăng nhập dùng **tên đăng nhập + mật khẩu**, không cần email.
- Ai cũng tự đăng ký được và mặc định là **nhân viên**.
- **Người đăng ký đầu tiên tự động thành admin.** Admin có thể nâng hoặc hạ quyền người khác trong trang "Thành viên".
- Hạn chế: không có "quên mật khẩu" qua email (vì không dùng email).

## Các trang
1. **Đăng nhập / Đăng ký**
2. **Tổng quan (admin)**: số việc theo trạng thái, việc quá hạn, tiến độ trung bình của từng người, ai đang làm gì.
3. **Công việc**: chuyển qua lại giữa 2 kiểu xem
   - **Kanban**: 3 cột Cần làm / Đang làm / Xong, kéo thả thẻ để đổi trạng thái.
   - **Danh sách**: bảng có lọc theo người phụ trách, mức ưu tiên, trạng thái, sắp xếp theo hạn.
   - Admin thấy tất cả việc; nhân viên chỉ thấy việc được giao cho mình.
4. **Chi tiết công việc**: tiêu đề, mô tả, ưu tiên, hạn, người phụ trách, người tạo, thanh tiến độ 0–100%.
5. **Thành viên (admin)**: danh sách người dùng, đổi vai trò.

## Quyền hạn
- Admin: tạo, sửa, xoá mọi việc; giao việc cho bất kỳ ai.
- Nhân viên: chỉ xem việc của mình, chỉ được đổi trạng thái và % tiến độ (không sửa tiêu đề, hạn, người phụ trách).
- Tiến độ 100% tự đặt trạng thái "Xong"; kéo sang "Xong" tự đặt 100%.

## Phong cách
Gọn gàng, kiểu công cụ làm việc: nền sáng ấm, màu nhấn xanh rêu, nhãn ưu tiên Cao/Trung bình/Thấp có màu riêng, cảnh báo đỏ cho việc quá hạn.

## Chi tiết kỹ thuật
- Bật Lovable Cloud. Đăng nhập bằng email ảo suy ra từ tên đăng nhập (`username@app.local`), bật tự xác nhận.
- Bảng: `profiles` (id, username duy nhất, tên hiển thị), `user_roles` (enum admin/staff, tách riêng, hàm `has_role`), `tasks` (title, description, status enum todo/in_progress/done, priority enum low/medium/high, progress 0–100, deadline, assigned_to, created_by, timestamps).
- Trigger khi đăng ký: tạo profile; gán admin nếu là người đầu tiên, còn lại staff.
- RLS: admin toàn quyền tasks; staff SELECT/UPDATE task có assigned_to = mình, trigger chặn staff sửa cột ngoài status/progress.
- Trang đã đăng nhập nằm dưới `_authenticated`; trang admin kiểm tra vai trò.
- Kéo thả dùng dnd-kit. Test cho quy tắc đồng bộ tiến độ/trạng thái.

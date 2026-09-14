# Ôn thi Lập trình hướng đối tượng

Trang ôn tập cho môn Lập trình hướng đối tượng, mã môn 229034, Khoa Công nghệ thông tin, Trường Cao đẳng Công Thương TP. Hồ Chí Minh.

## Nội dung

- Toàn bộ 360 câu trắc nghiệm của sáu chương, kèm đáp án chính thức.
- Mỗi câu có một lời giải viết bằng lời lẽ đơn giản, nói rõ vì sao chọn đáp án đó và bẫy thường gặp.
- Mỗi câu có kèm vị trí cần xem lại trong slide bài giảng, lấy từ chính phần tham chiếu trong slide.
- Mỗi chương có một phần tóm tắt lý thuyết bám theo slide, gồm bảng phạm vi truy cập, bảng phân biệt quá tải với ghi đè và bảng quyết định đa hình.
- 317 câu có code chạy thử được ngay trên trang; 29 câu còn lại thiếu hàm main nên chỉ ghi rõ đầu ra.

## Cách dùng

Mở `index.html` bằng trình duyệt. Trang chạy hoàn toàn ở phía trình duyệt, không cần cài đặt gì thêm.

- Chọn chương ở cột bên trái, bấm vào đáp án để xem kết quả và lời giải.
- Ô tìm kiếm lọc theo từ khóa trên cả 360 câu, ví dụ constructor, virtual, static, interface.
- Bộ lọc giúp xem riêng những câu chưa làm hoặc đã làm sai.
- Bốc đề ngẫu nhiên theo phạm vi và số lượng, chấm điểm ở cuối. Số câu tối đa bằng số câu có trong phạm vi, riêng cả sáu chương thì trần là 90.
- Trên điện thoại có thanh điều hướng dưới đáy: Chương, Tìm, Luyện đề, Xếp hạng.

## Tài khoản và điểm

Đăng nhập bằng tên hiển thị kèm mã PIN bốn tới sáu chữ số. Mã PIN chỉ để tách hồ sơ khi
nhiều người dùng chung một máy, nó nằm nguyên văn trong localStorage nên đừng đặt trùng
mật khẩu thật.

| Việc | Điểm |
| --- | --- |
| Mỗi câu trả lời đúng | 10 |
| Mỗi 10 phút ngồi ôn | 2 |
| Mỗi đề đạt từ 80% trở lên | 25 |

Đồng hồ ôn bài chỉ chạy khi tab đang mở và có thao tác trong vòng 90 giây gần nhất.

Bảng xếp hạng xếp theo điểm, bằng điểm thì ai đúng nhiều câu hơn đứng trên. Khi mở bằng
đường dẫn artifact, điểm được đồng bộ qua kho dữ liệu dùng chung nên thấy được cả người
khác. Mở từ máy hoặc từ GitHub Pages thì bảng chỉ liệt kê những hồ sơ trên chính máy đó.
Không có xác thực phía máy chủ, ai mở được trang cũng ghi được vào bảng.

## Chạy thử code

Trước khi chạy, trang tự vá đoạn code cho biên dịch được: thêm `#include` và
`using namespace std;` cho C++, đổi `void main` thành `int main`, đổi `strcpy_s` thành
`strcpy`, thêm `using System;` cho C#, đặt tên file Java theo lớp `public class`.

Nút Chạy gửi code tới API Piston tại `emkc.org`. Bản artifact bị sandbox chặn gọi mạng
nên ở đó nút Chạy sẽ chép code vào bộ nhớ tạm và mời bạn mở trình biên dịch online.
Mở từ máy hoặc từ một máy chủ web bình thường thì nút Chạy gọi thẳng được.

Tiến độ, điểm và giờ ôn lưu trong trình duyệt của máy đang dùng.

## Cấu trúc

| Tệp | Vai trò |
| --- | --- |
| `index.html` | Khung trang |
| `assets/style.css` | Giao diện, hỗ trợ cả nền sáng và nền tối |
| `assets/app.js` | Xử lý hiển thị, chấm điểm, tìm kiếm, luyện đề |
| `assets/data.js` | Dữ liệu 360 câu hỏi và phần tóm tắt lý thuyết |

## Chương

| Chương | Tên | Số câu |
| --- | --- | --- |
| I | Tổng quan về lập trình hướng đối tượng | 10 |
| II | Lớp và đối tượng | 80 |
| III | Kế thừa | 80 |
| IV | Đa hình và trừu tượng | 30 |
| V | Lập trình hướng đối tượng trong C# | 80 |
| VI | Lập trình hướng đối tượng trong Java | 80 |

Riêng câu 11 và 12 của chương 3 không được in đáp án trong đề gốc. Trang này điền đáp án theo đúng lý thuyết hàm bạn và lớp bạn trong slide, và có ghi chú rõ ở phần lời giải.

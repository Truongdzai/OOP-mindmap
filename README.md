# Ôn thi Lập trình hướng đối tượng

Trang ôn tập cho môn Lập trình hướng đối tượng, mã môn 229034, Khoa Công nghệ thông tin, Trường Cao đẳng Công Thương TP. Hồ Chí Minh.

## Nội dung

- Toàn bộ 360 câu trắc nghiệm của sáu chương, kèm đáp án chính thức.
- Mỗi câu có một lời giải viết bằng lời lẽ đơn giản, nói rõ vì sao chọn đáp án đó và bẫy thường gặp.
- Mỗi câu có kèm vị trí cần xem lại trong slide bài giảng, lấy từ chính phần tham chiếu trong slide.
- Mỗi chương có một phần tóm tắt lý thuyết bám theo slide, gồm bảng phạm vi truy cập, bảng phân biệt quá tải với ghi đè và bảng quyết định đa hình.

## Mở trên điện thoại

Trang chạy tại **https://truongdzai.github.io/OOP-mindmap/** — mở bằng trình duyệt điện thoại
là ôn được ngay, không cần cài gì. Thêm vào màn hình chính để mở nhanh lần sau.

Hoặc tải repo về rồi mở `index.html`. Trang chạy hoàn toàn ở phía trình duyệt, không cần máy chủ.

- Chọn chương ở cột bên trái, bấm vào đáp án để xem kết quả và lời giải.
- Ô tìm kiếm lọc theo từ khóa trên cả 360 câu, ví dụ constructor, virtual, static, interface.
- Bộ lọc giúp xem riêng những câu chưa làm hoặc đã làm sai.
- Thi thử đề chuẩn 90 câu, đúng số câu của đề thi thật, rút từ ngân hàng theo tỉ lệ số câu mỗi chương: chương I 3 câu, II 20, III 20, IV 7, V 20, VI 20.
- Hoặc bốc đề tự chọn theo phạm vi và số lượng. Số câu tối đa bằng số câu có trong phạm vi, riêng cả sáu chương thì trần là 90.
- Trong lúc làm đề có danh sách số câu để nhảy qua lại, nộp bài xong mới chấm và mới hiện lời giải.
- Trên điện thoại có thanh điều hướng dưới đáy: Chương, Tìm, Luyện đề, Xếp hạng.

## Tài khoản và điểm

Đăng nhập bằng tên hiển thị kèm mã PIN bốn tới sáu chữ số. Tên không phân biệt hoa thường
và không phân biệt dấu, gõ `truong` vẫn vào được tài khoản `Trường`. Mã PIN được băm
SHA-256 kèm tên trước khi lưu, không còn nằm nguyên văn trong máy.

Đây vẫn không phải xác thực thật: mã PIN chỉ để tách hồ sơ khi nhiều người dùng chung một
máy, đừng đặt trùng mật khẩu bạn đang xài ở chỗ khác.

Khi mở bằng đường dẫn artifact, tài khoản và tiến độ được đẩy lên kho dữ liệu dùng chung
nên đăng nhập ở máy khác vẫn thấy đủ điểm và bài đã làm. Kho này dùng chung cho mọi người
mở được trang, nên bài đã làm của bạn không phải là dữ liệu riêng tư. Bản GitHub Pages
không có máy chủ, tài khoản chỉ nằm trên máy đang dùng.

| Việc | Điểm |
| --- | --- |
| Mỗi câu trả lời đúng | 10 |
| Mỗi 10 phút ngồi ôn | 2 |
| Mỗi đề đạt từ 80% trở lên | 25 |

Đồng hồ ôn bài chỉ chạy khi tab đang mở và có thao tác trong vòng 90 giây gần nhất.

Bảng xếp hạng xếp theo điểm, bằng điểm thì ai đúng nhiều câu hơn đứng trên. Bản trên
GitHub Pages không có máy chủ nên bảng chỉ liệt kê những hồ sơ tạo trên chính máy đó.
Muốn xếp hạng chung nhiều người thì phải mở bằng đường dẫn artifact của Claude.

Tiến độ, điểm và giờ ôn lưu trong trình duyệt của máy đang dùng.

## Cấu trúc

| Tệp | Vai trò |
| --- | --- |
| `index.html` | Khung trang |
| `assets/style.css` | Giao diện, hỗ trợ cả nền sáng và nền tối |
| `assets/app.js` | Xử lý hiển thị, chấm điểm, tìm kiếm, luyện đề |
| `assets/data.js` | Dữ liệu 360 câu hỏi và phần tóm tắt lý thuyết |
| `.github/workflows/pages.yml` | Tự đẩy trang lên GitHub Pages mỗi lần push |

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

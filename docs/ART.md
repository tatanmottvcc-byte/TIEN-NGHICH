# Bộ tạo hình chuẩn v1

Nguồn: 8 ảnh tạo trong cuộc trò chuyện TIEN NGHICH, người dùng đã chốt phong cách tiên hiệp 3D chi tiết. Đây là ảnh 2D toàn thân, không phải mô hình 3D hoặc bộ khung hoạt ảnh.

## Quy ước sử dụng

- Danh mục runtime: `public/art.js`. Không chọn file dựa trên dữ liệu tên nhân vật do người chơi nhập.
- Giữ nguyên dữ liệu PNG và kênh alpha của ảnh được duyệt. Không kéo giãn hoặc đổi khuôn mặt.
- Nam/Nữ, NPC và Cổ Thụ: 1024×1536. Lang Vương: 1536×1024. Khung UI dùng `object-fit: contain` để giữ đúng tỷ lệ.
- Mỗi file có hậu tố `-v1`; nếu đổi ảnh phải tạo `-v2` và cập nhật danh mục vì ảnh được cache lâu.
- Chỉ tải chân dung của phần giao diện được mở; không nạp toàn bộ ảnh vào vòng vẽ canvas.
- Nam/Nữ: chọn, tạo, thông tin nhân vật. Elder/healer/farmer/guard: hội thoại. Wolf-boss/ancient-treant: mẫu chuẩn cho bước hoạt ảnh sau.

## Chuẩn cho bước hoạt ảnh tiếp theo

Lấy chính các mẫu đã chốt làm tham chiếu. Chuẩn hóa camera nhìn chéo từ trên xuống trước, rồi giữ nguyên khuôn mặt, tóc, trang phục và vũ khí qua 8 hướng. Các khung đứng/đi/đánh/trúng đòn phải có cùng tỷ lệ và điểm đặt bàn chân. Cần kiểm tra độ ổn định từng chuỗi trước khi thay hoạt ảnh canvas hiện có. Bản 0.9.0 chưa có bộ khung này.

## 0.10.0 — Hoạt ảnh di chuyển bằng ảnh mới

- Nam/Nữ dùng atlas PNG 1536×1024, 8 hướng × 4 khung đi từ tạo hình đã duyệt.
- Cột: Nam, Đông Nam, Đông, Đông Bắc, Bắc, Tây Bắc, Tây, Tây Nam (hướng màn hình).
- Nhịp khung theo quãng đường nội suy; khi dừng giữ tư thế giữa bước. Điểm chân neo vào vị trí bản đồ, không đổi va chạm hoặc tốc độ máy chủ.
- Chỉ nạp atlas giới tính đang chơi, cache theo tên phiên bản; dùng hình cũ tạm thời khi tải hoặc lỗi mạng.
- NPC/quái vẫn dùng hoạt ảnh cũ. Tấn công dùng hiệu ứng cung kiếm; chưa có atlas xuất chiêu, trúng đòn hoặc chết riêng.
- Đã kiểm tra ảnh nguồn và kiểm thử mã; cần kiểm tra trực tiếp cảm giác chuyển động trên máy Windows.

## 0.11.0 — NPC, quái và boss bằng ảnh

- Bốn NPC dùng bộ 16 khung đứng chờ theo tạo hình đã chốt.
- Sáu atlas đi 8 hướng × 4 khung: sói, cáo, lợn rừng, gấu, Mộc Linh và Cổ Thụ; bao phủ tất cả loài quái hiện có. Boss cùng loài chia sẻ atlas, khác kích thước và một số màu/hiệu ứng.
- Căn khung theo alpha, neo bàn chân; chỉnh nhịp nhân vật từ 20 xuống khoảng 10 khung/giây ở vận tốc hiện tại, giữ chuyển động qua khoảng chờ mạng ngắn 110ms. Quái quay theo hướng nội suy, Mộc Linh lơ lửng.
- NPC vẫn đứng tại vị trí nhiệm vụ; không tự đi tuần. Chưa có atlas xuất chiêu/chết riêng. Bộ đi có 4 tư thế, chưa phải hoạt ảnh xương 3D.
- Các PNG gốc giữ nguyên; public/sprite-atlas.js chỉ mô tả khung cắt. Công cụ tools/index-sprites.py đọc alpha (cần Pillow khi tái tạo metadata, không cần để chạy game). Prompt nằm trong docs/world-art-prompts.json, tạo bằng công cụ sinh ảnh tích hợp.
- Đã kiểm tra khung ảnh bằng canvas và kiểm thử tự động; chưa chạy thử trên trình duyệt Windows của người dùng.

## 0.12.0 — Bãi quái sống động và cảnh vật có chiều sâu

- 12 cụm bãi quái mới, tăng 48 lên 96 điểm xuất hiện; giữ 5 boss. Bản lưu cũ thêm quái bằng ID ổn định, giữ tài nguyên, nhiệm vụ, ô nhanh và hồi sinh đang chờ.
- Quái chọn đích lang thang trong khu vực quanh nơi sinh, đi cả đường chéo, nghỉ ngắn giữa các tuyến; vẫn đi khi người chơi trong làng. Truy đuổi ngừng ở vùng an toàn và khi vượt phạm vi. Không xuyên vật cản, cắt góc hoặc bước lên ô quái khác. Hồi sinh chờ nếu điểm sinh đang bị chiếm.
- Nội suy tăng tốc trong 65ms; tốc độ hiển thị quái khớp tốc độ bước máy chủ. Không đổi tốc độ di chuyển hoặc luật chiến đấu của nhân vật.
- 6 ảnh cảnh vật: hai nhà, hai cây, đá, hàng rào; 4 nền đất: cỏ, sân đá, đường đất, rừng. Tạo bằng công cụ sinh ảnh tích hợp; prompt ở docs/environment-prompts.json. PNG gốc trong public/assets/environment.
- Cảnh là 2.5D trên canvas, chưa phải thế giới 3D xoay camera. Có bóng nền, cây lay nhẹ, làm mờ vật che nhân vật và sắp lớp theo chân đối tượng. Bộ khung đi vẫn 4 tư thế, chưa có mô hình xương 3D.
- Đã kiểm tra render cảnh bằng canvas, mô phỏng quái 30 giây và kiểm thử bản lưu cũ. Cần chơi thử trên trình duyệt Windows để đánh giá cảm giác và hiệu năng thực tế.

## 0.13.0 — Chiến đấu và nhiệm vụ nhập môn

- 26 nhiệm vụ: 14 chính tuyến, 12 phụ tuyến (giữ 2 nhiệm vụ cũ). 8 việc nhập môn đầu đủ EXP tới cấp 10, có linh thạch và thuốc dự phòng; vẫn cần đủ EXP và tự đột phá. Thưởng không vượt mốc cảnh giới.
- Mục tiêu: bước đi, nói chuyện Hộ vệ/Dược sư/Lão nông, thu hái, dùng Trọng kích, hạ từng loài quái, cấp nhân vật và boss. Chỉ máy chủ ghi nhận hành động thành công.
- Nhận một nhiệm vụ mỗi lần; chọn việc đang mở trong nhật ký. Nút Bỏ nhiệm vụ xóa tiến độ việc đang làm, không thu hồi vật phẩm đã nhặt; nhận lại bắt đầu từ đầu. Tự nhiệm vụ hiểu mục tiêu mới, dừng ở việc cần tự luyện cấp/đột phá. Khi đánh quái vẫn yêu cầu tự ra khỏi vùng an toàn.
- Nam/Nữ có atlas vung kiếm riêng, 4 tư thế. Chuẩn bị đòn từ yêu cầu của người chơi; khung trúng đích/hiệu ứng lấy từ xác nhận máy chủ. Quái có hiệu ứng lao tới, rung khi trúng đòn và ngã/mờ khi hạ gục.
- Giới hạn: quái/ngã vẫn là biến đổi sprite hiện có, chưa có atlas chiến đấu riêng từng loài; chạy vẫn dùng bộ đi hiện tại. Bộ kiếm còn cần tinh chỉnh độ đồng nhất từng hướng khi chơi thực tế. Đây là bước đầu của phần chuyển động chiến đấu trong lộ trình.
- PNG mới trong public/assets/sprites; prompt ở docs/battle-prompts.json. Tạo bằng công cụ sinh ảnh tích hợp. Công cụ đo khung chỉ đọc PNG, cần Pillow/NumPy/SciPy khi tạo lại metadata; chạy game không cần Python.
- Đã kiểm tra ảnh bằng canvas và kiểm thử tự động; chưa chạy trực tiếp trên Windows của người dùng.

# Tiên Nghịch — bản nội bộ 0.14.2

Game web 2D chơi nội bộ; máy chủ Node.js/TypeScript và PostgreSQL. Dự án riêng, không thay thế Tiên Lộ Nghịch Thiên.

## 0.14.0 — Trang bị và đồ rơi

- 12 món: kiếm, áo, ngọc bội ở các mốc cấp 1/5/10/15. Ba ô mặc đồ; chỉ số công kích, sinh lực và phòng ngự được tính trên máy chủ.
- Lần hạ quái đầu sau cập nhật chắc chắn rơi đồ; quái thường tiếp theo có xác suất 35%, boss rơi một món. Tối đa 30 món dưới đất, mỗi món tồn tại 5 phút; khi đạt giới hạn, không sinh thêm đồ rơi.
- Chạm túi vàng trên bản đồ để đi tới nhặt. Hành trang chứa tối đa 60 trang bị, tính cả đồ đang mặc. Rê chuột để xem và so sánh; nhấp để Mặc/Tháo/Bán. Bán nhận linh thạch theo giá máy chủ, phải tháo đồ trước khi bán.
- Trang bị và trạng thái mặc lưu cùng nhân vật trên PostgreSQL. Không cần migration SQL. Đổi đồ không hồi máu miễn phí; tháo đồ giảm trần sinh lực sẽ giới hạn sinh lực hiện tại.
- Trang bị mới tác động chỉ số; chưa thay ngoại hình nhân vật. Nhặt đồ thủ công, chưa tự nhặt khi luyện công.
- 71 kiểm thử tự động đạt, gồm khoảng cách nhặt, hết hạn, đầy túi, quyền sở hữu, bán/nhặt lặp, yêu cầu cấp, sát thương và lưu/tải trang bị. Chưa chơi thử bản này trên Windows hoặc PostgreSQL thật.

## Lịch sử: Bản 0.9.0 — chân dung chi tiết

Bộ Nam/Nữ đã chọn được dùng trong màn hình chọn nhân vật, xem trước khi tạo nhân vật và bảng thông tin nhân vật. Trưởng thôn, Dược sư, Lão nông, Hộ vệ có ảnh riêng trong hội thoại. 8 ảnh gốc được đóng gói trong `public/assets/art`; 2 mẫu boss được lưu làm chuẩn cho bước sau, chưa thay hình trên bản đồ.

Ảnh giữ nguyên PNG có kênh alpha và tỷ lệ gốc; các khung hiển thị dùng contain để không méo/cắt đầu chân. Tải ảnh theo nhu cầu, giải mã bất đồng bộ, URL có phiên bản và cache riêng cho ảnh. Không sửa database. Nhân vật trên bản đồ vẫn dùng bộ hoạt ảnh canvas 0.8.0; bộ ảnh đa hướng/chuyển động chi tiết chưa có.

## Bản 0.8.0 — nâng cấp tạo hình và HUD

Thay hình người chơi bằng nhân vật tiên hiệp vẽ trực tiếp trong canvas: Nam/Nữ có áo, tóc, kiếm và điểm nhấn khác nhau; dáng nhìn theo hướng di chuyển. Bước chân, nhịp thở, chém kiếm và chớp khi trúng đòn được hoạt họa. NPC có trang phục theo vai trò và hoạt ảnh chờ; linh thú có hình thể riêng cho Hùng Linh, Mộc Linh, Cổ Thụ Yêu Vương và các loài cũ. Chân dung chọn nhân vật, thanh thông tin, ô nhanh và bảng chức năng được làm rõ theo tông ngọc xanh/vàng đồng.

Đây là mỹ thuật vector dựng bằng mã, không tải ảnh từ nguồn ngoài. Luật chiến đấu, bản đồ, tài khoản, database và tiến trình không đổi; không cần migration.

## Bản 0.7.0 — mở rộng bản đồ U Lâm Cốc

Bản đồ mở rộng từ 64×48 lên 80×48 ô, nối khu rừng mới ở phía đông. U Lâm Cốc có Hùng Linh, Mộc Linh, Cổ Thụ Yêu Vương và sáu bụi Thảo dược mới. Boss cấp 16, thưởng riêng và hồi sinh 90 giây. Bản đồ nhỏ và tên khu vực cập nhật theo vị trí.

Khi nhân vật tải lại, nội dung mới được bổ sung vào trạng thái thế giới cũ; tiến trình nhiệm vụ, vị trí, sinh lực, vật phẩm, thời gian hồi quái và cấu hình ô kỹ năng/vật phẩm vẫn được giữ. Không cần migration SQL hay xóa dữ liệu.

## Bản 0.6.0 — cảnh giới và thử thách đại cảnh giới

Ngưng Khí đến cấp 140; sau các thử thách boss tại cấp 140, 180, 220 lần lượt mở Trúc Cơ, Kết Đan, Nguyên Anh. Max level hiện tại 260. Boss tự tăng sinh lực/sát thương theo cấp nhân vật; cần đánh boss sau khi chạm mốc mới được đột phá đại cảnh giới.

## Bản 0.5.0

Bản đồ chiếm toàn bộ khung trình duyệt. HUD và các bảng hành trang, nhiệm vụ, hội thoại được thu gọn. Thanh dưới chia hai nhóm: 4 ô vật phẩm (Phù, Máu, Nội lực, Khác) và 4 ô kỹ năng. Máu dùng Thảo dược hiện có, Khác mở hành trang; Phù/Nội lực chưa có vật phẩm. Kỹ năng đầu là Trọng kích, ba ô còn lại chưa mở. Menu riêng có B/Q/H; nhật ký có thể thu gọn. Không đổi dữ liệu hoặc luật di chuyển.

## Bản 0.3.0 có gì

- Giữ đăng ký/đăng nhập/đăng xuất, ba ô nhân vật Nam/Nữ và tiến trình độc lập.
- Bãi luyện cấp Tân Thủ Thôn 64×48 ô: thôn an toàn ở chính giữa, hàng rào/bốn cổng, nhà dân và NPC, bãi quái bốn phía, cây/đá chặn đường.
- Nhấp đất để tìm đường, WASD/mũi tên để di chuyển, cần điều khiển cảm ứng cho điện thoại.
- Chọn quái để tiến đến đánh liên tục mục tiêu đó. Nút Đánh/Space chọn quái gần trong 8 ô.
- Đánh thường cận chiến, kỹ năng Trọng kích có tầm 3 ô, tốn 12 thể lực, hồi 4 giây.
- 32 quái thường chia bốn bãi; 4 tiểu boss gồm Hồ Vương, Lang Vương, Trư Vương và Hắc Lang Vương. Quái thường hồi 12 giây, boss hồi 90 giây.
- EXP/linh thạch khi hạ quái, 30% quái thường rơi Thảo dược và boss chắc chắn rơi 1. Có thêm 16 bụi cây thu hái trực tiếp, hồi 45 giây; dữ liệu thu hái được lưu. Thảo dược dùng hồi 50 sinh lực, hồi dùng 5 giây; chưa có chế tạo.
- Sinh lực, thể lực, vị trí, quái, thời gian hồi và chiến lợi phẩm được lưu vào PostgreSQL sau mỗi lần đồng bộ/thao tác.
- Về làng để hồi máu; trọng thương chờ 3 giây rồi hồi sinh tại làng, không mất EXP.
- Cấp 1–10 Phàm Nhân; đầy EXP cấp 10 + 20 linh thạch đột phá lên cấp 11 Ngưng Khí tầng 1.
- Bỏ đường cộng EXP trực tiếp `/hunt`. Máy chủ kiểm tra vị trí, tầm đánh, sát thương, hồi chiêu và quái còn sống.

Đây là bản chiến đấu đầu tiên với hình vẽ 2D đơn giản; chưa có chất lượng hình ảnh của VLTK, hoạt ảnh nhiều hướng hoàn chỉnh, âm thanh, PvP, bản đồ chung nhiều người, trang bị hoặc tự tìm mục tiêu mới sau khi quái chết. Bãi quái hiện riêng cho từng nhân vật. Không cày offline.

## Cập nhật từ 0.1.x

Đọc `HUONG-DAN-CAP-NHAT.txt`. Dừng máy chủ bằng Ctrl+C, chép đè mã nguồn vào:

```text
D:\OneDrive\Games\TIEN NGHICH
```

Giữ `.env` và node_modules. Chạy:

```powershell
cd "D:\OneDrive\Games\TIEN NGHICH"
npm.cmd run migrate
npm.cmd start
```

Từ bản 0.2.0 không cần thay đổi schema SQL; trạng thái JSON được tự nâng lên bản đồ mới khi tải lần đầu. Lệnh migrate vẫn hỗ trợ cập nhật từ 0.1.x bằng cách tạo bảng `character_worlds` nếu thiếu. Không xóa tài khoản hoặc dữ liệu nhân vật. Có thể nhấp đúp `CHAY-GAME.cmd` để tạo bảng còn thiếu và khởi động. Trình duyệt mở http://127.0.0.1:3000 rồi Ctrl+F5.

## Cài mới

Yêu cầu Node.js 24+, npm và PostgreSQL 15+ đang chạy. Tạo role/database bằng tài khoản quản trị:

```sql
CREATE ROLE tiennghich WITH LOGIN PASSWORD 'YOUR_PRIVATE_PASSWORD';
CREATE DATABASE tiennghich OWNER tiennghich;
```

Chạy từng lệnh riêng. Sao chép `.env.example` thành `.env`, sửa DATABASE_URL cho đúng mật khẩu/host/cổng/database. Mật khẩu chứa ký tự đặc biệt phải được URL-encode trong URL. Không chia sẻ `.env`.

```powershell
Copy-Item .env.example .env
npm.cmd ci
npm.cmd run migrate
npm.cmd start
```

Không có tài khoản mặc định. Đăng ký tài khoản chơi game qua giao diện; đây là tài khoản khác với role PostgreSQL.

Để dùng qua LAN, đặt HOST=0.0.0.0 và cho phép cổng game trên mạng riêng. Dùng HTTPS khi truyền mật khẩu qua mạng không tin cậy; đặt COOKIE_SECURE=true khi chạy HTTPS. Không mở cổng database ra Internet.

## Điều khiển

| Thao tác | Máy tính | Điện thoại |
| --- | --- | --- |
| Di chuyển | Nhấp đất hoặc WASD/mũi tên | Cần điều khiển/chạm đất |
| Chọn quái | Nhấp quái | Chạm quái |
| Đánh mục tiêu gần | Space hoặc nút Đánh | Nút Đánh |
| Trọng kích | Phím 1 | Nút Trọng kích |
| Dừng | Esc | Nút Dừng |
| Hồi sinh | R khi trọng thương | Nút Hồi sinh |
| Thu hái | Chọn bụi cây hoặc E | Chạm bụi cây/nút Thu hái |
| Trò chuyện | Chọn dân làng | Chạm dân làng |

## Kiểm tra và giới hạn xác minh

```powershell
npm.cmd test
```

43 bài kiểm tra: cấp độ/đột phá, băm mật khẩu, HTTP tài khoản/phân quyền/3 ô, trạng thái bản đồ lưu qua đăng nhập lại, chống thưởng trùng, di chuyển/vật cản, tầm kỹ năng, hồi chiêu, quái đuổi/quay về/hồi sinh, chết/hồi sinh và không farm offline.

Đã kiểm tra thủ công trên trình duyệt desktop: vào bản đồ, di chuyển, chọn mục tiêu/đánh, nhận thưởng, lên cấp, kỹ năng, trọng thương/hồi sinh và tải lại tiến trình. Database kiểm thử dùng pg-mem; chưa kiểm tra trên PostgreSQL thực hoặc xác minh khóa dòng khi nhiều kết nối đồng thời. Chưa thử trên thiết bị cảm ứng thật. Không có fallback lưu dữ liệu người chơi trong trình duyệt.

## Cấu trúc

- server/app.ts: API, xác thực, kiểm tra quyền và transaction.
- server/combat.ts: mô phỏng chiến đấu trên máy chủ.
- server/progression.ts: EXP, cấp độ, cảnh giới và đột phá.
- server/schema.sql: schema PostgreSQL, gồm bảng trạng thái mới.
- public/map.js: bản đồ, vật cản và tìm đường dùng chung.
- public/game.js: hiển thị canvas, điều khiển, nội suy và đồng bộ.
- tests/: unit và HTTP integration.
- docs/DEVELOPMENT.md: quyết định, tiến độ và phần việc tiếp theo.

Tự lưu ngay khi máy chủ xử lý thao tác/đồng bộ, không đợi đăng xuất. Nếu trình duyệt mất kết nối lâu hơn 2 giây thì không chạy tiếp giao chiến offline; quái đang sống trở về bãi và hồi đầy HP, nhân vật không được hồi sinh miễn phí. Đồng hồ máy khách không quyết định hồi chiêu.

## Bố trí Tân Thủ Thôn

Thôn nằm giữa bản đồ, có bốn ngôi nhà, Trưởng thôn, Dược sư, Lão nông và Hộ vệ. Trưởng thôn có hai nhiệm vụ mở đầu qua bảng Q; các NPC còn lại hướng dẫn bằng hội thoại, chưa có cửa hàng hoặc dịch vụ hồi máu chủ động. Tự hồi máu khi ở vùng thôn an toàn. Quái không vào thôn và không gây sát thương cho người trong thôn.

| Phía | Bãi quái | Tiểu boss |
| --- | --- | --- |
| Tây | Dã Hồ | Hồ Vương, cấp 8 |
| Bắc | Sơn Lang | Lang Vương, cấp 10 |
| Đông | Dã Trư | Trư Vương, cấp 12 |
| Nam | Đồng cỏ, quái hỗn hợp | Hắc Lang Vương, cấp 11 |

Bản đồ nhỏ cho biết thôn, bốn bãi, vị trí nhân vật, quái/boss và thảo dược. Có thể nhấp vị trí trên bản đồ nhỏ để đi xa.

Nhân vật đang có được đưa về trung tâm khi đổi từ bản đồ v0.2; giữ cấp, EXP, linh thạch, số quái đã hạ, Thảo dược, HP/thể lực và trạng thái trọng thương. Tọa độ/trạng thái quái cũ thay bằng bố trí mới. Lần tải tiếp theo giữ vị trí và thời gian mọc lại tài nguyên như bình thường.

Kiểm tra bổ sung: đường tới toàn bộ 36 điểm quái/16 thảo dược/bốn cổng; thu hái kiểm tra tầm và thời gian, thưởng boss và nâng dữ liệu bản đồ cũ. Chưa kiểm thử PostgreSQL thật hoặc thiết bị cảm ứng thật.

## Thay đổi 0.3.1 — bước đi và hướng nhân vật

Tìm đường A* tám hướng có trọng số, không cắt góc vật cản. Giữ hai phím để đi chéo, thả một phím vẫn đi theo phím còn giữ. Cần cảm ứng chọn tám hướng. Nhân vật quay mặt và bước chân theo hướng đi, dùng nội suy vận tốc đều và dự đoán một bước hợp lệ để giảm trễ; máy chủ kiểm tra lại vị trí và tốc độ. Bước chéo tốn khoảng 283ms thay vì 200ms để cùng tốc độ theo quãng đường.

Bản này cải thiện di chuyển trên lưới tám hướng, chưa phải di chuyển tự do theo mọi góc. Kỹ năng và hành vi quái giữ luật tầm đánh cũ. Không đổi schema, reset vị trí, tài nguyên hay cooldown của bản 0.3.0. Đã kiểm tra di chuyển và quay hướng trên desktop; chưa kiểm tra cảm giác điều khiển trên thiết bị cảm ứng thật hoặc PostgreSQL thật.

## Thay đổi 0.4.0 — hành trang và nhiệm vụ

B mở túi đồ, Q mở nhiệm vụ, phím 2 dùng Thảo dược: hồi tối đa 50 sinh lực, trừ một cây, hồi 5 giây. Không tiêu vật phẩm nếu đầy máu, thiếu vật phẩm, đang hồi dùng hoặc trọng thương. Game tiếp tục khi mở bảng.

Hai nhiệm vụ mở đầu được nhận/trả khi đứng gần Trưởng thôn. Nút trong bảng Q tự dẫn đường tới NPC; có thể Esc để hủy. Bảo vệ Tân Thủ Thôn yêu cầu 5 Dã Hồ và thu được 3 Thảo dược kể từ lúc nhận, giao đủ 3 cây để nhận 150 EXP/20 linh thạch. Hoàn thành mới mở Dấu chân đầu đàn: hạ một tiểu boss sau khi nhận, thưởng 500 EXP/50 linh thạch. Mỗi nhiệm vụ nhận thưởng một lần, máy chủ tính và lưu cùng transaction với tiến trình/vật phẩm.

Các nhiệm vụ này bổ sung cho gameplay, chưa phải chuỗi sự kiện nguyên tác. Túi hiện có Thảo dược; chưa có trang bị, ô chứa giới hạn hoặc chế tạo. Giữ bộ di chuyển v0.3.1; giảm dựng lại DOM của hồ sơ và nhật ký khi dữ liệu không đổi để hạn chế ảnh hưởng tới chuyển động.

Không đổi schema hay reset bản đồ khi cập nhật từ 0.3.x. Các trường nhiệm vụ/hồi vật phẩm được bổ sung tự động vào JSON khi tải. 40 test gồm luật vật phẩm/nhiệm vụ và HTTP lưu/trả thưởng; chưa xác minh PostgreSQL thật và cảm ứng thật.

## Thay đổi 0.4.1 — tương tác NPC và vật phẩm gọn

Chọn NPC mở cửa sổ nói chuyện ngay và nhân vật tự tới gần. Trưởng thôn hiển thị nhiệm vụ/phần thưởng/tiến độ với nút nhận hoặc trả trực tiếp; các nút bật khi đủ khoảng cách và trạng thái. NPC khác có hội thoại riêng. Bảng Q vẫn giữ để xem tiến độ nhưng không bắt buộc mở khi nhận việc qua NPC.

Hành trang dùng ô vật phẩm 44px, biểu tượng nhỏ và số lượng góc dưới. Hover hoặc focus bằng bàn phím hiện tooltip tên, loại, công dụng, hồi sử dụng, số lượng và lưu ý nhiệm vụ. Chạm/click ghim hoặc đóng tooltip; bảng thông tin được kẹp trong viewport. Nút Dùng và phím 2 giữ luật hồi máu cũ.

Không đổi dữ liệu/luật máy chủ ngoài số phiên bản health; giữ cơ chế kiểm khoảng cách/trạng thái trước khi nhận thưởng. Không thêm dependency hoặc migration. 40 test logic/API giữ nguyên; QA desktop kiểm tra click Trưởng thôn mở hộp thoại, tới gần và nhận việc trực tiếp, ô vật phẩm và tooltip. Cảm ứng thật và PostgreSQL thật chưa xác minh.

## Thay đổi 0.4.2 — thông tin vật phẩm và nhật ký nhiệm vụ

Bấm/chạm ngoài ô vật phẩm và tooltip sẽ đóng bảng thông tin; chuyển focus ra ngoài cũng đóng. Listener được gỡ khi đổi nhân vật để không bị nhân đôi sự kiện.

Q có ba tab Đã nhận / Chưa nhận / Hoàn thành, số lượng từng tab và nhóm Chính tuyến / Phụ tuyến. Toàn bộ danh mục được máy chủ gửi kèm trạng thái; nhiệm vụ chưa mở vẫn có trong Chưa nhận với lý do khóa. Chọn một dòng để xem yêu cầu, phần thưởng và tiến độ. Nhiệm vụ hoàn thành chỉ xem lại, không nhận thưởng lại.

Hai nhiệm vụ hiện có ở Tân Thủ Thôn được phân loại phụ tuyến vì là nội dung bổ sung; mục chính tuyến hiện chưa có nhiệm vụ. Không đổi ID hoặc trạng thái cũ, không cần migration SQL. 43 test đạt; desktop QA kiểm tra đóng tooltip khi bấm ngoài, danh sách chưa nhận và điều kiện khóa, chuyển tab hoàn thành. PostgreSQL thật và cảm ứng thật chưa xác minh.


Bản 0.5.1: Hệ thống gom Dừng thao tác, Hướng dẫn, Đổi nhân vật, Đăng xuất, Âm thanh và Đồ họa. Âm thanh chưa có tài nguyên nên hiển thị trạng thái chưa có; Đồ họa cho bật/tắt chữ nổi và lưu trên trình duyệt. Nhóm chức năng có Nhân vật [C], Hành trang [B], Nhiệm vụ [Q], Bang hội, Gia tộc và nút Hệ thống. Bang hội/Gia tộc chưa mở. Dừng thao tác không tạm dừng máy chủ. Không đổi database/di chuyển. Cập nhật: Ctrl+C, chép đè mã nguồn giữ .env, CHAY-GAME.cmd, Ctrl+F5.


0.5.2: Bốn ô vật phẩm và bốn ô kỹ năng ban đầu trống. Nhấp để chọn gắn; nhấp ô đã gắn để dùng; chuột phải hoặc Shift+nhấp để đổi/tháo. Hiện có Thảo dược, Trọng kích, Thu hái; các vật phẩm/kỹ năng khác chưa phát triển. Thiết lập ô lưu riêng từng nhân vật trên database máy chủ. Nhóm chức năng dùng biểu tượng cùng hàng với kỹ năng; rê chuột xem tên. Trên màn hình hẹp cuộn ngang thanh dưới. Thu hái nằm trong Kỹ năng đời sống (biểu tượng ♧), có thể gắn ô kỹ năng, vẫn dùng phím E. Không thay tiến trình hoặc schema SQL.

Biểu tượng ✎ bật/tắt chế độ sửa ô: bật rồi chạm ô để đổi/tháo, dùng được trên cảm ứng. 44 test logic/API đạt; chưa kiểm giao diện bản này trên thiết bị thật.


0.5.3: Bảng Kỹ năng chia Kỹ năng nhân vật (Trọng kích) / Kỹ năng đời sống (Thu hái). Biểu tượng sửa ô được thay bằng Kỹ thuật, gồm ba mục Luyện đan, Luyện pháp bảo, Luyện khôi lỗi; hiện là khung giao diện chưa có công thức hoặc chế luyện. Bỏ chế độ bật/tắt sửa ô. Đổi/tháo qua chuột phải hoặc Shift+nhấp, hoặc bảng Kỹ năng -> Gắn/đổi ô -> chọn ô (hỗ trợ cảm ứng). Cấu hình ô đã lưu và dữ liệu game giữ nguyên; không đổi SQL.


0.5.4: Theo dõi nhiệm vụ chuyển sang mé trái dưới thông tin nhân vật/thông báo. Các bảng chức năng mở sát mé phải, bên dưới khu vực minimap; giới hạn chiều cao và cuộn nội dung. Menu dưới theo thứ tự Nhân vật, Hành trang, Kỹ năng, Kỹ thuật, Nhiệm vụ, Bang hội/Gia tộc, Thú cưỡi, Hệ thống. Bang hội và Gia tộc dùng chung bảng hai mục; Thú cưỡi có mục riêng nhưng chưa mở gameplay. Không đổi database, cấu hình ô nhanh hoặc chuyển động.


Bản 0.5.5 — Tự đánh: bật nút cạnh Đánh để tự chọn quái còn sống gần nhất trong 8 ô và tiếp tục đánh sau khi hạ mục tiêu. Không tự chọn/đánh khi nhân vật đứng trong vùng an toàn; hãy tự đi ra bãi quái trước. Tắt bằng cùng nút hoặc Dừng. Quái rơi Thảo dược được cộng vào túi tự động như trước. Thêm hàm chọn mục tiêu gần và kiểm tra vùng/phạm vi.


Bản 0.5.6 — Các chế độ tự động cạnh nút Đánh hoạt động độc lập, chỉ bật một chế độ mỗi lần:
- Tự đánh: tìm quái còn sống gần nhất trong 8 ô, đánh và chuyển mục tiêu sau khi hạ.
- Luyện công: như Tự đánh; tự dùng 1 Thảo dược khi sinh lực dưới 55% và đã hết hồi dùng. Nhân vật cần có Thảo dược.
- Tự nhiệm vụ: tự nhận nhiệm vụ đang mở ở Trưởng thôn, ưu tiên mục tiêu Dã Hồ/tiểu boss, thu hái khi cần và quay về trả nhiệm vụ. Trong vùng an toàn chỉ nhận/trả việc; phải tự đi ra bãi quái để chiến đấu. Không tự di chuyển ra khỏi vùng an toàn. Tắt chế độ hoặc nhấn Dừng để ngắt. Tiến độ và phần thưởng vẫn kiểm tra/lưu phía máy chủ như cũ.


Bản 0.5.7 — Khi bật Luyện công, nhân vật tự dùng Trọng kích nếu kỹ năng đã được gắn vào một trong bốn ô, còn đủ ít nhất 12 thể lực, đã hết hồi chiêu và mục tiêu trong tầm/không bị vật cản. Nếu điều kiện không đạt, tiếp tục đánh thường hoặc áp sát. Tự đánh và Tự nhiệm vụ giữ hành vi trước đó.


Bản 0.6.0 — Mở giai đoạn tu luyện đại cảnh giới. Giữ Phàm Nhân cấp 1–10 và Ngưng Khí 13 tầng đến cấp 140; mở Trúc Cơ cấp 141–180, Kết Đan 181–220, Nguyên Anh 221–260. Mỗi 10 cấp vẫn là một tiểu cảnh giới và cần đầy EXP/linh thạch để đột phá. Tại mốc 140/180/220, cần hạ một tiểu boss sau khi đạt cấp mốc rồi mới đột phá đại cảnh giới. World state lưu dấu boss thử thách theo nhân vật; client không thể tự gửi cờ hoàn thành. Mở rộng max level lên 260, không đổi schema SQL.

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

## 0.14.1 — Bảng nhân vật và hành trang song song

Mở Nhân vật (C) đồng thời mở Hành trang bên cạnh. Bảng nhân vật chia hai cột: ảnh bên trái, thuộc tính bên phải. 11 ô bao quanh ảnh gồm Nón, Áo, Bao tay, Hộ phù, Nhẫn trái, Nhẫn phải, Giày, Đai, Vũ khí, Mặt nạ, Thú cưỡi. Ô Hộ phù dùng trang bị ngọc bội hiện có; các ô mới chưa có vật phẩm để mặc. Bảng vẫn cho xem/tháo trang bị hiện có. Màn hình hẹp cuộn ngang cụm bảng, màn hình thấp cuộn dọc. Đóng riêng từng bảng bằng dấu × hoặc đóng cả hai bằng Esc.

Chỉ đổi giao diện, không đổi dữ liệu máy chủ. Đã kiểm tra cú pháp JavaScript và cấu trúc HTML; chưa kiểm tra trực quan trên trình duyệt Windows.

## 0.14.2 — Bố cục trang bị và bốn hành trang

- Trên ảnh: tên nhân vật/cấp, dưới là danh hiệu/liên minh (chưa có hiển thị trạng thái trống).
- Trái từ trên xuống: Nón, Áo, Bao tay, Nhẫn trên, Nhẫn dưới, Đai, Ngọc bội.
- Phải: Mặt nạ, Dây chuyền, Vũ khí cao 2 ô, Áo choàng, Giày, Thú cưỡi. Dưới ảnh có 4 ô khóa. Loại trang bị in mờ trong ô, bỏ nhãn ngoài ô. Chưa thêm vật phẩm cho các loại trang bị mới.
- Hành trang lưới 8 cột, ô 22×22px (1/4 diện tích ô 44×44px trước đây). Mở sẵn 40 ô; ô kế tiếp có dấu +. Mỗi Phù Nạp Vật mở 8 ô chính, tối đa 160. Ba tab phụ ẩn cho tới khi kích hoạt; mỗi túi phụ mở đủ 160 ô.
- Vật liệu tiêu hao phía máy chủ: Túi Càn Khôn mở túi 2; Túi Tu Di mở túi 3; Túi Hư Không mở túi 4. Tạm phân bổ Phù Nạp Vật từ mọi tiểu boss, ba vật liệu kích hoạt lần lượt từ Lang Vương/Hắc Lang Vương/Cổ Thụ Yêu Vương. Vật liệu cộng vào túi chính nếu còn chỗ cho chồng mới; nếu đầy sẽ thông báo không nhận được. Bấm Kích hoạt túi để xem vật liệu còn thiếu, hoặc sử dụng vật liệu trong túi.
- Một trang bị chiếm một ô (kể cả đang mặc); thảo dược và mỗi loại vật liệu tiêu hao xếp chồng trong một ô túi chính. Chuyển trang bị sang túi đã mở từ bảng thông tin món đồ. Khi nhặt, máy chủ chọn túi còn chỗ theo thứ tự chính → phụ. Các loại tiêu hao hiện ở túi chính.
- Bạc nhận từ bán trang bị theo giá cũ. Vàng có số dư riêng, chưa có nguồn kiếm. Không tự quy đổi linh thạch sang vàng/bạc; linh thạch cũ và thưởng nhiệm vụ/quái vẫn dùng cho tu luyện.
- Dữ liệu túi, vật liệu, tiền lưu cùng world JSON của nhân vật; không cần SQL mới. Khi chuyển bản lưu cũ quá 40 ô, mở đủ chỗ theo bội số 8 để giữ toàn bộ đồ cũ. Túi của nhân vật mới vẫn 40 ô.
- 77 kiểm thử tự động đạt. Kiểm tra cú pháp JS/cấu trúc HTML; chưa kiểm tra trực quan bản này trên trình duyệt Windows hoặc PostgreSQL thật.

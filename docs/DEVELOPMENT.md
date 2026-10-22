# Nhật ký và phạm vi phát triển

## Quyết định đã chốt với người dùng

- Game Tiên Nghịch chơi nội bộ, theo trục nguyên tác từ đầu đến cuối.
- Web 2D trước, hỗ trợ màn hình điện thoại; cấu trúc để phát triển Android sau.
- Đăng nhập bắt buộc; dữ liệu lưu database máy chủ.
- Mỗi tài khoản có tối đa 3 nhân vật cùng tồn tại; xóa rồi tạo lại được.
- Nhân vật chọn Nam/Nữ; dữ liệu riêng; chuẩn bị cho tính năng đạo lữ.
- Cày EXP lên cấp; mỗi 10 cấp đột phá một tiểu cảnh giới.
- Chỉ trình bày demo khi người dùng nói “cho xem demo”.

## Giai đoạn nền tảng — đã làm trong 0.1.0

API và schema tài khoản, phiên đăng nhập, nhân vật; giao diện thao tác; luật cấp độ; luyện chiến kiểm thử; bộ test. PostgreSQL là database chạy thật, pg-mem chỉ dùng trong kiểm thử. Không tự động đổi sang lưu trên trình duyệt khi database hỏng.

Luyện chiến là endpoint kiểm thử có hồi 2 giây, không phải combat đã hoàn thành. Mỗi lượt nhận 45 EXP và 3 linh thạch; phần thưởng được tính trên máy chủ. Máy chủ khóa dòng và kiểm tra hồi chiêu. Khi chạm mốc EXP bị giới hạn tại mức đủ đột phá, không tích trữ vô hạn.

## Thông số tạm để phát triển, chưa phải quyết định nội dung cuối

- Bảng hiện tại: cấp 1–10 Phàm Nhân, 11–20 Ngưng Khí tầng 1, 21–30 tầng 2...; giới hạn 140. Đây là quy đổi gameplay, không khẳng định cách chia trong nguyên tác. Cần mở rộng bảng cảnh giới trước khi phát triển đại cảnh giới.
- Đột phá tốn số linh thạch bằng cấp hiện tại × 2, thành công khi đủ điều kiện.
- Chưa có đan dược đột phá hoặc thử thách đại cảnh giới.
- Tên nhân vật không duy nhất toàn máy chủ; định danh bằng UUID.
- Ngày 21/10/2026: 7 test đạt trên Node 24 và pg-mem. Chưa kiểm thử PostgreSQL thật hoặc UI browser.

## Tiếp theo theo thứ tự

1. Kiểm thử migration, lưu bền sau restart, khóa dòng và tạo nhân vật đồng thời trên PostgreSQL thật.
2. Triển khai cảnh 2D: làng khởi đầu, di chuyển, va chạm, điều khiển cảm ứng và vị trí do máy chủ kiểm tra.
3. Combat thật: quái, HP, sát thương, hồi chiêu; bỏ đường nhận thưởng trực tiếp sau khi có mô phỏng chiến đấu.
4. Hành trang, vật phẩm và trang bị; cập nhật trong transaction.
5. Nhiệm vụ chương đầu; nhật ký cốt truyện. Phân biệt nội dung bổ sung và nguyên tác.
6. Bảng cảnh giới đầy đủ, boss đột phá đại cảnh giới.
7. Quan hệ nhân vật và đạo lữ sau khi có yêu cầu cụ thể.

## Nợ kỹ thuật cần xử lý trước khi mở rộng nhiều máy chủ

- Giới hạn đăng nhập đang nằm trong bộ nhớ của một tiến trình; cần kho dùng chung khi chạy nhiều instance.
- Chưa có quên mật khẩu, đổi mật khẩu, khóa tài khoản, xóa phiên hết hạn theo lịch hoặc quản trị.
- Chưa có kiểm soát một nhân vật chỉ vào một phiên chơi, do chưa có gameplay realtime.
- Schema hiện là tạo mới idempotent; cần hệ thống migration có version trước khi thay đổi schema trên dữ liệu thật.
- Đạo lữ chưa có bảng quan hệ: sẽ thiết kế khi chốt tương tác, tránh giới hạn giới tính/quan hệ chưa được người dùng yêu cầu.
- Cần kiểm thử tải và backup/restore database trước khi vận hành lâu dài.

## API

POST /api/register, /api/login, /api/logout
GET /api/me, /api/characters, /api/characters/:id
POST /api/characters {slot,name,gender}
DELETE /api/characters/:id {confirmName}
POST /api/characters/:id/hunt
POST /api/characters/:id/breakthrough
GET /api/health

Không có API cộng EXP hay sửa chỉ số tùy ý từ client.

## Bản 0.1.1

Áp dụng yêu cầu Phàm Nhân cho cấp 1–10. Cấp 11 mới nhập Ngưng Khí tầng 1. Mức trần tạm thời tăng thành 140 để giữ đủ 13 tầng Ngưng Khí trong bảng gameplay. Không sửa cấp, EXP, linh thạch hoặc tài khoản đã có; cảnh giới được tính theo cấp khi tải nhân vật. Không có thay đổi schema và không cần chạy lại migrate.

## Bản 0.2.0 — chiến đấu 2D đầu tiên

Thay vòng Luyện chiến bằng bản đồ Sơn Cước. Node mô phỏng từng bước 200ms dựa trên đồng hồ máy chủ, không dựa thời gian client. Client gọi REST nối tiếp: 210ms khi di chuyển/đánh, 650ms khi nghỉ. Có nội suy vị trí trên canvas, tìm đường BFS, va chạm, làng hồi máu, ba loại quái/sáu điểm sinh, đuổi/đánh/quay về, tầm kỹ năng kiểm tra đường đi, hồi sinh và tự nhặt Thảo dược.

State nhân vật và quái lưu tại `character_worlds.state` JSONB. Khóa dòng `characters` trước đọc/sửa state để cùng nhân vật không ghi đè đồng thời. Thưởng và state quái chết commit cùng giao dịch. Thời gian hồi di chuyển, đòn đánh, kỹ năng nằm trong state máy chủ. `/hunt` trả 410, không còn là cách cộng EXP.

Migration chỉ CREATE TABLE IF NOT EXISTS, chạy trong transaction; dữ liệu cũ giữ nguyên, state bản đồ khởi tạo khi vào lần đầu. Chưa có migration thay đổi cột đã tồn tại; cần hệ thống version khi schema phức tạp hơn.

Kiểm tra: 20 test unit/HTTP trên Node 24 và pg-mem. Giao diện desktop đã kiểm tra trực tiếp; chưa xác minh trên PostgreSQL thực, tải đồng thời hoặc điện thoại cảm ứng. Chưa thể khẳng định semantics khóa dòng/rollback chỉ qua pg-mem. Các lần preview dùng dữ liệu QA riêng trong bộ nhớ; không dùng database người chơi.

Hạn chế: hình vẽ canvas đơn giản; bãi riêng từng nhân vật; REST chưa WebSocket; chưa có bản đồ nhiều người, trang bị, dùng thảo dược, tự tìm mục tiêu kế tiếp, hoạt ảnh đủ hướng hoặc âm thanh. Mục tiêu chết thì dừng tự đánh; quái hồi sinh vẫn có thể tấn công người chơi đứng lại gần.

Phần tiếp theo: xác minh migration/khóa dòng PostgreSQL thật; tinh chỉnh nhịp chiến đấu theo phản hồi; hoàn thiện hình ảnh/hoạt ảnh; phát triển hành trang và nhiệm vụ chương đầu.


## Bản 0.3.0 — Tân Thủ Thôn

64×48 ô, thôn an toàn giữa bản đồ (x25–38, y18–29), spawn32,25. Nhà dân ở bốn góc thôn; hàng rào có bốn cổng. 4 NPC trò chuyện theo khoảng cách. Quái: 8 phía tây, 8 phía bắc, 8 phía đông, 8 phía nam và 4 boss ở xa hơn. 16 điểm thảo dược ở ngoài thôn.

Bản đồ dùng chung vẫn public/map.js; BFS đổi sang parent map để tránh sao chép toàn bộ đường đi tại mỗi node. Renderer chỉ vẽ ô/đối tượng trong camera, có minimap và tương tác di chuyển xa. Entity vẽ theo trục y.

`World.version=2` khác số phiên bản ứng dụng. upgradeWorld chuyển state version1 về trung tâm, giữ HP, thể lực, thảo dược và trạng thái trọng thương; không sửa c.level/xp/stones/kills. State version2 giữ vị trí/cooldown hiện tại. Không có thay đổi schema so với v0.2.

Action gather kiểm tra còn sống, khoảng cách ≤1, cooldown mỗi bụi 45 giây và giữa hai lần hái 1.2 giây. Ràng buộc trong cùng transaction/khóa dòng như combat; HTTP client không quyết định số lượng. Boss hồi 90 giây, thưởng EXP/linh thạch cao hơn, chắc chắn 1 thảo dược. NPC chỉ có hội thoại, chưa có tính năng cửa hàng/nhiệm vụ.

26 test: giữ suite cũ với tọa độ mới, thêm đi tới tất cả spawn/tài nguyên/cổng, boss, gather, upgradeWorld và NPC; HTTP xác minh state thảo dược lưu và không thu trùng. QA desktop kiểm tra trung tâm thôn, nhà/NPC, minimap, hội thoại và thu hái. PostgreSQL thật và thiết bị cảm ứng chưa xác minh.


## Bản 0.3.1 — di chuyển 8 hướng

Pathfinding chuyển từ BFS bốn hướng sang A* có trọng số 10/14, heap nhị phân và heuristic octile. canStep kiểm tra đường chéo không cắt góc. Server move chấp nhận dx/dy ∈ {-1,0,1}, khác (0,0), kiểm tra hai ô cạnh góc và mob ở đó; cooldown 200ms thẳng, ceil(200√2)=283ms chéo. Hướng nhìn được lưu trong World.facing (optional, tương thích state cũ), không tăng version bản đồ.

Client kết hợp phím đang giữ, joystick tám hướng, nội suy vận tốc đều qua public/motion.js, animation bước chân theo quãng đường, dự đoán một ô đã kiểm tra vật cản trước phản hồi và sửa theo kết quả server. Có khóa request loop để wake từ input không tạo nhiều vòng đồng bộ. Giữ thuật toán tìm đường bốn hướng cho AI quái và kiểm tra tầm kỹ năng để tránh thay đổi cân bằng trong bản sửa bước đi.

32 test đạt, thêm test đường chéo, góc chặn, tốc độ đều, cooldown chuẩn quãng đường và kết hợp phím. UI desktop kiểm tra click đi và hướng nhìn; chưa kiểm tra cảm ứng thật, PostgreSQL thật hoặc mạng trễ cao. Dự đoán chỉ giảm trễ cảm nhận, không loại bỏ hoàn toàn giật khi mất kết nối/điều chỉnh từ server.


## Yêu cầu xuyên suốt: độ mượt di chuyển

Người dùng chấp nhận bộ di chuyển v0.3.1 tạm thời và yêu cầu tiếp tục ưu tiên độ mượt trong quá trình phát triển. Giữ motion.js, pathfinding, tốc độ và vòng đồng bộ hiện tại khi thêm tính năng. Tránh dựng lại DOM mỗi lượt polling nếu dữ liệu không đổi; không khẳng định hoàn hảo trên mạng trễ/điện thoại khi chưa thử.

## Bản 0.4.0 — hành trang, sử dụng vật phẩm, hai nhiệm vụ

server/adventure.ts chứa luật nhiệm vụ và vật phẩm. Dùng nguồn w.drops.herb hiện có thay vì nhân đôi số lượng. Trường w.nextUseHerb và w.quests được ensureAdventure khởi tạo khi thiếu, không tăng version bản đồ hoặc reset tọa độ/tài nguyên/cooldown khác. World.inventory và World.quest là view tính ra từ state.

Nhiệm vụ: village_help -> leader_hunt. Mỗi nhiệm vụ có trạng thái active, completed và bộ đếm riêng khởi tạo khi nhận. Hạ Dã Hồ thật/nhặt hoặc thu hái thảo dược thật/hạ boss thật gọi track. Claim kiểm tra còn sống, đứng sát Trưởng thôn, đủ bộ đếm và nguyên liệu trong túi; trừ nguyên liệu và cộng thưởng một lần. Không nhận quest ID, số lượng hồi hoặc thưởng do client gửi. Vẫn qua transaction khóa dòng character và lưu state chung trong app.ts.

Bảng B/Q có nút dùng đồ, nhận/trả việc và thông tin tiến độ. Phím 2 dùng Thảo dược. Auto đi tới Trưởng thôn tái sử dụng đường tương tác hiện có. Bảng không dừng game; mở bảng dừng lệnh di chuyển/đánh của người chơi, quái vẫn hoạt động. Esc hủy hướng đi và đóng bảng.

40 test đạt: thêm 8 test luật mới và mở rộng HTTP test cho dùng/nhận/trả thưởng, chống client giả tiến độ, lưu qua request. QA desktop đã xem túi, số lượng/nút dùng khóa khi thiếu/đầy máu, mở Q và nhận nhiệm vụ qua NPC; hồi máu/trả thưởng kiểm bằng unit/HTTP. Chưa kiểm PostgreSQL thật hay cảm ứng thật.

Tiếp theo: trang bị/chỉ số cộng thêm và công pháp/kỹ năng; mở nhiệm vụ nguyên tác sau khi đối chiếu sự kiện chương đầu. Tránh mở nhiều tính năng cùng lúc làm mất khả năng kiểm tra vòng chơi hiện tại.


## Bản 0.4.1 — NPC và tooltip vật phẩm

NPC click mở npcPanel và xếp tương tác talk; người chơi đến gần rồi server kiểm khoảng cách. selectedNpc/lastNpc là state UI, không thay state nhiệm vụ máy chủ. Elder hiển thị nhận/trả khi quest.ready/available, khóa khi xa/không đủ yêu cầu; lệnh vẫn đi qua action API và adventureAction. Đóng hộp hủy tương tác NPC đang xếp. NPC khác không có nút nhiệm vụ.

Ô vật phẩm 44px, tooltip tách khỏi aside để tránh bị overflow cắt, position fixed kẹp viewport. Pointer enter/leave, focus/blur, click ghim cho cảm ứng; cleanup gỡ listeners khi đổi nhân vật. Không viết innerHTML với dữ liệu người chơi, không thêm dependency. Giữ map.js và motion.js byte-identical với 0.4.0.

40 bài kiểm tra API/logic đạt; kiểm tra UI desktop cho NPC direct receive và compact inventory/tooltip. Không tạo test soi CSS cho thay đổi này. Chưa xác minh touch hardware/PostgreSQL thật.


## Bản 0.4.2 — trạng thái và phân loại nhiệm vụ

questView thêm journal tính từ danh mục QUESTS + w.quests, không tạo nguồn tiến độ thứ hai. Trạng thái unaccepted/accepted/completed độc lập với available dùng cho NPC; khóa do thứ tự phụ thuộc và nhiệm vụ đang nhận. category='side' cho hai việc hiện tại, giữ nhóm main sẵn trong UI nhưng chưa tạo nội dung giả nguyên tác.

Journal UI dùng tab trạng thái + nhóm chính/phụ + chi tiết chọn dòng. Trạng thái đã hoàn thành xác định khi đã trả và nhận thưởng; đủ điều kiện chưa trả vẫn ở Đã nhận, có nhãn Có thể trả. Giữ cơ chế nhận/trả của máy chủ, không thay hạn một nhiệm vụ active hiện tại. Cập nhật UI chỉ khi q hoặc số thảo dược thay đổi.

Sửa tooltip bằng document pointerdown capture kiểm target ngoài slot/tooltip và blur rời focus; cleanup remove đúng handler/capture. Không thay motion/map/combat. 43 test đạt gồm 3 test mới của journal; browser QA xác nhận tooltip biến mất sau click tiêu đề hành trang, nhóm và tab nhiệm vụ, khóa việc sau. Chưa kiểm thực tế PostgreSQL hoặc thiết bị cảm ứng.


## Bản 0.5.0 — bản đồ toàn trang và thanh ô nhanh

Canvas phủ viewport trình duyệt, HUD/panel thu gọn. Thanh dưới có hai nhóm đúng 4 ô vật phẩm và 4 ô kỹ năng. quickHeal tái sử dụng useHerb, quickBag mở túi; Trọng kích giữ logic cũ, các ô chưa có nội dung bị khóa. Menu chức năng, nút đánh, nhật ký và hướng dẫn tách khỏi thanh ô nhanh. Joystick nằm ngoài thanh để fixed không bị ảnh hưởng bởi transform của thanh. Không đổi schema, motion.js, map.js hay luật chiến đấu/nhiệm vụ.

43 test logic/API đạt; QA trình duyệt desktop và iframe viewport 390×780 xác nhận đủ tám ô, không tràn ngang. Chưa thử PostgreSQL thật hoặc thiết bị cảm ứng thật. Harness pg-mem chỉ dùng QA nội bộ, không nằm trong gói phát hành.


Bản 0.5.1: Hệ thống gom Dừng thao tác, Hướng dẫn, Đổi nhân vật, Đăng xuất, Âm thanh và Đồ họa. Âm thanh chưa có tài nguyên nên hiển thị trạng thái chưa có; Đồ họa cho bật/tắt chữ nổi và lưu trên trình duyệt. Nhóm chức năng có Nhân vật [C], Hành trang [B], Nhiệm vụ [Q], Bang hội, Gia tộc và nút Hệ thống. Bang hội/Gia tộc chưa mở. Dừng thao tác không tạm dừng máy chủ. Không đổi database/di chuyển. Cập nhật: Ctrl+C, chép đè mã nguồn giữ .env, CHAY-GAME.cmd, Ctrl+F5.


0.5.2: Bốn ô vật phẩm và bốn ô kỹ năng ban đầu trống. Nhấp để chọn gắn; nhấp ô đã gắn để dùng; chuột phải hoặc Shift+nhấp để đổi/tháo. Hiện có Thảo dược, Trọng kích, Thu hái; các vật phẩm/kỹ năng khác chưa phát triển. Thiết lập ô lưu riêng từng nhân vật trên database máy chủ. Nhóm chức năng dùng biểu tượng cùng hàng với kỹ năng; rê chuột xem tên. Trên màn hình hẹp cuộn ngang thanh dưới. Thu hái nằm trong Kỹ năng đời sống (biểu tượng ♧), có thể gắn ô kỹ năng, vẫn dùng phím E. Không thay tiến trình hoặc schema SQL.


0.5.3: Bảng Kỹ năng chia Kỹ năng nhân vật (Trọng kích) / Kỹ năng đời sống (Thu hái). Biểu tượng sửa ô được thay bằng Kỹ thuật, gồm ba mục Luyện đan, Luyện pháp bảo, Luyện khôi lỗi; hiện là khung giao diện chưa có công thức hoặc chế luyện. Bỏ chế độ bật/tắt sửa ô. Đổi/tháo qua chuột phải hoặc Shift+nhấp, hoặc bảng Kỹ năng -> Gắn/đổi ô -> chọn ô (hỗ trợ cảm ứng). Cấu hình ô đã lưu và dữ liệu game giữ nguyên; không đổi SQL.


0.5.4: Theo dõi nhiệm vụ chuyển sang mé trái dưới thông tin nhân vật/thông báo. Các bảng chức năng mở sát mé phải, bên dưới khu vực minimap; giới hạn chiều cao và cuộn nội dung. Menu dưới theo thứ tự Nhân vật, Hành trang, Kỹ năng, Kỹ thuật, Nhiệm vụ, Bang hội/Gia tộc, Thú cưỡi, Hệ thống. Bang hội và Gia tộc dùng chung bảng hai mục; Thú cưỡi có mục riêng nhưng chưa mở gameplay. Không đổi database, cấu hình ô nhanh hoặc chuyển động.


Bản 0.5.5 — Tự đánh: bật nút cạnh Đánh để tự chọn quái còn sống gần nhất trong 8 ô và tiếp tục đánh sau khi hạ mục tiêu. Không tự chọn/đánh khi nhân vật đứng trong vùng an toàn; hãy tự đi ra bãi quái trước. Tắt bằng cùng nút hoặc Dừng. Quái rơi Thảo dược được cộng vào túi tự động như trước. Thêm hàm chọn mục tiêu gần và kiểm tra vùng/phạm vi.


Bản 0.5.6 — Các chế độ tự động cạnh nút Đánh hoạt động độc lập, chỉ bật một chế độ mỗi lần:
- Tự đánh: tìm quái còn sống gần nhất trong 8 ô, đánh và chuyển mục tiêu sau khi hạ.
- Luyện công: như Tự đánh; tự dùng 1 Thảo dược khi sinh lực dưới 55% và đã hết hồi dùng. Nhân vật cần có Thảo dược.
- Tự nhiệm vụ: tự nhận nhiệm vụ đang mở ở Trưởng thôn, ưu tiên mục tiêu Dã Hồ/tiểu boss, thu hái khi cần và quay về trả nhiệm vụ. Trong vùng an toàn chỉ nhận/trả việc; phải tự đi ra bãi quái để chiến đấu. Không tự di chuyển ra khỏi vùng an toàn. Tắt chế độ hoặc nhấn Dừng để ngắt. Tiến độ và phần thưởng vẫn kiểm tra/lưu phía máy chủ như cũ.


Bản 0.5.7 — Khi bật Luyện công, nhân vật tự dùng Trọng kích nếu kỹ năng đã được gắn vào một trong bốn ô, còn đủ ít nhất 12 thể lực, đã hết hồi chiêu và mục tiêu trong tầm/không bị vật cản. Nếu điều kiện không đạt, tiếp tục đánh thường hoặc áp sát. Tự đánh và Tự nhiệm vụ giữ hành vi trước đó.


Bản 0.6.0 — Mở giai đoạn tu luyện đại cảnh giới. Giữ Phàm Nhân cấp 1–10 và Ngưng Khí 13 tầng đến cấp 140; mở Trúc Cơ cấp 141–180, Kết Đan 181–220, Nguyên Anh 221–260. Mỗi 10 cấp vẫn là một tiểu cảnh giới và cần đầy EXP/linh thạch để đột phá. Tại mốc 140/180/220, cần hạ một tiểu boss sau khi đạt cấp mốc rồi mới đột phá đại cảnh giới. World state lưu dấu boss thử thách theo nhân vật; client không thể tự gửi cờ hoàn thành. Mở rộng max level lên 260, không đổi schema SQL.


Bản 0.7.0 — Bản đồ Tân Thủ Thôn nối rộng về phía đông, thêm U Lâm Cốc (80×48 tổng thể), 11 quái thường và Cổ Thụ Yêu Vương cấp 16, cùng 6 bụi Thảo dược. Nội dung được thêm bù vào world state hiện có, không reset quái/quest/tọa độ/túi/ô nhanh; không đổi schema. Cập nhật bằng cách dừng máy chủ, chép đè mã nguồn nhưng giữ .env, rồi chạy lại.


Bản 0.8.0 — Thay hình người chơi bằng tạo hình tiên hiệp vẽ trong canvas; Nam/Nữ khác màu và phụ kiện, nhìn theo hướng di chuyển, có nhịp thở/bước/chém/trúng đòn. NPC có trang phục theo vai trò và nhịp chờ; linh thú có tạo hình riêng gồm Hùng Linh, Mộc Linh, Cổ Thụ Yêu Vương. Thêm chân dung chọn nhân vật và làm mới HUD/bảng theo tông ngọc xanh, vàng đồng. Không dùng ảnh ngoài, không đổi luật chơi hay dữ liệu.


0.9.0: Chuẩn hóa 8 ảnh đã chốt vào public/assets/art; manifest kiểm tra kích thước/hash trong docs/art-manifest.json. Nam/Nữ dùng ở chọn, tạo và bảng nhân vật; 4 NPC dùng trong hội thoại. 2 boss giữ làm chuẩn, chưa gắn vào map. Cache ảnh theo tên phiên bản, async decode, lazy loading tại chọn/tạo nhân vật, lỗi tải có nhãn thay thế. Bộ khung chuyển động chi tiết chưa được tạo. Kiểm tra: 55 test logic/API qua, bao gồm 8 endpoint ảnh/PNG/kích thước/cache và chặn đường dẫn ngoài danh mục. Chưa kiểm thử hiển thị trên Windows.

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

## 0.14.0 — Trang bị và đồ rơi

- 12 món: kiếm, áo, ngọc bội ở các mốc cấp 1/5/10/15. Ba ô mặc đồ; chỉ số công kích, sinh lực và phòng ngự được tính trên máy chủ.
- Lần hạ quái đầu sau cập nhật chắc chắn rơi đồ; quái thường tiếp theo có xác suất 35%, boss rơi một món. Tối đa 30 món dưới đất, mỗi món tồn tại 5 phút; khi đạt giới hạn, không sinh thêm đồ rơi.
- Chạm túi vàng trên bản đồ để đi tới nhặt. Hành trang chứa tối đa 60 trang bị, tính cả đồ đang mặc. Rê chuột để xem và so sánh; nhấp để Mặc/Tháo/Bán. Bán nhận linh thạch theo giá máy chủ, phải tháo đồ trước khi bán.
- Trang bị và trạng thái mặc lưu cùng nhân vật trên PostgreSQL. Không cần migration SQL. Đổi đồ không hồi máu miễn phí; tháo đồ giảm trần sinh lực sẽ giới hạn sinh lực hiện tại.
- Trang bị mới tác động chỉ số; chưa thay ngoại hình nhân vật. Nhặt đồ thủ công, chưa tự nhặt khi luyện công.
- 71 kiểm thử tự động đạt, gồm khoảng cách nhặt, hết hạn, đầy túi, quyền sở hữu, bán/nhặt lặp, yêu cầu cấp, sát thương và lưu/tải trang bị. Chưa chơi thử bản này trên Windows hoặc PostgreSQL thật.

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

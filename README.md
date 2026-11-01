# cityhousePMS — README (bản layout đầy đủ, v3)

Hệ thống quản lí nhiều khách sạn (PMS) đạt chuẩn quốc tế: mỗi khách sạn
có khu làm việc riêng theo đường dẫn `/<slug>/...`, giá bán theo từng
kênh, tồn phòng dùng chung mọi kênh. Tài liệu này là bản chốt cấu trúc
thư mục + bản đồ menu + thứ tự làm việc (bản v3, thay README v2: khung
đổi thành i hệt bản cũ, menu đổi thành đúng 4 nhóm bản cũ).

## 1. Cấu trúc thư mục

```
city-house-pms/
  app/
    login/page.tsx            Trang đăng nhập (KHÔNG dùng khung Shell)
    page.tsx                  Trang chủ
    hotels/page.tsx           Danh sách + thêm khách sạn
    users/page.tsx            Người dùng & vai trò (chỉ admin)
    [slug]/
      page.tsx                Tổng quan khách sạn (điểm vào khu làm việc)
      room-types/page.tsx     Loại phòng & Phòng
      rates/page.tsx          Lịch giá (sắp làm)
      channels/page.tsx       Kênh bán (sắp làm)
      inventory/page.tsx      Tồn phòng (sắp làm)
      calendar/page.tsx       Lịch phòng (GĐ3)
      reservations/page.tsx   Đặt phòng (GĐ3)
  components/
    Shell.tsx                 Khung chung i hệt bản cũ (mục 3)
    ui.tsx                    Đồ dùng chung: thẻ, ô nhập, ô chọn, nút,
                              nhãn trạng thái, hộp báo lỗi/thành công
  lib/
    supabase/client.ts        Code nối database ở trình duyệt
  middleware.ts               Chặn đường dẫn ở máy chủ (gốc dự án)
  .env.example                Mẫu biến môi trường (chỉ tên + ví dụ)
  README.md                   Tài liệu này
```

Quy tắc đặt file (để dev sau vào là làm được ngay):

- Một file là một trang hoặc một thành phần, không nhét nhiều thứ vào
  một file. Tên file, tên thư mục, tên biến/hàm/type trong code dùng
  TIẾNG ANH; chữ hiện cho người dùng dùng TIẾNG VIỆT.
- Đồ dùng lặp lại nằm riêng ở `components/`: khung Shell và bộ `ui.tsx`.
  Trang chỉ giữ nội dung của nó, không tự viết lại thanh aside, thẻ,
  ô nhập hay nút. Không chia `components/` thành nhiều thư mục con khi
  chưa cần — chia nhỏ sớm chỉ làm đường dẫn import rối và phải sửa lại
  các trang đã dán.
- Trang nào cũng nằm trong khung Shell, trừ trang đăng nhập.
- SQL KHÔNG lưu trong dự án: SQL chỉ chạy trên web Supabase, file gốc
  lúc giao vẫn giữ ở chỗ giao file để đối chiếu khi cần.
- Không có nút chết, không có ô chết: mục menu, nút bấm hay ô nhập chỉ
  xuất hiện khi chức năng của nó đã có thật — trừ ô tìm kiếm, nút +
  và chuông trên thanh trên giữ đúng như bản cũ (chỉ có hình thức,
  chức năng làm khi tới trang tương ứng).

## 2. Bản đồ menu đầy đủ (đúng 4 nhóm bản cũ)

Menu gom nhóm, bấm tiêu đề nhóm để đóng/mở riêng từng nhóm, mặc định
mở hết, nhóm rỗng tự ẩn, mục đang mở tô nền xanh nhạt + vạch xanh ở
mép trái, mỗi mục có icon nét đơn. Một mục chỉ hiện khi trang thật
của nó đã xong — bảng dưới ghi rõ mục nào xong, mục nào sắp làm.

Ngoài khu làm việc (trang chung):

- Vận hành: Trang chủ `/` (xong)
- Quản lí: Khách sạn `/hotels` (xong), Người dùng & vai trò `/users`
  (xong, chỉ admin), Báo cáo (sắp làm, chỉ admin), Cài đặt (sắp làm,
  chỉ admin)

Trong khu làm việc của một khách sạn (`/<slug>/...`, tên khách sạn xem
ở ô chọn trên thanh trên):

- Vận hành: Tổng quan `/<slug>` (xong), Lịch phòng
  `/<slug>/calendar` (GĐ3), Đặt phòng `/<slug>/reservations` (GĐ3)
- Bán phòng: Lịch giá `/<slug>/rates` (sắp làm), Kênh bán
  `/<slug>/channels` (sắp làm), Tồn phòng `/<slug>/inventory`
  (sắp làm). Nhóm này KHÔNG có Chính sách giá: PMS chỉ trả giá + tồn,
  kênh ngoài tự quản điều kiện của họ.
- Thông tin khách sạn: Loại phòng & Phòng `/<slug>/room-types`
  (xong). Nhóm này theo đúng bản cũ (bản cũ còn Thông tin chung,
  Cấu hình, Thư viện ảnh — làm sau khi có trang chi tiết khách sạn).

## 3. Khung Shell (components/Shell.tsx) — i hệt bản cũ

- Aside rộng 240px, nền trắng, viền phải #dde3ea, đứng yên full chiều
  cao: khối logo ô vuông xanh + 2 dòng chữ (CITYHOUSE / cityhousePMS
  cho đúng tên sản phẩm mới; bản cũ ghi PMS Hotel), menu ở giữa, cuối
  aside là khối người dùng kiểu cũ (avatar tròn + tên + vai trò + nút
  Thoát).
- Thanh trên trắng, viền dưới #dde3ea: ô chọn khách sạn bên trái
  (chọn khách sạn nào thì về Tổng quan của khách sạn đó), ô tìm kiếm
  dạng viên thuốc ở giữa, nút + xanh và chuông có chấm đỏ bên phải.
  Thanh trên theo bản cũ KHÔNG hiện tên trang.
- Nền trang #eef1f5, chữ chính #17293e, chữ phụ #68707a, phông
  Segoe UI. Nội dung trải full rộng, lề p-6 (không giới hạn chiều
  rộng như bản khung trước).
- Shell đặt trong từng trang (không sửa file gốc của Next.js) để khỏi
  động vào phông chữ/metadata mặc định; các trang cứ để nguyên
  `title` như cũ cũng không sao vì thanh trên không hiện nó.

## 4. Phân quyền (làm ngay sau khi xong layout)

- Nhân viên chỉ thấy các phần thuộc quyền của mình: menu lọc theo vai
  trò (mục admin tự ẩn với staff), form thêm/sửa chỉ admin thấy,
  khóa thật ở database bằng RLS theo tài khoản, trang admin chặn thêm
  ở máy chủ bằng middleware (danh sách ADMIN_PATHS).
- Không có hồ sơ thì tính là quyền thấp nhất (staff), không mặc định
  admin. Hành vi các trang hiện tại giữ nguyên, bước phân quyền chỉ
  rà soát, khóa nốt và áp cùng quy tắc cho các trang mới.

## 5. Thứ tự làm việc

1. Khung kiểu bản cũ (Shell NEW11c) — xong.
2. Bản README này (cấu trúc + bản đồ menu theo 4 nhóm bản cũ).
3. Phân quyền: staff chỉ thấy đúng phần của mình (mục 4).
4. Các trang chức năng tiếp theo, mỗi trang xong thì mục menu của nó
   tự hiện: Lịch giá, Kênh bán, Tồn phòng, rồi Lịch phòng, Đặt phòng
   (GĐ3).

## 6. Trạng thái tới 02/11/2026

- Xong: đăng nhập, trang chủ, khách sạn, người dùng & vai trò, loại
  phòng & phòng, tổng quan khách sạn, khung Shell i hệt bản cũ.
- Chờ báo kiểm tra: trang chủ bản trong khung, bản sửa vạch vàng
  trang Khách sạn, chặn máy chủ cho `/users`, trang loại phòng &
  phòng (đã giao lại sau báo 404).
- Chưa làm: phân quyền, các trang Bán phòng, Lịch phòng, Đặt phòng.

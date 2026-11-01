"use client";

// ============================================================
// TRANG TONG QUAN KHACH SAN — app/[slug]/page.tsx
// (du an moi city-house-pms; giao lan 2, ten File-NEW21b,
//  GHI DE file app/[slug]/page.tsx cua File-NEW21.
//
//  CHI KHAC NEW21 O 2 CHO (so lieu + giao dien giu nguyen):
//  (1) Sua vach "setState synchronously within an effect" giong
//  mau File-NEW12c: loadData() o ngoai component chi tai + tra
//  du lieu, effect nhan du lieu trong callback .then roi moi
//  goi applyData() dua vao state.
//  (2) The <a> chuyen trang doi thanh <Link> cua Next.js
//  (quy tac @next/next/no-html-link-for-pages, giong File-NEW11d:
//  1 link ve Danh sach khach san + 2 link o khoi Di toi).
//  TAO MOI thu muc app/[slug]/ roi dat file nay vao do —
//  chu [slug] giu nguyen, khong thay bang ten khach san)
//
// Diem vao khu lam viec rieng tung khach san, vi du:
// /cityhouse-mark. Trang tu tim khach san theo slug tren
// duong dan (chi trong tai khoan dang dang nhap, nho RLS);
// slug la thi hien dong khong tim thay.
// - Thong tin khach san: ten, duong dan, mui gio, dia chi,
//   so dien thoai, email (cho nao chua nhap thi hien dau —).
// - So lieu phong: so loai phong, tong so phong, so phong
//   dang ban, so phong dang hong.
// - Link di toi chi cac trang that: Loai phong & Phong,
//   Danh sach khach san. Cac muc khac (Lich gia, Kenh ban,
//   Ton phong...) se co link khi trang cua chung xong,
//   khong gan link chet truoc.
// - Trang dung khung Shell va bo thanh phan chung ui.tsx.
// - Can co File-NEW11b (Shell). O chon khach san tren thanh
//   tren se dua ve trang nay o file Shell v3 (lượt sau).
// ============================================================

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Shell from "@/components/Shell";
import { Card, ErrorBox } from "@/components/ui";

type Hotel = {
  id: string;
  name: string;
  slug: string;
  timezone: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
};

type RoomCounts = {
  typeCount: number;
  roomCount: number;
  availableCount: number;
  outOfOrderCount: number;
};

// Du lieu tai ve + ket qua tai: chi la du lieu, khong doi state.
type OverviewData = {
  hotel: Hotel;
  counts: RoomCounts;
};

type LoadOutcome =
  | { status: "ok"; data: OverviewData }
  | { status: "error"; message: string }
  | { status: "no-session" };

async function loadData(slug: string): Promise<LoadOutcome> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) return { status: "no-session" };

  // Khach san theo slug (RLS chi tra khach san trong cung
  // tai khoan, slug la thi khong thay dong nao).
  const { data: hotelData, error: hotelError } = await supabase
    .from("hotels")
    .select("id, name, slug, timezone, address, phone, email")
    .eq("slug", slug)
    .single();
  if (hotelError || !hotelData) {
    return {
      status: "error",
      message: "Không tìm thấy khách sạn này trong tài khoản của bạn.",
    };
  }
  const hotel: Hotel = {
    id: hotelData.id,
    name: hotelData.name,
    slug: hotelData.slug,
    timezone: hotelData.timezone ?? null,
    address: hotelData.address ?? null,
    phone: hotelData.phone ?? null,
    email: hotelData.email ?? null,
  };

  const { data: typeList } = await supabase
    .from("room_types")
    .select("id")
    .eq("hotel_id", hotelData.id);
  const { data: roomList } = await supabase
    .from("rooms")
    .select("id, status")
    .eq("hotel_id", hotelData.id);
  const rooms = roomList ?? [];
  return {
    status: "ok",
    data: {
      hotel,
      counts: {
        typeCount: (typeList ?? []).length,
        roomCount: rooms.length,
        availableCount: rooms.filter((r) => r.status === "available").length,
        outOfOrderCount: rooms.filter((r) => r.status === "out_of_order")
          .length,
      },
    },
  };
}

export default function WorkspaceOverviewPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [counts, setCounts] = useState<RoomCounts>({
    typeCount: 0,
    roomCount: 0,
    availableCount: 0,
    outOfOrderCount: 0,
  });

  // Dua du lieu tai ve vao state. Ham on dinh (khong phu thuoc
  // gi) nen effect chi chay lai khi doi slug.
  const applyData = useCallback((data: OverviewData) => {
    setHotel(data.hotel);
    setCounts(data.counts);
    setLoading(false);
  }, []);

  // Doi state chi nam trong callback .then (bat dong bo, chay
  // sau khi du lieu ve) — khong nam ngay trong effect nen het
  // vach setState. Co don huy khi doi trang truoc khi du lieu ve.
  useEffect(() => {
    let cancelled = false;
    loadData(slug).then((outcome) => {
      if (cancelled) return;
      if (outcome.status === "no-session") {
        router.replace("/login");
        return;
      }
      if (outcome.status === "error") {
        setError(outcome.message);
        setLoading(false);
        return;
      }
      applyData(outcome.data);
    });
    return () => {
      cancelled = true;
    };
  }, [slug, router, applyData]);

  return (
    <Shell title="Tổng quan">
      <Link
        href="/hotels"
        className="text-sm font-medium text-[#1f3a5f] hover:underline"
      >
        ← Danh sách khách sạn
      </Link>

      {loading && <p className="mt-4 text-sm text-[#6b7480]">Đang tải...</p>}

      {!loading && error && <ErrorBox message={error} className="mt-4" />}

      {!loading && !error && hotel && (
        <>
          <Card className="mt-4">
            <h2 className="text-lg font-bold text-[#1f1f1f]">
              {hotel.name}
            </h2>
            <div className="mt-2 space-y-1 text-sm text-[#6b7480]">
              <p>Đường dẫn: /{hotel.slug}</p>
              <p>Múi giờ: {hotel.timezone ?? "—"}</p>
              <p>Địa chỉ: {hotel.address ?? "—"}</p>
              <p>Số điện thoại: {hotel.phone ?? "—"}</p>
              <p>Email: {hotel.email ?? "—"}</p>
            </div>
          </Card>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <Card>
              <div className="text-2xl font-bold text-[#1f1f1f]">
                {counts.typeCount}
              </div>
              <div className="mt-1 text-sm text-[#6b7480]">Loại phòng</div>
            </Card>
            <Card>
              <div className="text-2xl font-bold text-[#1f1f1f]">
                {counts.roomCount}
              </div>
              <div className="mt-1 text-sm text-[#6b7480]">Tổng số phòng</div>
            </Card>
            <Card>
              <div className="text-2xl font-bold text-[#137333]">
                {counts.availableCount}
              </div>
              <div className="mt-1 text-sm text-[#6b7480]">Phòng đang bán</div>
            </Card>
            <Card>
              <div className="text-2xl font-bold text-[#e5484d]">
                {counts.outOfOrderCount}
              </div>
              <div className="mt-1 text-sm text-[#6b7480]">
                Phòng đang hỏng
              </div>
            </Card>
          </div>

          <Card className="mt-6">
            <h2 className="text-lg font-bold text-[#1f1f1f]">Đi tới</h2>
            <div className="mt-3 space-y-2">
              <Link
                href={`/${hotel.slug}/room-types`}
                className="block text-sm font-medium text-[#1f3a5f] hover:underline"
              >
                Loại phòng & Phòng →
              </Link>
              <Link
                href="/hotels"
                className="block text-sm font-medium text-[#1f3a5f] hover:underline"
              >
                Danh sách khách sạn →
              </Link>
            </div>
          </Card>
        </>
      )}
    </Shell>
  );
}

"use client";

// ============================================================
// TRANG LOAI PHONG & PHONG — app/[slug]/room-types/page.tsx
// (du an moi city-house-pms; giao lan 2, ten File-NEW17b,
//  GHI DE file app/[slug]/room-types/page.tsx cua File-NEW17.
//  Neu chua dan File-NEW17 thi khoi dan no, dan thang ban nay.
//
//  CHI KHAC NEW17 O 2 CHO (danh sach + form giu nguyen):
//  (1) Sua vach "setState synchronously within an effect" giong
//  mau File-NEW12c/NEW21b: loadData() o ngoai component chi tai
//  + tra du lieu, effect nhan du lieu trong callback .then roi
//  moi goi applyData() dua vao state. Hai form luu xong cung
//  tai lai bang cap loadData() + applyData() thay cho load() cu.
//  (2) Link ve Danh sach khach san doi tu the <a> sang <Link>
//  cua Next.js (quy tac @next/next/no-html-link-for-pages).
//  TAO MOI thu muc app/[slug]/room-types/ roi dat file nay
//  vao do — chu [slug] giu nguyen, khong thay bang ten
//  khach san)
//
// Duong dan lam viec rieng tung khach san, vi du:
// /cityhouse-mark/room-types. Trang tu tim khach san theo
// slug tren duong dan (chi trong tai khoan dang dang nhap,
// nho RLS); slug la thi hien dong khong tim thay.
// - Danh sach: tung loai phong kem cac phong thuoc loai do.
// - Chi QUAN TRI VIEN moi them/sua duoc: them loai phong,
//   sua loai phong (ten, suc chua, dien tich, mo ta), them
//   phong, doi trang thai phong (dang ban / dang hong).
//   Nhan vien chi xem danh sach.
// - Trang dung khung Shell va bo thanh phan chung ui.tsx.
// - Can co File-NEW11 (Shell) va File-NEW15 (ui). Trang
//   Khach san se gan nut sang day o file sau.
// ============================================================

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Shell from "@/components/Shell";
import {
  Badge,
  Card,
  ErrorBox,
  Field,
  PrimaryButton,
  SelectField,
  SuccessBox,
} from "@/components/ui";

type Hotel = {
  id: string;
  name: string;
  slug: string;
  timezone: string | null;
};

type RoomType = {
  id: string;
  name: string;
  max_adults: number;
  max_children: number;
  size_m2: number | null;
  description: string | null;
};

type Room = {
  id: string;
  room_type_id: string;
  number: string;
  floor: number | null;
  status: string;
};

function statusLabel(status: string): string {
  if (status === "out_of_order") return "Đang hỏng";
  return "Đang bán";
}

// Du lieu tai ve + ket qua tai: chi la du lieu, khong doi state.
type RoomTypesData = {
  accountId: string;
  isAdmin: boolean;
  hotel: Hotel;
  types: RoomType[];
  rooms: Room[];
};

type LoadOutcome =
  | { status: "ok"; data: RoomTypesData }
  | { status: "error"; message: string }
  | { status: "no-session" };

async function loadData(slug: string): Promise<LoadOutcome> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) return { status: "no-session" };

  const { data: mine, error: mineError } = await supabase
    .from("user_profiles")
    .select("account_id, role")
    .eq("user_id", session.user.id)
    .single();
  if (mineError || !mine) {
    return { status: "error", message: "Không đọc được hồ sơ của bạn." };
  }

  // Khach san theo slug (RLS chi tra khach san trong cung
  // tai khoan, slug la thi khong thay dong nao).
  const { data: hotelData, error: hotelError } = await supabase
    .from("hotels")
    .select("id, name, slug, timezone")
    .eq("slug", slug)
    .single();
  if (hotelError || !hotelData) {
    return {
      status: "error",
      message: "Không tìm thấy khách sạn này trong tài khoản của bạn.",
    };
  }

  const { data: typeList } = await supabase
    .from("room_types")
    .select("id, name, max_adults, max_children, size_m2, description")
    .eq("hotel_id", hotelData.id)
    .order("created_at", { ascending: true });

  const { data: roomList } = await supabase
    .from("rooms")
    .select("id, room_type_id, number, floor, status")
    .eq("hotel_id", hotelData.id)
    .order("number", { ascending: true });

  return {
    status: "ok",
    data: {
      accountId: mine.account_id,
      isAdmin: mine.role === "admin",
      hotel: {
        id: hotelData.id,
        name: hotelData.name,
        slug: hotelData.slug,
        timezone: hotelData.timezone ?? null,
      },
      types: (typeList ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        max_adults: t.max_adults,
        max_children: t.max_children,
        size_m2: t.size_m2 ?? null,
        description: t.description ?? null,
      })),
      rooms: (roomList ?? []).map((r) => ({
        id: r.id,
        room_type_id: r.room_type_id,
        number: r.number,
        floor: r.floor ?? null,
        status: r.status,
      })),
    },
  };
}

export default function RoomTypesPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [types, setTypes] = useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Form loai phong (dung chung cho them moi va sua).
  const [editingTypeId, setEditingTypeId] = useState("");
  const [typeName, setTypeName] = useState("");
  const [typeAdults, setTypeAdults] = useState("2");
  const [typeChildren, setTypeChildren] = useState("0");
  const [typeSize, setTypeSize] = useState("");
  const [typeDesc, setTypeDesc] = useState("");
  const [typeSaving, setTypeSaving] = useState(false);
  const [typeError, setTypeError] = useState("");
  const [typeOk, setTypeOk] = useState("");

  // Form them phong.
  const [roomTypeId, setRoomTypeId] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [roomFloor, setRoomFloor] = useState("");
  const [roomStatus, setRoomStatus] = useState("available");
  const [roomSaving, setRoomSaving] = useState(false);
  const [roomError, setRoomError] = useState("");
  const [roomOk, setRoomOk] = useState("");
  const [statusSavingId, setStatusSavingId] = useState("");

  // Dua du lieu tai ve vao state. Ham on dinh (khong phu thuoc
  // gi) nen effect chi chay lai khi doi slug.
  const applyData = useCallback((data: RoomTypesData) => {
    setAccountId(data.accountId);
    setIsAdmin(data.isAdmin);
    setHotel(data.hotel);
    setTypes(data.types);
    setRooms(data.rooms);
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

  function startEditType(t: RoomType) {
    setEditingTypeId(t.id);
    setTypeName(t.name);
    setTypeAdults(String(t.max_adults));
    setTypeChildren(String(t.max_children));
    setTypeSize(t.size_m2 === null ? "" : String(t.size_m2));
    setTypeDesc(t.description ?? "");
    setTypeError("");
    setTypeOk("");
  }

  function cancelEditType() {
    setEditingTypeId("");
    setTypeName("");
    setTypeAdults("2");
    setTypeChildren("0");
    setTypeSize("");
    setTypeDesc("");
    setTypeError("");
    setTypeOk("");
  }

  async function saveType(e: React.FormEvent) {
    e.preventDefault();
    setTypeError("");
    setTypeOk("");
    if (!hotel) return;
    const name = typeName.trim();
    const adults = parseInt(typeAdults, 10);
    const children = parseInt(typeChildren, 10);
    const size = typeSize.trim() === "" ? null : parseFloat(typeSize);
    if (!name) {
      setTypeError("Hãy nhập tên loại phòng.");
      return;
    }
    if (Number.isNaN(adults) || adults < 1) {
      setTypeError("Số người lớn tối đa phải là số từ 1 trở lên.");
      return;
    }
    if (Number.isNaN(children) || children < 0) {
      setTypeError("Số trẻ em tối đa phải là số từ 0 trở lên.");
      return;
    }
    if (size !== null && (Number.isNaN(size) || size <= 0)) {
      setTypeError("Diện tích phải là số lớn hơn 0, hoặc để trống.");
      return;
    }
    setTypeSaving(true);
    const supabase = createClient();
    const values = {
      name,
      max_adults: adults,
      max_children: children,
      size_m2: size,
      description: typeDesc.trim() || null,
    };
    const { error: saveError } = editingTypeId
      ? await supabase.from("room_types").update(values).eq("id", editingTypeId)
      : await supabase
          .from("room_types")
          .insert({ account_id: accountId, hotel_id: hotel.id, ...values });
    setTypeSaving(false);
    if (saveError) {
      setTypeError("Lưu loại phòng không thành công.");
      return;
    }
    setTypeOk(
      editingTypeId
        ? `Đã lưu thay đổi cho loại phòng ${name}.`
        : `Đã thêm loại phòng ${name}.`,
    );
    cancelEditType();
    const outcome = await loadData(slug);
    if (outcome.status === "ok") applyData(outcome.data);
  }

  async function addRoom(e: React.FormEvent) {
    e.preventDefault();
    setRoomError("");
    setRoomOk("");
    if (!hotel) return;
    const typeId = roomTypeId || types[0]?.id || "";
    const number = roomNumber.trim();
    const floor = roomFloor.trim() === "" ? null : parseInt(roomFloor, 10);
    if (!typeId) {
      setRoomError("Hãy thêm loại phòng trước rồi mới thêm phòng.");
      return;
    }
    if (!number) {
      setRoomError("Hãy nhập số phòng.");
      return;
    }
    if (floor !== null && Number.isNaN(floor)) {
      setRoomError("Tầng phải là số, hoặc để trống.");
      return;
    }
    setRoomSaving(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("rooms").insert({
      account_id: accountId,
      hotel_id: hotel.id,
      room_type_id: typeId,
      number,
      floor,
      status: roomStatus,
    });
    setRoomSaving(false);
    if (insertError) {
      if (insertError.code === "23505") {
        setRoomError("Số phòng này đã có trong khách sạn, hãy đổi số khác.");
      } else {
        setRoomError("Thêm phòng không thành công.");
      }
      return;
    }
    setRoomOk(`Đã thêm phòng ${number}.`);
    setRoomNumber("");
    setRoomFloor("");
    const outcome = await loadData(slug);
    if (outcome.status === "ok") applyData(outcome.data);
  }

  async function changeRoomStatus(roomId: string, newStatus: string) {
    setStatusSavingId(roomId);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("rooms")
      .update({ status: newStatus })
      .eq("id", roomId);
    setStatusSavingId("");
    if (updateError) {
      setRoomError("Đổi trạng thái phòng không thành công.");
      return;
    }
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r)),
    );
  }

  const effectiveRoomTypeId = roomTypeId || types[0]?.id || "";

  return (
    <Shell title="Loại phòng & Phòng">
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
          <p className="mt-4 text-sm leading-relaxed text-[#6b7480]">
            Khách sạn: {hotel.name} · /{hotel.slug} · Múi giờ{" "}
            {hotel.timezone ?? "—"}
          </p>

          {/* Danh sach loai phong + phong */}
          <div className="mt-6 space-y-6">
            {types.length === 0 && (
              <p className="text-sm text-[#6b7480]">Chưa có loại phòng.</p>
            )}
            {types.map((t) => {
              const typeRooms = rooms.filter((r) => r.room_type_id === t.id);
              return (
                <Card key={t.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-semibold text-[#1f1f1f]">
                        {t.name}
                      </div>
                      <div className="mt-1 text-sm text-[#6b7480]">
                        Tối đa {t.max_adults} người lớn · {t.max_children} trẻ
                        em
                        {t.size_m2 !== null ? ` · ${t.size_m2} m²` : ""}
                      </div>
                      {t.description && (
                        <p className="mt-1.5 text-sm leading-relaxed text-[#6b7480]">
                          {t.description}
                        </p>
                      )}
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => startEditType(t)}
                        className="shrink-0 rounded-lg border border-[#dbe2ea] px-3 py-1.5 text-sm font-medium text-[#1f3a5f] transition hover:bg-[#f2f6fe]"
                      >
                        Sửa
                      </button>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    {typeRooms.length === 0 && (
                      <p className="text-sm text-[#6b7480]">
                        Chưa có phòng thuộc loại này.
                      </p>
                    )}
                    {typeRooms.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-4 border-b border-[#eef2f7] pb-2 last:border-b-0 last:pb-0"
                      >
                        <div className="text-sm text-[#1f1f1f]">
                          <span className="font-semibold">
                            Phòng {r.number}
                          </span>
                          <span className="text-[#6b7480]">
                            {" "}
                            · Tầng {r.floor ?? "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {statusSavingId === r.id && (
                            <span className="text-xs text-[#6b7480]">
                              Đang lưu...
                            </span>
                          )}
                          {isAdmin ? (
                            <select
                              aria-label={`Trạng thái phòng ${r.number}`}
                              value={r.status}
                              disabled={statusSavingId === r.id}
                              onChange={(e) =>
                                changeRoomStatus(r.id, e.target.value)
                              }
                              className="rounded-lg border border-[#dbe2ea] bg-white px-2 py-2 text-sm text-[#1f1f1f] outline-none disabled:opacity-50"
                            >
                              <option value="available">Đang bán</option>
                              <option value="out_of_order">Đang hỏng</option>
                            </select>
                          ) : (
                            <Badge
                              tone={
                                r.status === "out_of_order" ? "red" : "green"
                              }
                            >
                              {statusLabel(r.status)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          {isAdmin ? (
            <>
              {/* Form them / sua loai phong */}
              <Card className="mt-6">
                <h2 className="text-lg font-bold text-[#1f1f1f]">
                  {editingTypeId ? "Sửa loại phòng" : "Thêm loại phòng"}
                </h2>
                {typeError && (
                  <ErrorBox message={typeError} className="mt-4" />
                )}
                {typeOk && <SuccessBox message={typeOk} className="mt-4" />}
                <form onSubmit={saveType} className="mt-4 space-y-4">
                  <Field
                    id="type-name"
                    label="Tên loại phòng"
                    value={typeName}
                    onChange={setTypeName}
                    placeholder="Ví dụ: Deluxe King"
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field
                      id="type-adults"
                      label="Người lớn tối đa"
                      value={typeAdults}
                      onChange={setTypeAdults}
                      type="number"
                    />
                    <Field
                      id="type-children"
                      label="Trẻ em tối đa"
                      value={typeChildren}
                      onChange={setTypeChildren}
                      type="number"
                    />
                    <Field
                      id="type-size"
                      label="Diện tích (m², không bắt buộc)"
                      value={typeSize}
                      onChange={setTypeSize}
                      type="number"
                    />
                  </div>
                  <Field
                    id="type-desc"
                    label="Mô tả (không bắt buộc)"
                    value={typeDesc}
                    onChange={setTypeDesc}
                    placeholder="Ví dụ: Giường lớn, cửa sổ rộng nhìn ra thành phố."
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <PrimaryButton disabled={typeSaving}>
                      {typeSaving
                        ? "Đang lưu..."
                        : editingTypeId
                          ? "Lưu thay đổi"
                          : "Thêm loại phòng"}
                    </PrimaryButton>
                    {editingTypeId && (
                      <button
                        type="button"
                        onClick={cancelEditType}
                        className="h-12 rounded-xl border border-[#dbe2ea] px-6 text-sm font-semibold text-[#1f1f1f] transition hover:bg-[#f2f6fe]"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </form>
              </Card>

              {/* Form them phong */}
              <Card className="mt-6">
                <h2 className="text-lg font-bold text-[#1f1f1f]">
                  Thêm phòng
                </h2>
                {roomError && (
                  <ErrorBox message={roomError} className="mt-4" />
                )}
                {roomOk && <SuccessBox message={roomOk} className="mt-4" />}
                <form onSubmit={addRoom} className="mt-4 space-y-4">
                  <SelectField
                    id="room-type"
                    label="Loại phòng"
                    value={effectiveRoomTypeId}
                    onChange={setRoomTypeId}
                    options={types.map((t) => ({
                      value: t.id,
                      label: t.name,
                    }))}
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field
                      id="room-number"
                      label="Số phòng"
                      value={roomNumber}
                      onChange={setRoomNumber}
                      placeholder="Ví dụ: 105"
                    />
                    <Field
                      id="room-floor"
                      label="Tầng (không bắt buộc)"
                      value={roomFloor}
                      onChange={setRoomFloor}
                      type="number"
                    />
                    <SelectField
                      id="room-status"
                      label="Trạng thái"
                      value={roomStatus}
                      onChange={setRoomStatus}
                      options={[
                        { value: "available", label: "Đang bán" },
                        { value: "out_of_order", label: "Đang hỏng" },
                      ]}
                    />
                  </div>
                  <PrimaryButton disabled={roomSaving}>
                    {roomSaving ? "Đang thêm..." : "Thêm phòng"}
                  </PrimaryButton>
                </form>
              </Card>
            </>
          ) : (
            <p className="mt-5 text-sm leading-relaxed text-[#6b7480]">
              Chỉ quản trị viên thêm/sửa được loại phòng và phòng.
            </p>
          )}
        </>
      )}
    </Shell>
  );
}

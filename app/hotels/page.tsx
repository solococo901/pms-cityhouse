"use client";

// ============================================================
// TRANG DANH SACH KHACH SAN, BAN NAM TRONG KHUNG — app/hotels/page.tsx
// (du an moi city-house-pms; giao lan 3 sua vach effect, ten File-NEW12c,
//  GHI DE file app/hotels/page.tsx cua File-NEW12b.)
//
//  CHI KHAC NEW12b O CACH TAI DU LIEU (giao dien + form giu nguyen):
//  ham tai cu vua tai vua doi state ngay trong effect nen React moi
//  gach do "setState synchronously within an effect". Ban nay tach
//  lam hai: loadData() o ngoai component chi TAI va TRA du lieu
//  (khong doi state nao); effect nhan du lieu trong callback .then
//  (chay sau, bat dong bo that su) roi moi goi applyData() dua vao
//  state. Form them xong cung tai lai bang loadData() + applyData().
//
// Noi dung giong het File-NEW10 (danh sach khach san cung
// tai khoan kem so loai phong/so phong; form them khach san
// chi quan tri vien thay; nhan vien chi xem danh sach),
// chi khac: bo thanh navy rieng cua trang va nam trong
// khung chung Shell (aside + thanh tren), theo ban khung
// da chot. Can co File-NEW11 (components/Shell.tsx) thi
// trang nay moi chay duoc.
// Neu ban chua dan File-NEW10 thi khoi dan no, dan thang
// file nay.
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Shell from "@/components/Shell";

type HotelRow = {
  id: string;
  name: string;
  slug: string;
  timezone: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
};

const TIMEZONES = [
  "Asia/Ho_Chi_Minh",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "Asia/Jakarta",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "UTC",
];

// Chuyen ten thanh slug: bo dau tieng Viet, chu thuong,
// khoang trang thanh gach ngang, chi giu chu, so, gach ngang.
function toSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

// Du lieu tai ve + ket qua tai: chi la du lieu, khong doi state.
// (Tach rieng de sua vach effect: ham tai khong doi state nao.)
type HotelData = {
  accountId: string;
  isAdmin: boolean;
  hotels: HotelRow[];
  typeCounts: Record<string, number>;
  roomCounts: Record<string, number>;
};

type LoadOutcome =
  | { status: "ok"; data: HotelData }
  | { status: "error"; message: string }
  | { status: "no-session" };

async function loadData(): Promise<LoadOutcome> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) return { status: "no-session" };

  // Ho so cua chinh minh: lay ma tai khoan + vai tro.
  const { data: mine, error: mineError } = await supabase
    .from("user_profiles")
    .select("account_id, role")
    .eq("user_id", session.user.id)
    .single();
  if (mineError || !mine) {
    return { status: "error", message: "Không đọc được hồ sơ của bạn." };
  }

  // Danh sach khach san trong cung tai khoan (RLS loc san).
  const { data: hotelList, error: hotelError } = await supabase
    .from("hotels")
    .select("id, name, slug, timezone, address, phone, email")
    .order("created_at", { ascending: true });
  if (hotelError || !hotelList) {
    return { status: "error", message: "Không đọc được danh sách khách sạn." };
  }

  // Dem loai phong va phong theo tung khach san.
  const { data: types } = await supabase
    .from("room_types")
    .select("hotel_id");
  const { data: rooms } = await supabase.from("rooms").select("hotel_id");
  const tc: Record<string, number> = {};
  (types ?? []).forEach((t) => {
    tc[t.hotel_id] = (tc[t.hotel_id] ?? 0) + 1;
  });
  const rc: Record<string, number> = {};
  (rooms ?? []).forEach((r) => {
    rc[r.hotel_id] = (rc[r.hotel_id] ?? 0) + 1;
  });

  return {
    status: "ok",
    data: {
      accountId: mine.account_id,
      isAdmin: mine.role === "admin",
      hotels: hotelList.map((h) => ({
        id: h.id,
        name: h.name,
        slug: h.slug,
        timezone: h.timezone ?? null,
        address: h.address ?? null,
        phone: h.phone ?? null,
        email: h.email ?? null,
      })),
      typeCounts: tc,
      roomCounts: rc,
    },
  };
}

export default function HotelsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [hotels, setHotels] = useState<HotelRow[]>([]);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [roomCounts, setRoomCounts] = useState<Record<string, number>>({});

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formOk, setFormOk] = useState("");

  // Dua du lieu tai ve vao state. Ham on dinh (khong phu thuoc
  // gi) nen effect dung no chi chay 1 lan.
  const applyData = useCallback((data: HotelData) => {
    setAccountId(data.accountId);
    setIsAdmin(data.isAdmin);
    setHotels(data.hotels);
    setTypeCounts(data.typeCounts);
    setRoomCounts(data.roomCounts);
    setLoading(false);
  }, []);

  // Doi state chi nam trong callback .then (bat dong bo, chay
  // sau khi du lieu ve) — khong nam ngay trong effect nen het
  // vach setState. Co don huy khi trang doi truoc khi du lieu ve.
  useEffect(() => {
    let cancelled = false;
    loadData().then((outcome) => {
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
  }, [router, applyData]);

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(toSlug(value));
    }
  }

  async function addHotel(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormOk("");
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    if (!trimmedName) {
      setFormError("Hãy nhập tên khách sạn.");
      return;
    }
    if (!isValidSlug(trimmedSlug)) {
      setFormError(
        "Slug chỉ gồm chữ thường, số và dấu gạch ngang, ví dụ: cityhouse-mark.",
      );
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("hotels").insert({
      account_id: accountId,
      slug: trimmedSlug,
      name: trimmedName,
      timezone,
      address: address.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
    });
    setSaving(false);
    if (insertError) {
      if (insertError.code === "23505") {
        setFormError(
          "Slug này đã có khách sạn dùng trong tài khoản của bạn, hãy đổi slug khác.",
        );
      } else {
        setFormError("Thêm khách sạn không thành công.");
      }
      return;
    }
    setFormOk(`Đã thêm khách sạn ${trimmedName}.`);
    setName("");
    setSlug("");
    setSlugTouched(false);
    setAddress("");
    setPhone("");
    setEmail("");
    const outcome = await loadData();
    if (outcome.status === "ok") applyData(outcome.data);
  }

  return (
    <Shell title="Khách sạn">
      <p className="text-sm leading-relaxed text-[#6b7480]">
        Danh sách các khách sạn trong tài khoản của bạn. Mỗi khách sạn sau
        này có khu làm việc riêng theo đường dẫn của nó.
      </p>

        {loading && <p className="mt-4 text-sm text-[#6b7480]">Đang tải...</p>}

        {!loading && error && (
          <p className="mt-4 rounded-xl bg-[#fdecec] px-4 py-3 text-sm text-[#e5484d]">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
              {hotels.length === 0 ? (
                <p className="text-sm text-[#6b7480]">Chưa có khách sạn.</p>
              ) : (
                <div className="space-y-4">
                  {hotels.map((h) => (
                    <div
                      key={h.id}
                      className="border-b border-[#eef2f7] pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="text-base font-semibold text-[#1f1f1f]">
                        {h.name}
                      </div>
                      <div className="mt-0.5 text-xs text-[#6b7480]">
                        /{h.slug} · Múi giờ {h.timezone ?? "—"}
                      </div>
                      <div className="mt-1.5 text-sm text-[#6b7480]">
                        {typeCounts[h.id] ?? 0} loại phòng ·{" "}
                        {roomCounts[h.id] ?? 0} phòng
                      </div>
                      {(h.address || h.phone || h.email) && (
                        <div className="mt-1 text-xs text-[#6b7480]">
                          {[h.address, h.phone, h.email]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {isAdmin ? (
              <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
                <h2 className="text-lg font-bold text-[#1f1f1f]">
                  Thêm khách sạn
                </h2>
                {formError && (
                  <p className="mt-4 rounded-xl bg-[#fdecec] px-4 py-3 text-sm text-[#e5484d]">
                    {formError}
                  </p>
                )}
                {formOk && (
                  <p className="mt-4 rounded-xl bg-[#e6f4ea] px-4 py-3 text-sm text-[#137333]">
                    {formOk}
                  </p>
                )}
                <form onSubmit={addHotel} className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="hotel-name"
                      className="text-sm font-medium text-[#1f1f1f]"
                    >
                      Tên khách sạn
                    </label>
                    <input
                      id="hotel-name"
                      type="text"
                      value={name}
                      onChange={(e) => onNameChange(e.target.value)}
                      placeholder="Ví dụ: CityHouse Riverside"
                      className="mt-1.5 h-12 w-full rounded-xl border border-[#dbe2ea] px-4 text-sm text-[#1f1f1f] outline-none focus:border-[#1f3a5f]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="hotel-slug"
                      className="text-sm font-medium text-[#1f1f1f]"
                    >
                      Slug (phần đường dẫn riêng)
                    </label>
                    <input
                      id="hotel-slug"
                      type="text"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        setSlugTouched(true);
                      }}
                      placeholder="Ví dụ: cityhouse-riverside"
                      className="mt-1.5 h-12 w-full rounded-xl border border-[#dbe2ea] px-4 text-sm text-[#1f1f1f] outline-none focus:border-[#1f3a5f]"
                    />
                    <p className="mt-1 text-xs text-[#6b7480]">
                      Chỉ gồm chữ thường, số và dấu gạch ngang.
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="hotel-timezone"
                      className="text-sm font-medium text-[#1f1f1f]"
                    >
                      Múi giờ
                    </label>
                    <select
                      id="hotel-timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="mt-1.5 h-12 w-full rounded-xl border border-[#dbe2ea] bg-white px-4 text-sm text-[#1f1f1f] outline-none focus:border-[#1f3a5f]"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="hotel-address"
                      className="text-sm font-medium text-[#1f1f1f]"
                    >
                      Địa chỉ (không bắt buộc)
                    </label>
                    <input
                      id="hotel-address"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="mt-1.5 h-12 w-full rounded-xl border border-[#dbe2ea] px-4 text-sm text-[#1f1f1f] outline-none focus:border-[#1f3a5f]"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="hotel-phone"
                        className="text-sm font-medium text-[#1f1f1f]"
                      >
                        Số điện thoại (không bắt buộc)
                      </label>
                      <input
                        id="hotel-phone"
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1.5 h-12 w-full rounded-xl border border-[#dbe2ea] px-4 text-sm text-[#1f1f1f] outline-none focus:border-[#1f3a5f]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="hotel-email"
                        className="text-sm font-medium text-[#1f1f1f]"
                      >
                        Email (không bắt buộc)
                      </label>
                      <input
                        id="hotel-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1.5 h-12 w-full rounded-xl border border-[#dbe2ea] px-4 text-sm text-[#1f1f1f] outline-none focus:border-[#1f3a5f]"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-12 w-full rounded-xl bg-[#1f3a5f] text-sm font-semibold text-white transition hover:bg-[#16304f] disabled:opacity-50 sm:w-auto sm:px-6"
                  >
                    {saving ? "Đang thêm..." : "Thêm khách sạn"}
                  </button>
                </form>
              </section>
            ) : (
              <p className="mt-5 text-sm leading-relaxed text-[#6b7480]">
                Chỉ quản trị viên thêm được khách sạn.
              </p>
            )}

            <p className="mt-5 text-sm leading-relaxed text-[#6b7480]">
              Trang quản lý loại phòng và từng phòng trong mỗi khách sạn sẽ
              làm ở file sau.
            </p>
          </>
        )}
    </Shell>
  );
}

"use client";

// ============================================================
// TRANG KENH BAN — app/[slug]/channels/page.tsx
// (du an moi city-house-pms; giao lan 1, ten File-NEW25,
//  TAO MOI thu muc app/[slug]/channels/ roi dat file nay
//  vao do — chu [slug] giu nguyen, khong thay bang ten
//  khach san)
//
// Duong dan lam viec rieng tung khach san, vi du:
// /cityhouse-mark/channels. Trang tu tim khach san theo
// slug tren duong dan (chi trong tai khoan dang dang nhap,
// nho RLS); slug la thi hien dong khong tim thay.
// - Danh sach: tung kenh ban kem cac goi gia thuoc kenh do.
// - Chi QUAN TRI VIEN moi them duoc: them kenh ban (ma +
//   ten), them goi gia vao 1 kenh. Nhan vien chi xem.
// - Trang dung khung Shell va bo thanh phan chung ui.tsx.
// - Can co File-NEW11 (Shell), File-NEW15 (ui) va File-NEW24
//   (bang channels / rate_plans) thi trang nay moi chay duoc.
// - Muc menu "Kenh ban" trong nhom Ban phong se them vao
//   Shell o file sau; truoc mat vao trang bang duong dan
//   truc tiep /<slug>/channels.
// - Cach tai du lieu theo mau File-NEW12c: loadData() o
//   ngoai component chi tai + tra du lieu, effect nhan du
//   lieu trong callback .then roi moi goi applyData().
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
};

type Channel = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
};

type Plan = {
  id: string;
  channel_id: string;
  name: string;
  is_active: boolean;
};

// Ma kenh giong slug: chu thuong, so, gach ngang.
function isValidCode(code: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(code);
}

// Du lieu tai ve + ket qua tai: chi la du lieu, khong doi state.
type ChannelsData = {
  accountId: string;
  isAdmin: boolean;
  hotel: Hotel;
  channels: Channel[];
  plans: Plan[];
};

type LoadOutcome =
  | { status: "ok"; data: ChannelsData }
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
    .select("id, name, slug")
    .eq("slug", slug)
    .single();
  if (hotelError || !hotelData) {
    return {
      status: "error",
      message: "Không tìm thấy khách sạn này trong tài khoản của bạn.",
    };
  }

  const { data: channelList } = await supabase
    .from("channels")
    .select("id, code, name, is_active")
    .eq("hotel_id", hotelData.id)
    .order("created_at", { ascending: true });
  const { data: planList } = await supabase
    .from("rate_plans")
    .select("id, channel_id, name, is_active")
    .eq("hotel_id", hotelData.id)
    .order("created_at", { ascending: true });

  return {
    status: "ok",
    data: {
      accountId: mine.account_id,
      isAdmin: mine.role === "admin",
      hotel: {
        id: hotelData.id,
        name: hotelData.name,
        slug: hotelData.slug,
      },
      channels: (channelList ?? []).map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        is_active: c.is_active,
      })),
      plans: (planList ?? []).map((p) => ({
        id: p.id,
        channel_id: p.channel_id,
        name: p.name,
        is_active: p.is_active,
      })),
    },
  };
}

export default function ChannelsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  // Form them kenh.
  const [channelCode, setChannelCode] = useState("");
  const [channelName, setChannelName] = useState("");
  const [channelSaving, setChannelSaving] = useState(false);
  const [channelError, setChannelError] = useState("");
  const [channelOk, setChannelOk] = useState("");

  // Form them goi gia.
  const [planChannelId, setPlanChannelId] = useState("");
  const [planName, setPlanName] = useState("");
  const [planSaving, setPlanSaving] = useState(false);
  const [planError, setPlanError] = useState("");
  const [planOk, setPlanOk] = useState("");

  // Dua du lieu tai ve vao state. Ham on dinh (khong phu thuoc
  // gi) nen effect chi chay lai khi doi slug.
  const applyData = useCallback((data: ChannelsData) => {
    setAccountId(data.accountId);
    setIsAdmin(data.isAdmin);
    setHotel(data.hotel);
    setChannels(data.channels);
    setPlans(data.plans);
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

  async function refresh() {
    const outcome = await loadData(slug);
    if (outcome.status === "ok") applyData(outcome.data);
  }

  async function addChannel(e: React.FormEvent) {
    e.preventDefault();
    setChannelError("");
    setChannelOk("");
    if (!hotel) return;
    const code = channelCode.trim();
    const name = channelName.trim();
    if (!name) {
      setChannelError("Hãy nhập tên kênh bán.");
      return;
    }
    if (!isValidCode(code)) {
      setChannelError(
        "Mã kênh chỉ gồm chữ thường, số và dấu gạch ngang, ví dụ: traveloka.",
      );
      return;
    }
    setChannelSaving(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("channels").insert({
      account_id: accountId,
      hotel_id: hotel.id,
      code,
      name,
    });
    setChannelSaving(false);
    if (insertError) {
      if (insertError.code === "23505") {
        setChannelError("Mã kênh này đã có trong khách sạn, hãy đổi mã khác.");
      } else {
        setChannelError("Thêm kênh bán không thành công.");
      }
      return;
    }
    setChannelOk(`Đã thêm kênh bán ${name}.`);
    setChannelCode("");
    setChannelName("");
    await refresh();
  }

  async function addPlan(e: React.FormEvent) {
    e.preventDefault();
    setPlanError("");
    setPlanOk("");
    if (!hotel) return;
    const channelId = planChannelId || channels[0]?.id || "";
    const name = planName.trim();
    if (!channelId) {
      setPlanError("Hãy thêm kênh bán trước rồi mới thêm gói giá.");
      return;
    }
    if (!name) {
      setPlanError("Hãy nhập tên gói giá.");
      return;
    }
    setPlanSaving(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("rate_plans").insert({
      account_id: accountId,
      hotel_id: hotel.id,
      channel_id: channelId,
      name,
    });
    setPlanSaving(false);
    if (insertError) {
      if (insertError.code === "23505") {
        setPlanError("Tên gói này đã có trong kênh, hãy đổi tên khác.");
      } else {
        setPlanError("Thêm gói giá không thành công.");
      }
      return;
    }
    setPlanOk(`Đã thêm gói giá ${name}.`);
    setPlanName("");
    await refresh();
  }

  const effectivePlanChannelId = planChannelId || channels[0]?.id || "";

  return (
    <Shell title="Kênh bán">
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
            Khách sạn: {hotel.name} · /{hotel.slug} · Mỗi kênh bán có gói
            giá riêng, set giá độc lập. Giá theo ngày nhập ở trang Lịch
            giá sau.
          </p>

          {/* Danh sach kenh + goi gia */}
          <div className="mt-6 space-y-6">
            {channels.length === 0 && (
              <p className="text-sm text-[#6b7480]">Chưa có kênh bán.</p>
            )}
            {channels.map((c) => {
              const channelPlans = plans.filter(
                (p) => p.channel_id === c.id,
              );
              return (
                <Card key={c.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-semibold text-[#1f1f1f]">
                        {c.name}
                      </div>
                      <div className="mt-1 text-sm text-[#6b7480]">
                        Mã kênh: {c.code}
                      </div>
                    </div>
                    <Badge tone={c.is_active ? "green" : "red"}>
                      {c.is_active ? "Đang bán" : "Tạm dừng"}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2">
                    {channelPlans.length === 0 && (
                      <p className="text-sm text-[#6b7480]">
                        Chưa có gói giá trong kênh này.
                      </p>
                    )}
                    {channelPlans.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-4 border-b border-[#eef2f7] pb-2 last:border-b-0 last:pb-0"
                      >
                        <span className="text-sm text-[#1f1f1f]">
                          {p.name}
                        </span>
                        <Badge tone={p.is_active ? "green" : "red"}>
                          {p.is_active ? "Đang bán" : "Tạm dừng"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          {isAdmin ? (
            <>
              {/* Form them kenh */}
              <Card className="mt-6">
                <h2 className="text-lg font-bold text-[#1f1f1f]">
                  Thêm kênh bán
                </h2>
                {channelError && (
                  <ErrorBox message={channelError} className="mt-4" />
                )}
                {channelOk && (
                  <SuccessBox message={channelOk} className="mt-4" />
                )}
                <form onSubmit={addChannel} className="mt-4 space-y-4">
                  <Field
                    id="channel-name"
                    label="Tên kênh bán"
                    value={channelName}
                    onChange={setChannelName}
                    placeholder="Ví dụ: Traveloka"
                  />
                  <Field
                    id="channel-code"
                    label="Mã kênh"
                    value={channelCode}
                    onChange={setChannelCode}
                    placeholder="Ví dụ: traveloka"
                  />
                  <p className="-mt-2 text-xs text-[#6b7480]">
                    Chỉ gồm chữ thường, số và dấu gạch ngang.
                  </p>
                  <PrimaryButton disabled={channelSaving}>
                    {channelSaving ? "Đang thêm..." : "Thêm kênh bán"}
                  </PrimaryButton>
                </form>
              </Card>

              {/* Form them goi gia */}
              <Card className="mt-6">
                <h2 className="text-lg font-bold text-[#1f1f1f]">
                  Thêm gói giá
                </h2>
                {planError && (
                  <ErrorBox message={planError} className="mt-4" />
                )}
                {planOk && <SuccessBox message={planOk} className="mt-4" />}
                <form onSubmit={addPlan} className="mt-4 space-y-4">
                  <SelectField
                    id="plan-channel"
                    label="Kênh bán"
                    value={effectivePlanChannelId}
                    onChange={setPlanChannelId}
                    options={channels.map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                  />
                  <Field
                    id="plan-name"
                    label="Tên gói giá"
                    value={planName}
                    onChange={setPlanName}
                    placeholder="Ví dụ: BAR"
                  />
                  <PrimaryButton disabled={planSaving}>
                    {planSaving ? "Đang thêm..." : "Thêm gói giá"}
                  </PrimaryButton>
                </form>
              </Card>
            </>
          ) : (
            <p className="mt-5 text-sm leading-relaxed text-[#6b7480]">
              Chỉ quản trị viên thêm được kênh bán và gói giá.
            </p>
          )}
        </>
      )}
    </Shell>
  );
}

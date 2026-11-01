"use client";

// ============================================================
// TRANG CHU SAU DANG NHAP, BAN DUNG HELPER HO SO — app/page.tsx
// (du an moi city-house-pms; giao lan 3, ten File-NEW13b,
//  GHI DE file app/page.tsx cua File-NEW06 / File-NEW13.
//  Neu chua dan File-NEW13 thi khoi dan no, dan thang ban nay.)
//
// Noi dung hien thi giong het File-NEW13 (loi chao theo ten,
// vai tro, ten tai khoan, email), chi khac phan doc du lieu:
//   - Dung helper dung chung getCurrentProfile() tu
//     lib/supabase/profile.ts (File-NEW23) thay cho doan tu
//     viet lai chuyen lay phien + doc user_profiles.
//   - Ham load boc bang useCallback va khai du phu thuoc
//     (bai hoc vach vang o File-NEW12b).
// Can co File-NEW11 (components/Shell.tsx) va File-NEW23
// (lib/supabase/profile.ts) thi trang nay moi chay duoc.
//
// MOT DOI KHA Nho SO VOI File-NEW13 (co chu dich, theo quy
// tac fail-closed da chot): truoc day khong co ho so thi
// trang bao loi; bay gio helper tra ve vai tro 'staff' nen
// trang van hien loi chao (ten "ban", vai tro Nhan vien) thay
// vi bao loi — giong cach khung Shell van xu ly khi thieu
// ho so, va khong bao gio mac dinh admin khi thieu du lieu.
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCurrentProfile } from "@/lib/supabase/profile";
import Shell from "@/components/Shell";

function roleLabel(role: "admin" | "staff"): string {
  return role === "admin" ? "Quản trị viên" : "Nhân viên";
}

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [accountName, setAccountName] = useState("");

  const load = useCallback(async () => {
    const profile = await getCurrentProfile();
    if (!profile) {
      router.replace("/login");
      return;
    }
    setDisplayName(profile.displayName);
    setRole(profile.role);

    // Email + ten tai khoan: van doc truc tiep vi helper chi
    // tra ho so (khong co email, khong co ten tai khoan).
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    setEmail(userData.user?.email ?? "");

    // Ten tai khoan cua minh (RLS chi cho doc dong cua minh,
    // khong can truyen ma tai khoan).
    const { data: accountData } = await supabase
      .from("accounts")
      .select("name")
      .single();
    if (accountData) setAccountName(accountData.name ?? "");
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Shell title="Trang chủ">
        {loading && <p className="text-sm text-[#6b7480]">Đang tải...</p>}

        {!loading && (
          <>
            <h1 className="text-2xl font-bold text-[#1f1f1f]">
              Xin chào, {displayName ?? "bạn"}
            </h1>
            <p className="mt-1.5 text-sm text-[#6b7480]">
              Vai trò: {roleLabel(role)}
              {accountName ? ` • Tài khoản: ${accountName}` : ""}
            </p>

            <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
              <h2 className="text-base font-bold text-[#1f1f1f]">
                Tài khoản của bạn
              </h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-[#eef2f7] pb-3">
                  <span className="text-[#6b7480]">Tên hiển thị</span>
                  <span className="font-medium text-[#1f1f1f]">
                    {displayName ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-b border-[#eef2f7] pb-3">
                  <span className="text-[#6b7480]">Email</span>
                  <span className="font-medium text-[#1f1f1f]">{email}</span>
                </div>
                <div className="flex justify-between gap-4 border-b border-[#eef2f7] pb-3">
                  <span className="text-[#6b7480]">Vai trò</span>
                  <span className="font-medium text-[#1f1f1f]">
                    {roleLabel(role)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#6b7480]">Tài khoản</span>
                  <span className="font-medium text-[#1f1f1f]">
                    {accountName || "—"}
                  </span>
                </div>
              </div>
            </section>

            <p className="mt-5 text-sm leading-relaxed text-[#6b7480]">
              Các mục như phòng và đặt phòng sẽ được thêm ở bước sau.
            </p>
          </>
        )}
    </Shell>
  );
}

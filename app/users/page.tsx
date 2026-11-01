"use client";

// ============================================================
// TRANG QUAN LY NGUOI DUNG, BAN NAM TRONG KHUNG — app/users/page.tsx
// (du an moi city-house-pms; giao lan 3, ten File-NEW16b,
//  GHI DE file app/users/page.tsx cua File-NEW16.
//
//  CHI KHAC NEW16 O PHAN DOC HO SO (giao dien + doi vai tro
//  giu nguyen): doan tu lay phien + doc user_profiles de biet
//  vai tro doi thanh helper dung chung getCurrentProfile()
//  tu lib/supabase/profile.ts (File-NEW23), giong trang chu
//  File-NEW13b. Can co File-NEW23 thi trang nay moi chay duoc.
//  Hanh vi giu nguyen: chua dang nhap thi ve /login; khong
//  phai admin (ke ca chua co ho so) thi thay dong khong co
//  quyen; admin doi vai tro, khong tu doi vai tro cua minh.
//  GHI DE file app/users/page.tsx cua File-NEW07 — neu ban
//  chua dan NEW07 thi tao moi thu muc app/users/ roi dat
//  file nay vao do)
//
// Noi dung giong het File-NEW07 (chi admin xem va doi duoc
// vai tro; admin khong tu doi vai tro cua chinh minh; nhan
// vien chi thay dong khong co quyen; email khong hien vi
// nam trong Supabase Auth), chi khac:
// - Bo thanh navy rieng, nut Dang xuat va nut Ve trang chu
//   (khung Shell da co aside + nut Dang xuat).
// - Nam trong khung chung Shell, the trang va hop bao loi
//   dung bo thanh phan chung ui.tsx (File-NEW15).
// Can co File-NEW11 (components/Shell.tsx) va File-NEW15
// (components/ui.tsx) thi trang nay moi chay duoc.
// Lop chan o may chu cho /users nam o middleware (File-NEW03b).
// ============================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getCurrentProfile } from "@/lib/supabase/profile";
import Shell from "@/components/Shell";
import { Card, ErrorBox } from "@/components/ui";

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  role: string | null;
};

function roleLabel(role: string | null): string {
  if (role === "admin") return "Quản trị viên";
  if (role === "staff") return "Nhân viên";
  return "Chưa rõ vai trò";
}

export default function UsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState("");
  const [myId, setMyId] = useState("");
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [savingId, setSavingId] = useState("");

  useEffect(() => {
    async function load() {
      // Ho so cua chinh minh qua helper dung chung: vai tro +
      // ma tai khoan. Chua dang nhap thi helper tra null.
      const profile = await getCurrentProfile();
      if (!profile) {
        router.replace("/login");
        return;
      }
      setMyId(profile.userId);

      // Khong phai admin (ke ca chua co ho so, helper mac dinh
      // staff) thi chi thay dong khong co quyen.
      if (profile.role !== "admin" || !profile.accountId) {
        setForbidden(true);
        setLoading(false);
        return;
      }

      // Danh sach nguoi trong cung tai khoan (RLS chi cho admin
      // doc ho so trong tai khoan cua minh).
      const supabase = createClient();
      const { data: list, error: listError } = await supabase
        .from("user_profiles")
        .select("user_id, display_name, role")
        .eq("account_id", profile.accountId)
        .order("created_at", { ascending: true });
      if (listError || !list) {
        setError("Không đọc được danh sách người dùng.");
        setLoading(false);
        return;
      }
      setRows(
        list.map((r) => ({
          user_id: r.user_id,
          display_name: r.display_name ?? null,
          role: r.role ?? null,
        })),
      );
      setLoading(false);
    }
    load();
  }, [router]);

  async function changeRole(userId: string, newRole: string) {
    setError("");
    setSavingId(userId);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ role: newRole })
      .eq("user_id", userId);
    if (updateError) {
      setError("Đổi vai trò không thành công.");
      setSavingId("");
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r.user_id === userId ? { ...r, role: newRole } : r)),
    );
    setSavingId("");
  }

  return (
    <Shell title="Người dùng & vai trò">
        {loading && <p className="text-sm text-[#6b7480]">Đang tải...</p>}

        {!loading && forbidden && (
          <Card>
            <h1 className="text-xl font-bold text-[#1f1f1f]">
              Bạn không có quyền xem trang này
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#6b7480]">
              Trang quản lí người dùng chỉ dành cho quản trị viên.
            </p>
          </Card>
        )}

        {!loading && !forbidden && (
          <>
            <p className="mt-1.5 text-sm leading-relaxed text-[#6b7480]">
              Chỉ quản trị viên xem và đổi được vai trò. Bạn không tự đổi vai
              trò của chính mình.
            </p>

            {error && <ErrorBox message={error} className="mt-4" />}

            <Card className="mt-6">
              {rows.length === 0 ? (
                <p className="text-sm text-[#6b7480]">Chưa có người dùng.</p>
              ) : (
                <div className="space-y-3">
                  {rows.map((row) => {
                    const isMe = row.user_id === myId;
                    return (
                      <div
                        key={row.user_id}
                        className="flex items-center justify-between gap-4 border-b border-[#eef2f7] pb-3 last:border-b-0 last:pb-0"
                      >
                        <div>
                          <div className="text-sm font-semibold text-[#1f1f1f]">
                            {row.display_name ?? "—"}
                            {isMe && (
                              <span className="ml-2 text-xs font-normal text-[#6b7480]">
                                (Bạn)
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-[#6b7480]">
                            {roleLabel(row.role)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {savingId === row.user_id && (
                            <span className="text-xs text-[#6b7480]">
                              Đang lưu...
                            </span>
                          )}
                          <select
                            aria-label={`Vai trò của ${row.display_name ?? "người dùng"}`}
                            value={row.role ?? "staff"}
                            disabled={isMe || savingId === row.user_id}
                            onChange={(e) =>
                              changeRole(row.user_id, e.target.value)
                            }
                            className="rounded-lg border border-[#dbe2ea] bg-white px-2 py-2 text-sm text-[#1f1f1f] outline-none disabled:opacity-50"
                          >
                            <option value="admin">Quản trị viên</option>
                            <option value="staff">Nhân viên</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <p className="mt-5 text-sm leading-relaxed text-[#6b7480]">
              Tạo tài khoản mới vẫn làm trong Supabase (Authentication →
              Users → Add user), rồi gắn hồ sơ bằng câu insert như lúc tạo
              tài khoản staff. Trang này chỉ xem và đổi vai trò.
            </p>
          </>
        )}
    </Shell>
  );
}

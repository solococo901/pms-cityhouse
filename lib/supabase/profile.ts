// ============================================================
// lib/supabase/profile.ts — DOC HO SO NGUOI DUNG DUNG CHUNG
// (FILE MOI — dat thanh lib/supabase/profile.ts, canh file
// client.ts. Cac trang hien tai van chay binh thuong khi chua
// doi sang dung file nay; doi tung trang o cac luot sau.)
//
// VAN DE FILE NAY GIAI QUYET:
//   Hien moi trang tu viet lai doan lay phien dang nhap +
//   doc ho so (user_profiles) de biet tai khoan + vai tro.
//   Lap lai nhieu cho de lech nhau: cho nay quen thi cho kia
//   mac dinh sai. Gom ve mot cho: trang sau chi goi mot dong
//   la co san tai khoan va vai tro, cach xu ly giong nhau.
//
// QUY TAC AN TOAN (fail-closed — mac dinh quyen thap nhat):
//   - Chua dang nhap -> tra ve null (trang tu quyet dinh
//     dua ve /login, middleware da chan san o may chu).
//   - Da dang nhap nhung KHONG CO ho so -> tra ve vai tro
//     'staff', khong co account_id. Khong bao gio mac dinh
//     admin khi thieu du lieu (loi cu cua du an cu).
//   - Chi doc, khong sua gi trong database.
//
// CACH DUNG TRONG TRANG (1 dong):
//   import { getCurrentProfile } from "@/lib/supabase/profile";
//   const profile = await getCurrentProfile();
//   if (!profile) { /* chua dang nhap */ }
//   const isAdmin = profile.role === "admin";
// ============================================================

import { createClient } from "@/lib/supabase/client";

export type Profile = {
  userId: string;
  // Ma tai khoan (ben mua license). Null khi chua co ho so.
  accountId: string | null;
  // Vai tro: 'admin' hoac 'staff'. Mac dinh 'staff' khi thieu ho so.
  role: "admin" | "staff";
  displayName: string | null;
};

// Doc ho so cua nguoi dang dang nhap. Tra ve null neu chua
// dang nhap; tra ve profile vai tro 'staff' neu chua co ho so.
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("user_id, account_id, role, display_name")
    .eq("user_id", user.id)
    .single();

  // Khong co ho so: van tra ve dang dung duoc, vai tro thap nhat.
  if (!profile) {
    return {
      userId: user.id,
      accountId: null,
      role: "staff",
      displayName: null,
    };
  }

  return {
    userId: profile.user_id,
    accountId: profile.account_id,
    role: profile.role === "admin" ? "admin" : "staff",
    displayName: profile.display_name,
  };
}

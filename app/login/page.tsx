"use client";

// ============================================================
// TRANG DANG NHAP, BAN LAM DEP — app/login/page.tsx
// (du an moi city-house-pms; giao lan 2, ten File-NEW02b,
//  GHI DE len ban NEW02 cu o cung duong dan app/login/page.tsx)
//
// Chi doi VE NGOAI theo style Cloudbeds (nen sang xam-xanh,
// the trang bo goc lon, bong mem, o nhap va nut cao hon,
// logo CITYHOUSE mau navy tren nen trang thay cho dai navy
// dac kin). LOGIC GIU NGUYEN 100% so voi ban NEW02:
// dang nhap email + mat khau qua Supabase Auth, dang nhap
// xong ve trang chu, da co phien thi tu chuyen khoi /login.
//
// BAO MAT (ghi nho khi doc code):
// - Khong co nut "Dang ky": tai khoan chi do quan tri vien tao
//   trong Supabase Authentication, khong cho nguoi la tu tao.
// - Bao loi chung chung, khong noi ro la sai email hay sai mat
//   khau, de ke xau khong doan duoc email nao co that.
// - Dong "Quen mat khau? Lien he quan tri vien." chi la CHU
//   THONG BAO, khong phai nut bam, vi chuc nang quen mat khau
//   chua co — khong lam nut chet.
// - Mat khau khong bao gio ghi vao code, chi goi qua ham
//   signInWithPassword cua Supabase.
// ============================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Neu da dang nhap roi thi khong can o lai trang login nua.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setError("Đăng nhập không thành công — kiểm tra lại email và mật khẩu.");
      setBusy(false);
      return;
    }
    router.replace("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#e6ecf4] via-[#eef2f7] to-[#f7f8fa] p-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={submit}
          className="w-full rounded-3xl bg-white shadow-xl shadow-slate-300/40 ring-1 ring-slate-900/5"
        >
          {/* Logo tren nen trang + duong nhan navy mong */}
          <div className="px-8 pt-8">
            <div className="text-[22px] font-extrabold tracking-wide text-[#1b2b45]">
              CITYHOUSE
            </div>
            <div className="mt-1 text-sm text-[#6b7480]">
              cityhousePMS — Quản lí khách sạn
            </div>
            <div className="mt-4 h-1 w-12 rounded-full bg-[#1f3a5f]" />
          </div>

          <div className="px-8 pb-8 pt-6">
            <h1 className="text-2xl font-bold text-[#1f1f1f]">Đăng nhập</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-[#6b7480]">
              Dùng email và mật khẩu nhân viên của bạn để vào hệ thống.
            </p>

            <label
              htmlFor="login-email"
              className="mt-6 block text-sm font-semibold text-[#475569]"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@cityhouse.example"
              className="mt-2 h-12 w-full rounded-xl border border-[#dbe2ea] bg-white px-4 text-sm text-[#1f1f1f] outline-none transition focus:border-[#1f3a5f] focus:ring-4 focus:ring-[#1f3a5f]/15"
            />

            <label
              htmlFor="login-password"
              className="mt-5 block text-sm font-semibold text-[#475569]"
            >
              Mật khẩu
            </label>
            <div className="relative mt-2">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 w-full rounded-xl border border-[#dbe2ea] bg-white px-4 pr-16 text-sm text-[#1f1f1f] outline-none transition focus:border-[#1f3a5f] focus:ring-4 focus:ring-[#1f3a5f]/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-xs font-semibold text-[#1f3a5f]"
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-[#fdecec] px-4 py-3 text-sm text-[#e5484d]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-6 h-12 w-full rounded-xl bg-[#1f3a5f] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1b2b45] disabled:opacity-60"
            >
              {busy ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            <p className="mt-4 text-center text-xs leading-relaxed text-[#6b7480]">
              Tài khoản do quản trị viên cấp. Quên mật khẩu? Liên hệ quản trị
              viên.
            </p>
          </div>
        </form>

        <p className="mt-5 text-center text-xs text-[#94a3b8]">
          Dành cho nhân viên CityHouse
        </p>
      </div>
    </div>
  );
}

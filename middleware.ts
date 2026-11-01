// ============================================================
// middleware.ts — KHOA CUA O PHIA MAY CHU (dat o goc du an,
// NGANG HANG voi package.json, KHONG nam trong thu muc app/)
// Moi lan trinh duyet xin mot trang, file nay chay TRUOC khi
// trang duoc ve. No kiem tra phien dang nhap that (qua may chu
// Supabase), chu khong chi tin giao dien nhu du an cu.
//
// LUAT (don gian, mac dinh khoa chat nhat):
// - Chua dang nhap ma vao trang nao khac /login -> ve /login.
// - Da dang nhap ma mo /login -> ve trang chu.
// - Vao trang chi danh cho admin ma vai tro khong phai admin
//   -> ve trang chu. Chua co ho so (profile) thi tinh la staff
//   (quyen thap nhat), khong tu dong thanh admin nhu du an cu.
// - Danh sach ADMIN_PATHS hien co /users (trang quan ly nguoi
//   dung, giao o File-NEW07). Khi nao lam toi trang admin nao
//   thi them duong dan cua no vao day.
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Trang ai cung mo duoc ma khong can dang nhap.
const PUBLIC_PATHS = ["/login"];

// Trang chi admin duoc vao. /users la trang dau tien.
// Them dan khi co trang moi.
const ADMIN_PATHS: string[] = ["/users"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isAdminPath(pathname: string) {
  return ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Chua co key trong .env.local thi khong xac minh duoc ai ca:
  // cho mo /login de thay trang, con trang khac thi ve /login.
  // Day la khoa chat (fail-closed), khong phai mo cua cho qua.
  if (!url || !anonKey) {
    if (isPublic(pathname)) return supabaseResponse;
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser() goi len may chu Supabase de xac minh that, khong
  // chi doc cookie o trinh duyet (cookie co the bi gia mao).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isPublic(pathname)) return supabaseResponse;
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublic(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAdminPath(pathname)) {
    // Doc vai tro tu ho so cua chinh nguoi nay. Neu khong doc
    // duoc (chua co ho so, hoac luat RLS chua cho phep) thi tinh
    // la staff — quyen thap nhat, khong tu dong len admin.
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}

// Chi chay middleware cho trang, bo qua file tinh (anh, css,
// js cua Next.js) de khoi cham.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

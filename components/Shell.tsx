"use client";

// ============================================================
// KHUNG CHUNG, I HET BAN CU — components/Shell.tsx
// (du an moi city-house-pms; giao lan 4, ten File-NEW11d,
//  GHI DE file components/Shell.tsx cua File-NEW11c.
//
//  CHI KHAC NEW11c DUNG 1 CHO: the <a> chuyen thanh <Link>
//  cua Next.js (o khoi logo va o muc menu). Ly do: Next.js
//  cam dung the <a> de chuyen trang trong app (quy tac
//  @next/next/no-html-link-for-pages) nen VS Code gach do.
//  Link van hien ra the <a> o trinh duyet nen giao dien va
//  cach bam khong doi gi.
//
// Khung nay lay dung kieu ban cu (pms-ui/app/layout.tsx):
// aside w-60 nen trang vien #dde3ea, khoi logo o vuong xanh
// + 2 dong chu, menu 4 nhom co tieu de + icon net don,
// muc dang mo nen #e8effe + chu #2563eb + vach xanh 3px mep
// trai, thanh tren co o chon khach san + o tim kiem dang
// vien thuoc + nut "+" tron xanh + chuong co cham do,
// phan chinh nen #eef1f5, chu #17293e, phong Segoe UI.
// Chi khac ban cu o nhung cho buoc phai khac:
// - Shell dat trong tung trang (khong sua file goc cua
//   Next.js) nen cach dung khong doi: <Shell title="...">.
//   Thanh tren theo ban cu KHONG hien ten trang, nen title
//   van nhan cho cac trang khoi sua nhung khong hien ra.
// - Duong dan theo du an moi: khu lam viec /<slug>/...,
//   trang chu tong quan la /<slug> (ban cu la /<slug>/dashboard),
//   o chon khach san dua ve /<slug> (trang Tong quan NEW21).
// - Khoi logo giu dung kieu ban cu (o vuong xanh + 2 dong),
//   chi doi chu thanh CITYHOUSE / cityhousePMS cho dung ten
//   san pham moi (ban cu ghi PMS Hotel).
// - Muc menu chi hien trang that da xong (khong link chet):
//   4 nhom ban cu nhung hien tai chi co Trang chu, Tong quan,
//   Loai phong & Phong, Khach san, Nguoi dung & vai tro.
//   Cac muc con lai tu hien khi trang cua chung xong.
// - Quyen xem giu theo du an moi: staff van xem duoc Loai
//   phong & Phong (chi khong them/sua), khong giong ban cu
//   chan han muc nay; buoc phan quyen sau layout se khoa not.
// - O tim kiem, nut "+" va chuong giu dung nhu ban cu (chi
//   la hinh thuc, chua gan chuc nang — chuc nang tim, tao
//   don, thong bao lam khi toi trang cua chung).
// - Khong co ChannexOutbox va AuthGate cua ban cu (du an moi
//   chua co Channex; chan dang nhap do middleware lo).
// ============================================================

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type MenuItem = {
  label: string;
  href: string;
  icon: string;
  group: string;
  adminOnly?: boolean;
  workspaceOnly?: boolean;
};

// Nhom theo dung thu tu ban cu.
const MENU_GROUPS = ["Vận hành", "Bán phòng", "Thông tin khách sạn", "Quản lí"];

const MENU: MenuItem[] = [
  { label: "Trang chủ", href: "/", icon: "dashboard", group: "Vận hành" },
  {
    label: "Tổng quan",
    href: "__WORKSPACE__",
    icon: "dashboard",
    group: "Vận hành",
    workspaceOnly: true,
  },
  {
    label: "Loại phòng & Phòng",
    href: "__WORKSPACE__/room-types",
    icon: "bed",
    group: "Thông tin khách sạn",
    workspaceOnly: true,
  },
  { label: "Khách sạn", href: "/hotels", icon: "hotel", group: "Quản lí" },
  {
    label: "Người dùng & vai trò",
    href: "/users",
    icon: "users",
    group: "Quản lí",
    adminOnly: true,
  },
];

// Icon net don (stroke) dung bo cua ban cu, them icon users vi
// ban cu khong co trang nguoi dung (net ve cung kieu feather).
const ICONS: Record<string, string> = {
  dashboard: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  hotel: "M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6M9 11h.01M15 11h.01",
  bed: "M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 18h18M5 21v-3M19 21v-3",
  users:
    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 1 0 0 7.75",
};
function MenuIcon({ name }: { name: string }) {
  return (
    <svg
      className="h-[18px] w-[18px] shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name] ?? ICONS.dashboard} />
    </svg>
  );
}

type HotelOption = {
  id: string;
  name: string;
  slug: string;
};

// Duong dan tinh cua he thong — khong phai slug khach san.
const RESERVED_SEGMENTS = ["login", "hotels", "users", "booking"];

export default function Shell({
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("...");
  const [role, setRole] = useState<string | null>(null);
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  // Nhom mac dinh mo het, dong/mo doc lap tung nhom (ban cu).
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(MENU_GROUPS),
  );

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) return;
      const { data: mine } = await supabase
        .from("user_profiles")
        .select("display_name, role")
        .eq("user_id", session.user.id)
        .single();
      if (mine) {
        setDisplayName(mine.display_name ?? session.user.email ?? "Người dùng");
        setRole(mine.role ?? "staff");
      } else {
        // Khong co ho so thi tinh la staff (fail-closed), de menu
        // van hien dung phan cua nhan vien thay vi trong tron.
        setDisplayName(session.user.email ?? "Người dùng");
        setRole("staff");
      }
      const { data: hotelList } = await supabase
        .from("hotels")
        .select("id, name, slug")
        .order("name", { ascending: true });
      setHotels(
        (hotelList ?? []).map((h) => ({
          id: h.id,
          name: h.name,
          slug: h.slug,
        })),
      );
    }
    load();
  }, []);

  function toggleGroup(group: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  // Slug khach san dang mo: doan dau duong dan, tru cac duong
  // dan tinh. Lay tu pathname (khong dung useParams o khung).
  const firstSegment = pathname.split("/").filter(Boolean)[0] ?? "";
  const workspaceSlug =
    firstSegment && !RESERVED_SEGMENTS.includes(firstSegment)
      ? firstSegment
      : null;

  // Ghep slug vao duong dan muc workspace; muc khong phai
  // workspace thi giu nguyen. Khong o trong khu lam viec thi
  // muc workspace bi an.
  const menuItems = MENU.map((item) => ({
    ...item,
    href: item.href.replace("__WORKSPACE__", `/${workspaceSlug ?? ""}`),
  })).filter((item) => !item.workspaceOnly || workspaceSlug !== null);
  // Loc muc chi danh cho admin (staff khong thay).
  const visibleMenu = menuItems.filter(
    (item) => !item.adminOnly || role === "admin",
  );

  // Ban cu dung startsWith; du an moi khong co duong dan con
  // duoi cac muc nay nen so khop chinh xac — neu khong, muc
  // Tong quan (/<slug>) se sang ca khi dang o trang con cua
  // khach san do.
  const isActive = (href: string) => pathname === href;

  function goToHotel(slug: string) {
    if (!slug) return;
    router.push(`/${slug}`);
  }

  const roleSub =
    role === "admin"
      ? "Quản trị viên"
      : role === "staff"
        ? "Nhân viên"
        : "Chưa gắn hồ sơ";

  return (
    <div
      className="flex min-h-screen bg-[#eef1f5] text-[#17293e]"
      style={{
        fontFamily:
          '"Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", sans-serif',
      }}
    >
      {/* ============ MENU TRAI (ban cu) ============ */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-[#dde3ea] bg-white">
        <Link
          href="/"
          title="Về danh sách khách sạn"
          className="flex items-center gap-2.5 border-b border-[#eef1f5] px-5 py-4"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563eb] text-base font-bold text-white">
            C
          </div>
          <div>
            <div className="text-[15px] font-bold leading-tight text-[#17293e]">
              CITYHOUSE
            </div>
            <div className="text-[11px] leading-tight text-[#68707a]">
              cityhousePMS
            </div>
          </div>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {role !== null &&
            MENU_GROUPS.map((group) => {
              const items = visibleMenu.filter((i) => i.group === group);
              if (items.length === 0) return null;
              const open = openGroups.has(group);
              return (
                <div key={group} className="mb-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#9aa3ad] hover:bg-[#f4f7fb]"
                  >
                    <span>{group}</span>
                    <svg
                      className={`h-4 w-4 shrink-0 transition-transform ${open ? "" : "rotate-180"}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M6 15l6-6 6 6" />
                    </svg>
                  </button>
                  {open && (
                    <div className="space-y-1">
                      {items.map((item) => {
                        const active = isActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className={
                              active
                                ? "relative flex items-center gap-3 rounded-lg bg-[#e8effe] px-3 py-2 text-sm font-semibold text-[#2563eb] before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-[#2563eb]"
                                : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#17293e] hover:bg-[#f4f7fb]"
                            }
                          >
                            <MenuIcon name={item.icon} />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </nav>

        {/* Khoi cuoi aside: nguoi dang nhap + Thoat (ban cu) */}
        <div className="flex items-center gap-3 border-t border-[#eef1f5] px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#17293e] text-sm font-semibold text-white">
            {(displayName || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 text-sm">
            <div className="truncate font-medium leading-tight">
              {displayName}
            </div>
            <div className="text-xs leading-tight text-[#68707a]">
              {role === null ? "" : roleSub}
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Đăng xuất"
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-[#68707a] hover:bg-[#f4f7fb] hover:text-[#e5484d]"
          >
            Thoát
          </button>
        </div>
      </aside>

      {/* ============ COT PHAI: thanh tren + noi dung ============ */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-[#dde3ea] bg-white px-6 py-3">
          <select
            aria-label="Chọn khách sạn"
            value={workspaceSlug ?? ""}
            onChange={(e) => goToHotel(e.target.value)}
            className="shrink-0 cursor-pointer rounded-lg border border-[#dde3ea] bg-white px-2 py-1.5 text-sm font-semibold text-[#17293e]"
            title="Đổi khách sạn"
          >
            <option value="">— Chọn khách sạn —</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.slug}>
                {h.name}
              </option>
            ))}
          </select>

          {/* O tim kiem dang vien thuoc, giua thanh tren (ban cu) */}
          <div className="flex flex-1 justify-center">
            <input
              className="w-full max-w-xl rounded-full border border-[#dde3ea] bg-white px-4 py-2 text-sm outline-none focus:border-[#2563eb]"
              placeholder="Tìm đặt phòng, khách, và hơn nữa..."
            />
          </div>

          {/* Nut "+" tron xanh (ban cu) */}
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2563eb] text-lg font-semibold leading-none text-white transition hover:bg-[#1e4fd8]"
            title="Tạo đặt phòng mới"
          >
            +
          </button>

          {/* Chuong co cham do (ban cu) */}
          <button
            type="button"
            className="relative shrink-0 text-xl"
            title="Thông báo"
          >
            🔔
            <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#e5484d]" />
          </button>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

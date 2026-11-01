// ============================================================
// lib/supabase/client.ts — DUONG DAY TU TRINH DUYET TOI DATABASE
// (BAN SUA LOI — thay cho File-NEW01, dich dan van la
// lib/supabase/client.ts trong du an, khong tao file ten khac)
//
// SUA O DAY: dua viec doc + kiem tra url/key VAO TRONG ham
// createClient(), thay vi kiem tra o ngoai ham roi dung bien
// o trong ham nhu ban cu.
//
// Ly do gach do o ban cu, noi don gian: TypeScript chi "nho"
// ket qua kiem tra trong cung mot ham. Ban cu kiem tra o ngoai
// ("neu rong thi dung lai"), roi vao trong ham no lai quen mat
// va van nghi bien co the rong (string | undefined) nen gach do
// o dong createBrowserClient(url, anonKey). Ban nay kiem tra va
// dung ngay trong ham nen het gach do.
//
// File nay dung cho phia trinh duyet (trang login, cac trang
// chay o phia nguoi dung). Moi trang dung chung ham createClient()
// o day, khong tu tao ket noi rieng, de dia chi + key chi nam
// o mot cho duy nhat. Sau nay middleware o phia may chu cung
// dung chung kieu ket noi nay qua cookie.
// ============================================================

import { createBrowserClient } from "@supabase/ssr";

// Moi lan goi la mot client moi cho phia trinh duyet.
// Key anon la key cong khai, dung de trinh duyet goi len —
// khoa that nam o luat RLS trong database, khong nam o key nay.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Thieu NEXT_PUBLIC_SUPABASE_URL hoac NEXT_PUBLIC_SUPABASE_ANON_KEY trong .env.local",
    );
  }

  return createBrowserClient(url, anonKey);
}

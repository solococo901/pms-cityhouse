"use client";

// ============================================================
// THANH PHAN GIAO DIEN DUNG CHUNG — components/ui.tsx
// (du an moi city-house-pms; giao lan 1, ten File-NEW15,
//  dat vao thu muc components/ ben canh Shell.tsx)
//
// Bo thanh phan nay gom lai nhung khoi giao dien lap lai o
// cac trang (the trang, o nhap, nut, hop bao loi...), lay
// kieu tu ban cu: the trang nen trang bo goc, o nhap va nut
// cao 48px, nut chinh xanh navy, chu phu xam. Moi trang sau
// nay dung chung bo nay thay vi viet lai class Tailwind,
// nen nhin dong bo va dev moi khong can doan mau.
//
// Cac mau trang trong ban layout da chot anh xa vao day:
// - Mau Danh sach: Card lam khung danh sach + Badge lam
//   nhan trang thai (vd phong dang ban / dang hong).
// - Mau Form: Field + SelectField + PrimaryButton, kem
//   ErrorBox / SuccessBox bao ket qua luu.
// - Mau Chi tiet co tab: lam o file Tabs rieng khi toi trang
//   chi tiet dau tien, de khoi co file nam cho khong ai dung.
//
// Cach dung (vi du trong 1 trang client):
//   import { Card, ErrorBox, Field, PrimaryButton } from "@/components/ui";
// ============================================================

import type { ReactNode } from "react";

// The trang: nen trang, bo goc lon, bong mem. Khoang cach
// voi khoi tren do trang chu goi truyen qua className.
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 ${className}`}
    >
      {children}
    </section>
  );
}

// Hop bao loi: nen do nhat, chu do.
export function ErrorBox({
  message,
  className = "",
}: {
  message: string;
  className?: string;
}) {
  return (
    <p
      className={`rounded-xl bg-[#fdecec] px-4 py-3 text-sm text-[#e5484d] ${className}`}
    >
      {message}
    </p>
  );
}

// Hop bao thanh cong: nen xanh la nhat, chu xanh dam.
export function SuccessBox({
  message,
  className = "",
}: {
  message: string;
  className?: string;
}) {
  return (
    <p
      className={`rounded-xl bg-[#e6f4ea] px-4 py-3 text-sm text-[#137333] ${className}`}
    >
      {message}
    </p>
  );
}

// O nhap 1 dong: nhan + o nhap cao 48px + ghi chu nho.
export function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-medium text-[#1f1f1f]"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 h-12 w-full rounded-xl border border-[#dbe2ea] px-4 text-sm text-[#1f1f1f] outline-none focus:border-[#1f3a5f]"
      />
      {hint && <p className="mt-1 text-xs text-[#6b7480]">{hint}</p>}
    </div>
  );
}

// O chon: nhan + danh sach chon cao 48px + ghi chu nho.
export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-medium text-[#1f1f1f]"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-12 w-full rounded-xl border border-[#dbe2ea] bg-white px-4 text-sm text-[#1f1f1f] outline-none focus:border-[#1f3a5f]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1 text-xs text-[#6b7480]">{hint}</p>}
    </div>
  );
}

// Nut chinh: nen xanh navy, chu trang, cao 48px.
export function PrimaryButton({
  children,
  disabled,
  type = "submit",
}: {
  children: ReactNode;
  disabled?: boolean;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="h-12 w-full rounded-xl bg-[#1f3a5f] text-sm font-semibold text-white transition hover:bg-[#16304f] disabled:opacity-50 sm:w-auto sm:px-6"
    >
      {children}
    </button>
  );
}

// Nhan trang thai nho dang vien thuoc.
const BADGE_STYLES: Record<string, string> = {
  green: "bg-[#e6f4ea] text-[#137333]",
  gray: "bg-[#eef2f7] text-[#5b6470]",
  red: "bg-[#fdecec] text-[#e5484d]",
};

export function Badge({
  tone,
  children,
}: {
  tone: "green" | "gray" | "red";
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}

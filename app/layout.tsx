import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import SeasonTheme from "@/components/season/SeasonTheme";

export const metadata: Metadata = {
  title: "카페로그 — 대전교육연수원 근처 카페 안내 게시판",
  description: "다녀온 근처 카페를 기록하고 공유하는 게시판",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="font-sans min-h-screen">
        <SeasonTheme />
        <header className="sticky top-0 z-10 border-b border-coffee-500/10 bg-cream-50/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-serif text-xl font-bold text-coffee-700">
              ☕ 카페로그
            </Link>
            <nav className="flex gap-2 text-sm">
              <Link href="/cafes" className="rounded-full px-4 py-2 font-semibold text-coffee-700 hover:bg-cream-100">
                카페 목록
              </Link>
              <Link href="/cafes/new" className="rounded-full bg-point px-4 py-2 font-semibold text-white hover:bg-point-dark">
                새 카페 등록
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 pb-20">{children}</main>
        <footer className="border-t border-coffee-500/10 py-6 text-center text-xs text-stone-500">
          카페로그 — 대전교육연수원 근처 카페 안내 게시판
        </footer>
      </body>
    </html>
  );
}

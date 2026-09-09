"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Stars, CafePlaceholder, Toast } from "@/components/ui/bits";

type Cafe = {
  id: string;
  name: string;
  address: string;
  travelTime: number;
  rating: number;
  description: string | null;
  hasImage: boolean;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
};

const PAGE_SIZE = 9;

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, current - 1, current, current + 1, total - 1, total]);
  const sorted = Array.from(pages).filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev !== 0 && p - prev > 1) result.push("ellipsis");
    result.push(p);
    prev = p;
  }
  return result;
}

export default function CafeListPage() {
  return (
      <Suspense fallback={<div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (<div key={i} className="card h-52 animate-pulse bg-cream-100" />))}</div>}>
      <CafeListInner />
    </Suspense>
  );
}

function CafeListInner() {
  const searchParams = useSearchParams();
  const toast = searchParams.get("toast");

  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [sort, setSort] = useState<"rating" | "latest" | "distance" | "reviews">("rating");
  const [view, setView] = useState<"gallery" | "list">("gallery");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(toast);
  const [picking, setPicking] = useState(false);
  const lastPickRef = useRef<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [sort]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ sort, page: String(page), pageSize: String(PAGE_SIZE) });
      if (debouncedQ) params.set("q", debouncedQ);
      const res = await fetch(`/api/cafes?${params.toString()}`);
      const contentType = res.headers.get("content-type") ?? "";
      let json: { cafes?: Cafe[]; total?: number; totalPages?: number; error?: string } | null = null;
      if (contentType.includes("application/json")) {
        json = (await res.json().catch(() => null)) as { cafes?: Cafe[]; total?: number; totalPages?: number; error?: string } | null;
      }
      if (!res.ok) throw new Error(json?.error ?? `목록을 불러오지 못했습니다. (상태 ${res.status})`);
      if (!json || !Array.isArray(json.cafes)) throw new Error("목록을 불러오지 못했습니다.");
      setCafes(json.cafes);
      setTotal(typeof json.total === "number" ? json.total : json.cafes.length);
      setTotalPages(Math.max(1, typeof json.totalPages === "number" ? json.totalPages : 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cafelog-list-view");
      if (saved === "gallery" || saved === "list") setView(saved);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cafelog-list-view", view);
    } catch {
      return;
    }
  }, [view]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const pickRandom = useCallback(async () => {
    if (picking) return;
    setPicking(true);
    try {
      const params = new URLSearchParams({ sort, page: "1", pageSize: "1000" });
      const res = await fetch(`/api/cafes?${params.toString()}`);
      const json = await res.json().catch(() => null);
      const list: Cafe[] = Array.isArray(json?.cafes) ? json.cafes : cafes;
      if (list.length === 0) return;
      const pool = list.length > 1 ? list.filter((c) => c.id !== lastPickRef.current) : list;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      lastPickRef.current = pick.id;
      setPage(1);
      setQ(pick.name);
      setDebouncedQ(pick.name.trim());
    } finally {
      setPicking(false);
    }
  }, [sort, cafes, picking]);

  const goToPage = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(1, next), totalPages);
      if (clamped === page) return;
      setPage(clamped);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [page, totalPages]
  );

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-auto">
          <h1 className="font-serif text-2xl font-bold text-coffee-900 md:text-3xl">카페 목록</h1>
          <p className="mt-1 text-sm text-stone-500">
            등록된 카페 {total}곳{totalPages > 1 ? ` · ${page}/${totalPages}페이지` : ""}
          </p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="카페명 또는 주소로 검색"
          className="input min-w-[140px] flex-1 sm:max-w-xs"
          aria-label="카페 검색"
        />
        <button
          type="button"
            onClick={pickRandom}
          disabled={total === 0 || picking}
          title="등록된 카페 중 랜덤으로 골라 검색합니다"
          className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-coffee-500/20 bg-white px-5 py-2.5 text-sm font-bold text-coffee-700 transition perspective-400 hover:-translate-y-0.5 hover:border-point/50 hover:bg-cream-100 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="dice-3d text-point group-hover:[animation-duration:0.7s]">
            <rect x="1.5" y="1.5" width="13" height="13" rx="3" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="5.5" cy="5.5" r="1.3" fill="currentColor" />
            <circle cx="10.5" cy="5.5" r="1.3" fill="currentColor" />
            <circle cx="5.5" cy="10.5" r="1.3" fill="currentColor" />
            <circle cx="10.5" cy="10.5" r="1.3" fill="currentColor" />
          </svg>
          오늘 어디갈까?(랜덤)
        </button>
        <select value={sort} onChange={(e) => setSort(e.target.value as "rating" | "latest" | "distance" | "reviews")} className="input w-auto" aria-label="정렬">
          <option value="rating">추천도 높은 순</option>
          <option value="reviews">리뷰 많은 순</option>
          <option value="distance">이동거리 단거리순</option>
          <option value="latest">최신 등록 순</option>
        </select>
        <div className="inline-flex shrink-0 rounded-full border border-coffee-500/20 bg-white p-1" role="tablist" aria-label="보기 형태">
          <button
            type="button"
            role="tab"
            aria-selected={view === "gallery"}
            onClick={() => setView("gallery")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${view === "gallery" ? "bg-point text-white" : "text-coffee-700 hover:bg-cream-100"}`}
          >
            🖼️ 갤러리 보기
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "list"}
            onClick={() => setView("list")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${view === "list" ? "bg-point text-white" : "text-coffee-700 hover:bg-cream-100"}`}
          >
            📋 목록 보기
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="card h-52 animate-pulse bg-cream-100" />
          ))}
        </div>
      ) : error ? (
        <p className="card mt-6 p-6 text-center text-sm font-semibold text-red-600">{error}</p>
      ) : total === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <p className="text-3xl">☕</p>
          <p className="mt-2 font-semibold text-coffee-700">등록된 카페가 없습니다</p>
          <p className="mt-1 text-sm text-stone-500">첫 카페를 등록해보세요.</p>
          <Link href="/cafes/new" className="btn-primary mx-auto mt-4 !px-5 !py-2 text-xs">
            카페 등록하러 가기
          </Link>
        </div>
      ) : (
        <>
          {view === "gallery" ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cafes.map((c) => (
                <Link key={c.id} href={`/cafes/${c.id}`} className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-xl">
                  <div className="relative h-44 bg-cream-100">
                    {c.hasImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/cafes/${c.id}/image?v=${new Date(c.updatedAt).getTime()}`} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <CafePlaceholder />
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-serif text-lg font-bold text-coffee-900 group-hover:underline">{c.name}</h2>
                      <div className="flex shrink-0 flex-col items-end">
                        <Stars value={c.rating} size="sm" />
                        <span className="mt-1 text-xs font-bold text-coffee-700">리뷰({c.reviewCount}개)</span>
                      </div>
                    </div>
                    <p className="mt-1 truncate text-sm text-stone-500">{c.address}</p>
                    <p className="mt-2 text-xs font-semibold text-point">🚗 차로 {c.travelTime}분</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card mt-4 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-coffee-500/10 bg-cream-50 text-xs text-coffee-700">
                      <th scope="col" className="w-12 px-4 py-3 text-center font-bold">순번</th>
                      <th scope="col" className="w-36 px-4 py-3 text-left font-bold">카페명</th>
                      <th scope="col" className="w-28 px-4 py-3 text-center font-bold">소요시간</th>
                      <th scope="col" className="px-4 py-3 text-left font-bold">추천 이유</th>
                      <th scope="col" className="w-32 px-4 py-3 text-center font-bold">별점</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cafes.map((c, i) => (
                      <tr key={c.id} className="border-b border-coffee-500/10 last:border-0 transition hover:bg-cream-50">
                        <td className="px-4 py-3 text-center font-semibold text-stone-500">{(page - 1) * PAGE_SIZE + i + 1}</td>
                        <td className="max-w-36 px-4 py-3">
                          <Link href={`/cafes/${c.id}`} className="block truncate font-bold text-coffee-900 hover:text-point hover:underline" title={c.name}>
                            {c.name}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center font-semibold text-point">🚗 {c.travelTime}분</td>
                        <td className="max-w-xs px-4 py-3">
                          <span className="block truncate text-sm text-stone-500" title={c.description ?? ""}>
                            {c.description?.trim() ? c.description : "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center"><div className="flex flex-col items-center gap-0.5"><Stars value={c.rating} size="sm" /><span className="text-xs font-bold text-coffee-700">리뷰({c.reviewCount}개)</span></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {totalPages > 1 && (
            <nav aria-label="카페 목록 페이지" className="mt-8 flex items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                aria-label="이전 페이지"
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-coffee-500/20 bg-white px-2 text-sm font-bold text-coffee-700 transition hover:bg-cream-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
              >
                {"<"}
              </button>
              {getPageNumbers(page, totalPages).map((p, idx) =>
                p === "ellipsis" ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-sm font-bold text-stone-400" aria-hidden="true">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goToPage(p)}
                    aria-label={`${p}페이지`}
                    aria-current={p === page ? "page" : undefined}
                    className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-bold transition ${
                      p === page
                        ? "bg-point text-white shadow"
                        : "border border-coffee-500/20 bg-white text-coffee-700 hover:bg-cream-100"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                aria-label="다음 페이지"
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-coffee-500/20 bg-white px-2 text-sm font-bold text-coffee-700 transition hover:bg-cream-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
              >
                {">"}
              </button>
            </nav>
          )}
        </>
      )}
      <Toast message={toastMsg} />
    </div>
  );
}

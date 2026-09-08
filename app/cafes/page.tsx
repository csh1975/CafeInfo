"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
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
  createdAt: string;
  updatedAt: string;
};

export default function CafeListPage() {
  return (
      <Suspense fallback={<div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => (<div key={i} className="card h-52 animate-pulse bg-cream-100" />))}</div>}>
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
  const [sort, setSort] = useState<"rating" | "latest" | "distance">("rating");
  const [view, setView] = useState<"gallery" | "list">("gallery");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(toast);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ sort });
      if (debouncedQ) params.set("q", debouncedQ);
      const res = await fetch(`/api/cafes?${params.toString()}`);
      const contentType = res.headers.get("content-type") ?? "";
      let json: { cafes?: Cafe[]; error?: string } | null = null;
      if (contentType.includes("application/json")) {
        json = (await res.json().catch(() => null)) as { cafes?: Cafe[]; error?: string } | null;
      }
      if (!res.ok) throw new Error(json?.error ?? `목록을 불러오지 못했습니다. (상태 ${res.status})`);
      if (!json || !Array.isArray(json.cafes)) throw new Error("목록을 불러오지 못했습니다.");
      setCafes(json.cafes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, sort]);

  useEffect(() => {
    load();
  }, [load]);

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

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-auto">
          <h1 className="font-serif text-2xl font-bold text-coffee-900 md:text-3xl">카페 목록</h1>
          <p className="mt-1 text-sm text-stone-500">등록된 카페 {cafes.length}곳</p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="카페명 또는 주소로 검색"
          className="input min-w-[140px] flex-1 sm:max-w-xs"
          aria-label="카페 검색"
        />
        <select value={sort} onChange={(e) => setSort(e.target.value as "rating" | "latest" | "distance")} className="input w-auto" aria-label="정렬">
          <option value="rating">추천도 높은 순</option>
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
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card h-52 animate-pulse bg-cream-100" />
          ))}
        </div>
      ) : error ? (
        <p className="card mt-6 p-6 text-center text-sm font-semibold text-red-600">{error}</p>
      ) : cafes.length === 0 ? (
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
                      <Stars value={c.rating} size="sm" />
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
                        <td className="px-4 py-3 text-center font-semibold text-stone-500">{i + 1}</td>
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
                        <td className="px-4 py-3 text-center"><Stars value={c.rating} size="sm" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      <Toast message={toastMsg} />
    </div>
  );
}

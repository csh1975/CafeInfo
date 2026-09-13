"use client";

import { useState } from "react";

type Props = {
  cafeId: string;
  initialCount: number;
  size?: "sm" | "md" | "lg";
};

export default function LikeButton({ cafeId, initialCount, size = "sm" }: Props) {
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizeCls =
    size === "lg" ? "px-5 py-2.5 text-sm" : size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs";

  async function onLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    setError(null);
    setCount((c) => c + 1);
    try {
      const res = await fetch(`/api/cafes/${cafeId}/like`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "좋아요 처리에 실패했습니다.");
      if (typeof json.likeCount === "number") setCount(json.likeCount);
    } catch (err) {
      setCount((c) => c - 1);
      setError(err instanceof Error ? err.message : "좋아요 처리에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onLike}
        disabled={busy}
        aria-label={`좋아요 ${count}개, 공감하기`}
        className={`inline-flex items-center gap-1 rounded-full border border-coffee-500/20 bg-white font-bold text-coffee-700 transition hover:bg-cream-100 disabled:cursor-wait disabled:opacity-60 ${sizeCls}`}
      >
        <span aria-hidden="true">❤️</span>
        <span aria-live="polite">{count}</span>
      </button>
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
    </span>
  );
}

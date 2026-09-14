"use client";

import { useEffect, useState } from "react";

type Props = {
  cafeId: string;
  initialCount: number;
  size?: "sm" | "md" | "lg";
};

export default function LikeButton({ cafeId, initialCount, size = "sm" }: Props) {
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const [liked, setLiked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizeCls =
    size === "lg" ? "px-5 py-2.5 text-sm" : size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs";

  useEffect(() => {
    try {
      if (window.localStorage.getItem(`cafelog-liked:${cafeId}`) === "1") {
        setLiked(true);
      }
    } catch {
      return;
    }
  }, [cafeId]);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  async function onLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy || liked) return;
    setBusy(true);
    setError(null);
    setCount((c) => c + 1);
    try {
      const res = await fetch(`/api/cafes/${cafeId}/like`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (res.status === 409) {
        if (typeof json.likeCount === "number") setCount(json.likeCount);
        setLiked(true);
        try {
          window.localStorage.setItem(`cafelog-liked:${cafeId}`, "1");
        } catch {
          return;
        }
        setError(json.error ?? "이미 공감한 카페입니다.");
        return;
      }
      if (!res.ok) throw new Error(json.error ?? "좋아요 처리에 실패했습니다.");
      if (typeof json.likeCount === "number") setCount(json.likeCount);
      setLiked(true);
      try {
        window.localStorage.setItem(`cafelog-liked:${cafeId}`, "1");
      } catch {
        return;
      }
    } catch (err) {
      if (!liked) setCount((c) => c - 1);
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
        disabled={busy || liked}
        aria-label={liked ? `좋아요 ${count}개, 이미 공감함` : `좋아요 ${count}개, 공감하기`}
        aria-pressed={liked}
        className={`inline-flex items-center gap-1 rounded-full border font-bold transition disabled:cursor-not-allowed ${sizeCls} ${
          liked
            ? "border-point/40 bg-cream-100 text-point-dark"
            : "border-coffee-500/20 bg-white text-coffee-700 hover:bg-cream-100 disabled:cursor-wait disabled:opacity-60"
        }`}
      >
        <span aria-hidden="true">❤️</span>
        <span aria-live="polite">{count}</span>
      </button>
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
    </span>
  );
}

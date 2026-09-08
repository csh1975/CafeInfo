"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cafes/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "삭제에 실패했습니다.");
      router.push(`/cafes?toast=${encodeURIComponent("카페가 삭제되었습니다.")}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-full px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
        삭제
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="삭제 확인">
          <div className="card w-full max-w-sm p-6">
            <h2 className="font-serif text-lg font-bold text-coffee-900">정말 삭제하시겠습니까?</h2>
            <p className="mt-2 text-sm text-stone-600">“{name}” 카페 정보와 이미지가 함께 삭제됩니다.</p>
            {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
            <div className="mt-5 flex gap-2">
              <button onClick={doDelete} disabled={busy} className="flex-1 rounded-full bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">
                {busy ? "삭제 중..." : "삭제하기"}
              </button>
              <button onClick={() => setOpen(false)} className="btn-secondary flex-1">
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

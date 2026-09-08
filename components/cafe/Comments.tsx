"use client";

import { useCallback, useEffect, useState } from "react";

type Comment = {
  id: string;
  nickname: string;
  content: string;
  createdAt: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" });
}

export default function Comments({ cafeId }: { cafeId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cafes/${cafeId}/comments`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "댓글을 불러오지 못했습니다.");
      setComments(json.comments);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [cafeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cafes/${cafeId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, content, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "댓글 작성에 실패했습니다.");
      setComments((prev) => [...prev, json.comment]);
      setNickname("");
      setContent("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "댓글 작성에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (deleteBusy) return;
    setDeleteBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cafes/${cafeId}/comments/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "댓글 삭제에 실패했습니다.");
      setComments((prev) => prev.filter((c) => c.id !== id));
      setDeletingId(null);
      setDeletePassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "댓글 삭제에 실패했습니다.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <section aria-label="댓글" className="card mt-6 p-6 md:p-8">
      <h2 className="font-serif text-lg font-bold text-coffee-900">댓글 {comments.length}개</h2>

      {loading ? (
        <p className="mt-4 text-sm text-stone-500">댓글을 불러오는 중입니다…</p>
      ) : comments.length === 0 ? (
        <p className="mt-4 rounded-xl bg-cream-50 px-4 py-6 text-center text-sm text-stone-500">
          아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-coffee-500/10">
          {comments.map((c) => (
            <li key={c.id} className="py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-coffee-700">
                  {c.nickname} <span className="ml-1 text-xs font-normal text-stone-400">{formatDate(c.createdAt)}</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDeletingId(deletingId === c.id ? null : c.id);
                    setDeletePassword("");
                  }}
                  className="text-xs font-semibold text-stone-400 hover:text-red-600"
                >
                  삭제
                </button>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{c.content}</p>
              {deletingId === c.id && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="작성 시 비밀번호"
                    className="input !py-1.5 text-xs"
                    aria-label="삭제용 비밀번호"
                  />
                  <button
                    type="button"
                    disabled={deleteBusy}
                    onClick={() => onDelete(c.id)}
                    className="btn-secondary shrink-0 !px-4 !py-1.5 text-xs"
                  >
                    {deleteBusy ? "삭제 중…" : "확인"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onSubmit} className="mt-5 space-y-2 border-t border-coffee-500/10 pt-5">
        {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">{error}</p>}
        <div className="grid gap-2 md:grid-cols-2">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임 (비워두면 익명)"
            maxLength={20}
            className="input"
            aria-label="닉네임"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 (4자 이상, 삭제 시 필요)"
            maxLength={32}
            className="input"
            aria-label="비밀번호"
          />
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="따뜻한 댓글을 남겨주세요. (최대 500자)"
          rows={3}
          maxLength={500}
          className="input resize-none"
          aria-label="댓글 내용"
        />
        <div className="flex justify-end">
          <button type="submit" disabled={busy} className="btn-primary !px-5 !py-2 text-xs">
            {busy ? "등록 중…" : "댓글 등록"}
          </button>
        </div>
      </form>
    </section>
  );
}

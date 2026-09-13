# 공감(좋아요) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 카페 목록·상세에 ❤️ 좋아요 버튼과 개수를 표시하고 클릭마다 +1 증가시킨다.

**Architecture:** `Cafe.likeCount` 단일 컬럼에 `increment: 1` 원자 증가 API(`POST /api/cafes/[id]/like`)를 두고, 공용 `LikeButton` Client 컴포넌트로 목록/상세를 연결한다.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma 6 + SQLite/Turso(libSQL), Tailwind CSS

## Global Constraints

- 목록 API 응답에 이미지 바이너리를 포함하지 않는다.
- 썸네일은 `<img src="/api/cafes/{id}/image" />` 별도 스트리밍을 유지한다.
- 사용자에게 노출되는 문구는 모두 한국어로 작성한다.
- 별점(추천도)은 항상 1~5 정수만 허용한다.
- TypeScript에서 `any` 사용을 지양한다.
- 환경변수(`DATABASE_URL`, `DATABASE_AUTH_TOKEN`)를 코드에 하드코딩하지 않는다.

---

## File Structure

- Modify: `prisma/schema.prisma` — `Cafe`에 `likeCount Int @default(0)` 추가, 단일 책임은 스키마 정의.
- Modify: `app/api/cafes/route.ts` — 목록 `select` + `toListItem`에 `likeCount` 포함, 이미지 BLOB 제외 유지.
- Modify: `app/api/cafes/[id]/route.ts` — 단건 `select` + `toItem`에 `likeCount` 포함.
- Create: `app/api/cafes/[id]/like/route.ts` — `POST` 증가 전용, `{ likeCount: number }` 반환.
- Create: `components/cafe/LikeButton.tsx` — 낙관적 +1, 실패 롤백, 상세 이동 방지, 재사용 UI.
- Modify: `app/cafes/page.tsx` — `Cafe` 타입에 `likeCount` 추가, 갤러리/리스트에 `LikeButton` 배치.
- Modify: `app/cafes/[id]/page.tsx` — `select`에 `likeCount` 추가, 상세 버튼 배치.

---

### Task 1: DB 스키마 + 마이그레이션 (로컬 + Turso)

**Files:**
- Modify: `prisma/schema.prisma`
- Test: 로컬 SQLite 조회 + Turso `db push` 결과

**Interfaces:**
- Consumes: 기존 `model Cafe` 정의
- Produces: `Cafe.likeCount: number` (이후 모든 API/UI task가 사용)

- [ ] **Step 1: 스키마에 컬럼 추가**

```prisma
model Cafe {
  id          String   @id @default(cuid())
  name        String
  address     String
  travelTime  Int
  rating      Int
  likeCount   Int      @default(0)
  image       Bytes?
  imageType   String?
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  comments    Comment[]
}
```

- [ ] **Step 2: 로컬 마이그레이션 생성**

Run: `npx prisma migrate dev --name add_like_count`
Expected: `prisma/migrations/<timestamp>_add_like_count/migration.sql` 생성, `dev.db`에 `likeCount` 적용

- [ ] **Step 3: Turso에 동일 스키마 적용**

Run: `npx prisma db push`
Expected: 종료 코드 0, Turso 테이블에 `likeCount INTEGER NOT NULL DEFAULT 0` 존재 (환경변수 `DATABASE_URL=libsql://...`, `DATABASE_AUTH_TOKEN` 사용, 값 하드코딩 금지)

- [ ] **Step 4: 기존 데이터 확인**

Run: `npx prisma generate` 후 목록 API 호출 또는 DB 조회로 기존 카페 `likeCount=0` 확인
Expected: 기존 행 모두 0, 신규 생성도 0

---

### Task 2: 좋아요 증가 API + 목록/단건 API 확장

**Files:**
- Create: `app/api/cafes/[id]/like/route.ts`
- Modify: `app/api/cafes/route.ts`
- Modify: `app/api/cafes/[id]/route.ts`
- Test: `curl`로 POST/GET 검증

**Interfaces:**
- Consumes: `Cafe.likeCount` (Task 1)
- Produces: `POST /api/cafes/[id]/like -> { likeCount: number }`, `GET /api/cafes`·`GET /api/cafes/[id]` 응답에 `likeCount: number` 포함

- [ ] **Step 1: 증가 라우트 생성**

```ts
// app/api/cafes/[id]/like/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const exists = await prisma.cafe.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "카페를 찾을 수 없습니다." }, { status: 404 });
    }
    const updated = await prisma.cafe.update({
      where: { id: params.id },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true },
    });
    return NextResponse.json({ likeCount: updated.likeCount });
  } catch (e) {
    console.error(`POST /api/cafes/${params.id}/like failed:`, e);
    return NextResponse.json({ error: "좋아요 처리에 실패했습니다." }, { status: 500 });
  }
}
```

- [ ] **Step 2: 목록 API select 확장**

```ts
// app/api/cafes/route.ts — findMany select에 추가
likeCount: true,
```

```ts
// toListItem 파라미터 타입에 추가
likeCount: number;
```

- [ ] **Step 3: 단건 API select 확장**

```ts
// app/api/cafes/[id]/route.ts — GET/PUT select + toItem 타입에 추가
likeCount: true,
```

```ts
function toItem(cafe: {
  id: string;
  name: string;
  address: string;
  travelTime: number;
  rating: number;
  likeCount: number;
  description: string | null;
  imageType: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...cafe,
    hasImage: cafe.imageType != null,
    createdAt: cafe.createdAt.toISOString(),
    updatedAt: cafe.updatedAt.toISOString(),
  };
}
```

- [ ] **Step 4: API 수동 검증**

Run: `npm run dev` 후 `curl -X POST http://localhost:3000/api/cafes/<id>/like` 2회 호출
Expected: 1회차 `{ "likeCount": 1 }`, 2회차 `{ "likeCount": 2 }`, 존재 없는 id는 404 `{ "error": "카페를 찾을 수 없습니다." }`, `GET /api/cafes` 각 항목에 `likeCount` 숫자 포함·이미지 바이너리 없음

---

### Task 3: LikeButton 공용 컴포넌트

**Files:**
- Create: `components/cafe/LikeButton.tsx`
- Test: 목록 카드 안에서 클릭 시 상세 이동 없음 + 숫자 증가

**Interfaces:**
- Consumes: `POST /api/cafes/[id]/like -> { likeCount: number }`
- Produces: `<LikeButton cafeId: string, initialCount: number, size?: "sm" | "md" | "lg" />` (Task 4에서 목록/상세가 import)

- [ ] **Step 1: 컴포넌트 생성**

```tsx
// components/cafe/LikeButton.tsx
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

  const sizeCls = size === "lg" ? "px-5 py-2.5 text-sm" : size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs";

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
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 종료 코드 0, `cafeId/initialCount` prop 오류 없음

---

### Task 4: 목록·상세 UI 연결 + 최종 검증

**Files:**
- Modify: `app/cafes/page.tsx`
- Modify: `app/cafes/[id]/page.tsx`
- Test: 브라우저 수동 테스트 + `npm run build`

**Interfaces:**
- Consumes: `<LikeButton />` (Task 3), 목록/단건 API의 `likeCount` (Task 2)

- [ ] **Step 1: 목록 타입 + 갤러리 카드 연결**

```tsx
// app/cafes/page.tsx
import LikeButton from "@/components/cafe/LikeButton";

type Cafe = {
  id: string;
  name: string;
  address: string;
  travelTime: number;
  rating: number;
  likeCount: number;
  description: string | null;
  hasImage: boolean;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
};
```

```tsx
// 갤러리 카드 주소 아래에 추가 (카드 전체가 Link이므로 LikeButton 내부 preventDefault로 이동 방지)
<p className="mt-1 truncate text-sm text-stone-500">{c.address}</p>
<div className="mt-2">
  <LikeButton cafeId={c.id} initialCount={c.likeCount} size="sm" />
</div>
<p className="mt-2 text-xs font-semibold text-point">🚗 차로 {c.travelTime}분</p>
```

- [ ] **Step 2: 목록 테이블 뷰 연결**

```tsx
// 테이블 별점 셀 아래에 추가
<td className="px-4 py-3 text-center">
  <div className="flex flex-col items-center gap-1.5">
    <Stars value={c.rating} size="sm" />
    <LikeButton cafeId={c.id} initialCount={c.likeCount} size="sm" />
    <span className="text-xs font-bold text-coffee-700">리뷰({c.reviewCount}개)</span>
  </div>
</td>
```

- [ ] **Step 3: 상세 페이지 연결**

```ts
// app/cafes/[id]/page.tsx — select에 추가
select: { id: true, name: true, address: true, travelTime: true, rating: true, likeCount: true, description: true, imageType: true, createdAt: true, updatedAt: true },
```

```tsx
// 상세 설명 아래에 추가
import LikeButton from "@/components/cafe/LikeButton";

<div className="mt-5">
  <LikeButton cafeId={cafe.id} initialCount={cafe.likeCount} size="lg" />
</div>
```

- [ ] **Step 4: 최종 검증**

Run: `npx tsc --noEmit`
Expected: PASS

Run: `npm run build`
Expected: 종료 코드 0

Manual: 목록 갤러리에서 ❤️ 클릭 → 숫자 +1·상세 이동 없음·새로고침 유지, 리스트 뷰 동일, 상세에서 클릭 → +1, 연타 5회 → +5, 목록 응답에 이미지 바이너리 없음

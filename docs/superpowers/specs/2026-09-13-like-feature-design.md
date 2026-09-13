# 공감(좋아요) 기능 디자인 — 2026-09-13

## 배경·목적
- 카페 목록에서 좋아요 이모티콘(❤️)과 개수를 표시하고, 클릭할수록 숫자가 증가하는 공감 기능 추가
- 확정 요구사항: 단일 ❤️ 이모지, 무제한 증가(브라우저당 1회 제한 없음), 목록(갤러리+리스트) + 상세 모두 표시
- 기존 원칙 유지: 목록 API에 이미지 바이너리 포함 금지, BLOB은 `/api/cafes/[id]/image`로 분리, 한국어 문구, zod 양방향 검증 스타일

## 범위
- 포함: DB 컬럼 추가, 목록/단건 API에 `likeCount` 포함, `POST /api/cafes/[id]/like` 증가 API, 목록·상세 UI 버튼, 낙관적 UI
- 제외: 로그인/1인1회 제한, 여러 이모지 반응, 좋아요 로그 테이블, 정렬 옵션에 공감순 추가(후속 검토)

## 아키텍처 (선택: A안)
- `Cafe.likeCount Int @default(0)` 단일 컬럼 + `increment: 1` 원자 증가
- B안(`LikeLog` 테이블 집계)은 무제한 클릭 요구에 과설계라 제외 (YAGNI)
- Prisma provider `sqlite` 유지 → 로컬 `file:./dev.db` + 프로덕션 Turso(libSQL) 모두 호환
- 마이그레이션: 로컬 `npx prisma migrate dev --name add_like_count` → Turso는 `DATABASE_URL/DATABASE_AUTH_TOKEN`으로 `npx prisma db push`

## 컴포넌트
1. **DB**: `prisma/schema.prisma` → `likeCount Int @default(0)`
2. **API**:
   - `GET /api/cafes` select에 `likeCount` 추가, `toListItem`에 그대로 전달
   - `GET /api/cafes/[id]` select + `toItem`에 `likeCount` 추가
   - `POST /api/cafes/[id]/like` 신설 → `prisma.cafe.update({ where:{id}, data:{ likeCount:{ increment:1 } }, select:{ likeCount:true } })`, `{ likeCount }` 반환, 404 한국어 처리
   - 상세 페이지(`app/cafes/[id]/page.tsx`) prisma select에 `likeCount` 추가
3. **UI**: `components/cafe/LikeButton.tsx` (Client) 신설
   - Props: `{ cafeId: string; initialCount: number; size?: "sm"|"md"|"lg" }`
   - 목록 갤러리 카드: 주소 아래 `❤️ 12` 버튼, 카드 전체 `<Link>`이므로 `onClick={e => e.preventDefault()}` + `e.stopPropagation()`으로 상세 이동 방지
   - 목록 테이블 뷰: 별점 셀 아래 또는 새 `공감` 컬럼에 동일 버튼
   - 상세: 제목 옆/설명 아래 큰 `❤️ 공감하기 (12)` 버튼
   - 접근성: `aria-label="좋아요 {n}개, 공감하기"`, 연타 중 `disabled`, `aria-live="polite"`로 개수 변경 알림

## 데이터 흐름
1. 렌더: 서버/목록 API가 준 `likeCount`를 `initialCount`로 표시
2. 클릭 → 즉시 `+1` 낙관적 표시, `POST /api/cafes/[id]/like` fetch
3. 성공 → 서버값으로 확정(`setCount(json.likeCount)`)
4. 실패 → 롤백(`-1`), 빨간 에러 문구 또는 토스트로 `좋아요 처리에 실패했습니다. 다시 시도해주세요.`
5. 목록 재조회(`load()`) 시 서버값으로 자동 동기화

## 에러 처리
- 존재하지 않는 id → 404 `카페를 찾을 수 없습니다.`
- DB 실패 → 500 `좋아요 처리에 실패했습니다.`
- 프론트 fetch 실패 → 롤백 + 인라인 에러, 목록 전체 에러와 분리
- `likeCount`는 항상 0 이상 정수를 보장 (DB default 0, 기존 행 자동 0)

## 테스팅
- 수동: 목록 갤러리/리스트에서 클릭 → 숫자 +1, 새로고침 유지, 상세 이동 안 됨, 상세에서도 +1, 실패 시 롤백
- 동시성: 연타 5회 → +5 (서버 `increment`라 순서 꼬임 없음)
- 회귀: `GET /api/cafes`에 이미지 바이너리 없음, `hasImage/reviewCount` 기존 필드 유지, `npm run build` 통과
- 추후: Turso 적용 후 `/cafes` 목록·이미지 서빙 확인

## Turso 적용 메모
- `.env.local`에 `libsql://` 감지됨 → 스키마 변경 후 로컬 migrate → 동일 스키마를 Turso에 `prisma db push`
- 토큰 등 비밀값은 코드에 하드코딩 금지, Vercel 환경변수와 분리 유지

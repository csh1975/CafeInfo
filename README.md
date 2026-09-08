# 카페로그 — 대전교육연수원 근처 카페 안내 게시판

다녀온 근처 카페를 등록/수정/삭제하고 목록에서 카페명·주소·소요시간·별점을 한눈에 확인하는 웹 서비스.
**이미지는 외부 스토리지 없이 SQLite BLOB(`Cafe.image` Bytes + `imageType`)에 직접 저장**합니다.

## 로컬 실행

```bash
npm install
npx prisma generate
npx prisma migrate dev   # 또는 npx prisma db push
npm run db:seed          # 예시 카페 4개 (이미지 없음)
npm run dev              # http://localhost:3000
```

`.env.local` 예시:

```
DATABASE_URL="file:./dev.db"
```

## 환경변수

| 변수 | 용도 | 발급 방법 |
|---|---|---|
| `DATABASE_URL` | 로컬 `file:./dev.db` / 프로덕션 `libsql://...` | Turso 대시보드 → Database 생성 후 URL 복사 |
| `DATABASE_AUTH_TOKEN` | Turso 접속 토큰 (프로덕션) | `turso db tokens create <db명>` 또는 대시보드에서 발급 |

Turso 프로젝트 생성 절차:
1. https://turso.tech 가입 → `turso auth login`
2. `turso db create cafelog-db` → URL 확인 (`turso db show cafelog-db`)
3. `turso db tokens create cafelog-db` → 토큰 발급
4. 스키마 적용: `DATABASE_URL="libsql://..." DATABASE_AUTH_TOKEN="..." npx prisma db push`

## Vercel 배포 절차

1. GitHub에 푸시 후 Vercel → New Project → 저장소 연결
2. Environment Variables에 `DATABASE_URL` (libsql://...), `DATABASE_AUTH_TOKEN` 등록
3. Build Command: `prisma generate && next build` (package.json에 이미 설정)
4. Deploy → `/cafes`에서 목록/등록/이미지 서빙 확인

> Vercel 서버리스는 파일시스템이 임시 환경이라 SQLite 파일 쓰기는 유실됩니다. **프로덕션은 반드시 Turso**를 사용하세요.

## 이미지 저장 방식 및 주의사항

- 업로드 흐름: 클라이언트 `lib/image.ts`에서 리사이즈(최대 1200px) → JPEG q0.8 압축 → 1MB 상한 확인 → `POST /api/cafes` (multipart) → 서버 재검증 후 `Cafe.image`/`imageType` 저장.
- 조회: 목록/단건 API는 바이너리를 제외하고 `hasImage`만 반환, 썸네일은 `<img src="/api/cafes/{id}/image" />`로 별도 스트리밍 (`Cache-Control: public, max-age=3600`).
- 주의: BLOB 직접 저장 특성상 **원본 업로드 금지(클라이언트 강제)**, 대량 등록 시 Turso DB 용량(플랜 한도) 모니터링 필요. 불필요한 이미지는 수정 화면에서 "이미지 제거"로 삭제. 장기적으로 이미지가 많아지면 오브젝트 스토리지(Vercel Blob/S3) 이전을 권장.

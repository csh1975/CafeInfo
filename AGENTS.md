# AGENTS.md

이 문서는 opencode(AI 코딩 에이전트)가 이 프로젝트에서 작업할 때 항상 지켜야 하는 기본 규칙과 컨텍스트를 정의합니다. 코드를 작성하기 전에 반드시 이 문서 전체를 읽고 원칙을 따르세요.

---

## 1. 프로젝트 개요

- **이름**: 근처 카페 안내 게시판 (가칭 "카페로그")
- **한 줄 설명**: 사용자가 다녀온 근처 카페를 게시판 형태로 등록/수정/삭제하고, 목록에서 카페명·주소·소요시간·추천도(별점)를 한눈에 확인할 수 있는 웹 서비스
- **핵심 사용자 흐름**: 랜딩 페이지 진입 → 카페 목록(게시판) 확인 → 카페 등록/수정/삭제 → 상세 확인

## 2. 기술 스택 (고정, 임의 변경 금지)

| 영역 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 14+ (App Router, TypeScript) | Vercel과 최적 호환 |
| 스타일링 | Tailwind CSS | 커스텀 디자인 시스템 위에 구축 |
| ORM | Prisma | `@libsql/client` 어댑터 사용 |
| DB | SQLite 호환 — 로컬: SQLite 파일 / 배포: **Turso(libSQL)** | 아래 3번 항목 필독 |
| 이미지 저장 | **SQLite BLOB (DB 직접 저장)** | Prisma `Bytes` 타입 사용, 별도 스토리지 서비스 사용 안 함 |
| 폼 검증 | zod + react-hook-form | |
| 배포 | Vercel | |

## 3. ⚠️ 반드시 지켜야 할 아키텍처 제약

1. **Vercel 서버리스 함수는 파일시스템이 요청마다 초기화되는 임시 환경입니다.**
   순수 SQLite 파일(`.db`)에 쓰기 작업을 하면 로컬에서는 잘 동작하지만, Vercel에 배포하면 재배포/콜드스타트마다 데이터가 초기화되거나 쓰기 자체가 실패할 수 있습니다.
   → **프로덕션 DB는 반드시 Turso(libSQL)를 사용**합니다. Turso는 SQLite와 파일/쿼리 호환이 되면서 서버리스 환경에서도 데이터가 영속됩니다.
   → 로컬 개발 시에는 `file:./dev.db` 같은 로컬 SQLite로 개발하고, Prisma의 datasource는 환경변수(`DATABASE_URL`)로 로컬/프로덕션을 분기합니다.
2. **이미지는 외부 스토리지 없이 DB(BLOB)에 직접 저장합니다.** 단, 원본 이미지를 그대로 저장하면 DB 용량이 급격히 커지고 Turso(libSQL) HTTP 프로토콜 및 Vercel 서버리스 함수의 요청 본문 크기 제한에 걸릴 수 있습니다.
   → 클라이언트에서 업로드 직전에 반드시 **리사이즈(예: 최대 가로/세로 1200px)** 및 **압축(JPEG, quality 0.8 내외)**을 거쳐 **최종 파일 크기 상한(예: 1MB)**을 강제합니다.
   → 서버(API Route)에서도 수신한 파일 크기를 재검증하여 상한을 초과하면 에러를 반환합니다.
3. **목록 API 응답에 이미지 바이너리를 포함하지 않습니다.** 목록/카드에서 쓰는 썸네일은 `<img src="/api/cafes/{id}/image" />` 형태로 별도 엔드포인트에서 스트리밍하여, 목록 조회 응답 자체는 가볍게 유지합니다. 해당 이미지 라우트에는 적절한 `Cache-Control` 헤더를 설정합니다.
4. 환경변수는 `.env.local`(로컬)과 Vercel 프로젝트 설정(프로덕션)에 각각 등록하며, 절대 코드에 하드코딩하지 않습니다. 필요 변수: `DATABASE_URL`, `DATABASE_AUTH_TOKEN`(Turso).

## 4. 데이터 모델 (기준안, 필요시 세부 확장 가능)

```prisma
model Cafe {
  id          String   @id @default(cuid())
  name        String   // 카페명
  address     String   // 주소
  travelTime  Int      // 소요시간(분 단위 정수로 저장, UI에서 "OO분"으로 표기)
  rating      Int      // 추천도 1~5
  image       Bytes?   // 이미지 바이너리 데이터 (SQLite/Turso BLOB)
  imageType   String?  // 이미지 MIME 타입 (예: image/jpeg) — 서빙 시 Content-Type 헤더에 사용
  description String?  // 간단 메모/추천 이유 (선택 입력)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 5. 디렉토리 구조 (권장)

```
/app
  /page.tsx                     → 랜딩 페이지
  /cafes
    /page.tsx                    → 카페 목록(게시판)
    /new/page.tsx                 → 카페 등록 폼
    /[id]/page.tsx                 → 카페 상세
    /[id]/edit/page.tsx             → 카페 수정 폼
  /api
    /cafes/route.ts                → GET(목록)/POST(등록, 이미지 포함 multipart 처리)
    /cafes/[id]/route.ts            → GET/PUT/DELETE
    /cafes/[id]/image/route.ts       → GET, DB BLOB을 이미지 응답으로 스트리밍
/components
  /ui                            → 버튼, 인풋, 별점 컴포넌트 등 재사용 UI
  /cafe                           → CafeCard, CafeForm, CafeList 등
/lib
  /prisma.ts                      → Prisma client 싱글턴
  /validations.ts                   → zod 스키마
  /image.ts                        → 클라이언트 이미지 리사이즈/압축 유틸
/prisma
  /schema.prisma
```

## 6. 코딩 컨벤션

- 모든 신규 코드는 TypeScript로 작성하고 `any` 사용을 지양합니다.
- 서버 액션(Server Actions) 또는 Route Handler 중 하나로 데이터 변경 로직을 일관되게 통일합니다(임의 혼용 금지).
- 폼 제출 시 클라이언트/서버 양쪽에서 zod로 검증합니다.
- 이미지 업로드는 `/lib/image.ts`의 공통 리사이즈/압축 유틸을 거쳐서만 서버로 전송합니다.
- 별점(추천도)은 항상 1~5 정수만 허용하며 UI/서버 양쪽에서 범위를 검증합니다.
- 커밋 단위는 기능 단위로 작게 나눕니다 (예: `feat: 카페 등록 폼 구현`).
- 사용자에게 노출되는 문구는 모두 한국어로 작성합니다.

## 7. 디자인 원칙

- 톤앤매너: 세련되고 차분한 카페 감성 (웜톤 베이지/브라운 + 포인트 컬러 1개, 넉넉한 여백, 세리프/산세리프 조합의 타이포그래피)
- 목록 화면은 카드형 또는 테이블형 중 가독성이 좋은 쪽으로 통일감 있게 구성
- 이미지가 없는 카페는 톤에 맞는 플레이스홀더(일러스트/아이콘)로 대체
- 별점은 별 아이콘(★☆)으로 시각화
- 반응형(모바일/데스크톱) 필수

## 8. 실행 명령어

```bash
npm install
npx prisma generate
npx prisma migrate dev   # 로컬 개발
npm run dev
```

## 9. 작업 시 주의사항

- 새로운 라이브러리를 추가하기 전, 위 기술 스택(2번 항목)에서 벗어나지 않는지 확인합니다.
- DB 스키마를 변경할 경우 반드시 Prisma migration을 생성하고, 로컬/Turso 양쪽에 적용 방법을 함께 안내합니다.
- 이미지는 DB(BLOB)에 직접 저장하므로 **원본을 그대로 올리지 않도록 클라이언트 리사이즈/압축을 강제**하고, 최종 저장 크기 상한(예: 1MB)을 서버에서도 재검증합니다.
- 이미지 조회는 반드시 별도 라우트(`/api/cafes/[id]/image`)로 분리하여 목록 API 응답 크기를 가볍게 유지합니다.
- 개발 완료 후 `vercel.json` 또는 Vercel 대시보드에 필요한 환경변수 목록(`DATABASE_URL`, `DATABASE_AUTH_TOKEN`)을 README에 정리합니다.
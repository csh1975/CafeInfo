import Link from "next/link";
import SeasonalArt from "@/components/season/SeasonalArt";

const FEATURES = [
  { icon: "📝", title: "간편 등록", desc: "카페명·주소·소요시간·별점만 입력하면 끝. 사진은 1장으로 가볍게." },
  { icon: "⭐", title: "한눈에 보는 평점", desc: "추천도 높은 순으로 정렬해 실패 없는 카페 선택." },
  { icon: "🚗", title: "자동차 이동시간 확인", desc: "차로 이동 시간을 분 단위로 기록해 들르기 좋은 카페를 바로 파악." },
];

export default function Home() {
  return (
    <div>
      {/* 히어로 — SVG 일러스트 + 그라디언트 조합 (외부 스톡 URL 미사용) */}
      <section className="season-hero relative mt-6 overflow-hidden rounded-3xl shadow-card">
        <div className="grid items-center gap-6 p-8 md:grid-cols-2 md:p-12">
          <div>
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-point-light px-4 py-1.5 text-sm font-bold text-point-dark md:text-[15px]">
              <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <rect x="3" y="4" width="14" height="13" rx="2.5" fill="#2F5D50" />
                <rect x="3" y="4" width="14" height="4" rx="2" fill="#3E7A68" />
                <rect x="6.5" y="2.5" width="7" height="3" rx="1.5" fill="#C96F4A" />
                <line x1="6.5" x2="13.5" y1="11" y2="11" stroke="#FBF7F0" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="6.5" x2="11.5" y1="13.8" y2="13.8" stroke="#FBF7F0" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
              </svg>
              대전교육연수원 근처 카페 안내 게시판
            </p>
            <h1 className="font-serif text-3xl font-bold leading-tight text-coffee-900 md:text-5xl">
              오늘의 카페,
              <br />
              한 잔의 여유를 기록하세요
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-coffee-700/80 md:text-base">
              다녀온 근처 카페를 게시판에 남기고, 별점과 소요시간으로 다음 카페를 골라보세요.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/cafes" className="btn-primary">
                카페 목록 보러가기 →
              </Link>
              <Link href="/cafes/new" className="btn-secondary">
                카페 등록하기
              </Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-sm" aria-hidden>
            <SeasonalArt />
            <p className="mt-1 text-right text-xs font-semibold" style={{ color: "#2563EB" }}>- Vibe Programming By 조성하</p>
          </div>
        </div>
      </section>

      {/* 특징 카드 */}
      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-6">
            <div className="text-3xl">{f.icon}</div>
            <h2 className="mt-3 font-serif text-lg font-bold text-coffee-900">{f.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

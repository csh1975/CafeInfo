import Link from "next/link";

const FEATURES = [
  { icon: "📝", title: "간편 등록", desc: "카페명·주소·소요시간·별점만 입력하면 끝. 사진은 1장으로 가볍게." },
  { icon: "⭐", title: "한눈에 보는 평점", desc: "추천도 높은 순으로 정렬해 실패 없는 카페 선택." },
  { icon: "🚗", title: "자동차 이동시간 확인", desc: "차로 이동 시간을 분 단위로 기록해 들르기 좋은 카페를 바로 파악." },
];

export default function Home() {
  return (
    <div>
      {/* 히어로 — SVG 일러스트 + 그라디언트 조합 (외부 스톡 URL 미사용) */}
      <section className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-cream-100 via-[#F3E3CE] to-[#E4CDA8] shadow-card">
        <div className="grid items-center gap-6 p-8 md:grid-cols-2 md:p-12">
          <div>
            <p className="mb-3 inline-block rounded-full bg-point-light px-3 py-1 text-xs font-bold text-point-dark">
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
            <svg viewBox="0 0 320 240" className="w-full drop-shadow-xl" role="img">
              <ellipse cx="160" cy="212" rx="110" ry="14" fill="#8B5E3C" opacity="0.15" />
              <rect x="70" y="30" width="180" height="150" rx="18" fill="#FFFDF8" stroke="#EADDC6" strokeWidth="3" />
              <rect x="70" y="30" width="180" height="34" rx="18" fill="#2F5D50" />
              <circle cx="92" cy="47" r="4" fill="#FBF7F0" />
              <circle cx="104" cy="47" r="4" fill="#FBF7F0" opacity="0.6" />
              <path d="M120 100 h60 a22 22 0 0 1 0 44 h-60 z" fill="none" stroke="#8B5E3C" strokeWidth="8" strokeLinecap="round" />
              <path d="M96 92 h84 v52 a26 26 0 0 1 -26 26 h-32 a26 26 0 0 1 -26 -26 z" fill="#F5EDDF" stroke="#8B5E3C" strokeWidth="6" />
              <path d="M104 92 q6 -14 12 0 q6 14 12 0 q6 -14 12 0" stroke="#C96F4A" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
              <ellipse cx="250" cy="120" rx="26" ry="34" fill="#6F4A2F" />
              <ellipse cx="250" cy="108" rx="16" ry="20" fill="#A67C52" />
              <g fill="#2F5D50" opacity="0.85">
                <ellipse cx="52" cy="150" rx="14" ry="8" transform="rotate(-30 52 150)" />
                <ellipse cx="278" cy="70" rx="14" ry="8" transform="rotate(30 278 70)" />
              </g>
              <text x="160" y="205" textAnchor="middle" fontSize="13" fill="#8B5E3C" fontFamily="Georgia, serif">오늘의 한 잔 ☕</text>
            </svg>
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

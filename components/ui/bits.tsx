export function Stars({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base";
  return (
    <span className={`${cls} tracking-tight`} aria-label={`별점 ${value}점 / 5점`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= value ? "text-amber-500" : "text-stone-300"}>
          ★
        </span>
      ))}
    </span>
  );
}

export function CafePlaceholder({ label = "이미지 없음" }: { label?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-cream-100 to-[#EADDC6] text-coffee-500">
      <span className="text-3xl">☕</span>
      <span className="text-xs font-semibold">{label}</span>
    </div>
  );
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-coffee-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xl">
      {message}
    </div>
  );
}

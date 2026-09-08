export type Season = "spring" | "summer" | "autumn" | "winter";

export function getSeason(date: Date): Season {
  const m = date.getMonth();
  if (m === 11 || m <= 1) return "winter";
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  return "autumn";
}

export const SEASON_META: Record<Season, { label: string; caption: string }> = {
  spring: { label: "봄", caption: "벚꽃잎 흩날리는 봄의 한 잔 🌸" },
  summer: { label: "여름", caption: "시원한 여름의 한 잔 ☀️" },
  autumn: { label: "가을", caption: "낙엽 지는 가을의 한 잔 🍂" },
  winter: { label: "겨울", caption: "눈 내리는 겨울의 한 잔 ❄️" },
};

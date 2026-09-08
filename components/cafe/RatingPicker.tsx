"use client";

import { useState } from "react";

export function RatingPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="추천도 선택">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i}점`}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className={`text-3xl transition ${i <= shown ? "text-amber-500" : "text-stone-300"} hover:scale-110`}
        >
          ★
        </button>
      ))}
      <span className="ml-2 text-sm font-semibold text-coffee-700">{value > 0 ? `${value}점` : "선택해주세요"}</span>
    </div>
  );
}

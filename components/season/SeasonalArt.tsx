"use client";

import { useEffect, useMemo, useState } from "react";
import { SEASON_META, Season, getSeason } from "@/lib/season";

const PARTICLE_TEXT: Record<Season, string[]> = {
  spring: ["🌸", "🌸", "💮", "🌸", "💮", "🌸", "💮", "🌸"],
  summer: ["✦", "✦", "☀", "✦", "☀", "✦", "☀", "✦"],
  autumn: ["🍂", "🍁", "🍂", "🍁", "🍂", "🍁", "🍂", "🍁"],
  winter: ["❄", "❅", "❄", "❅", "❄", "❅", "❄", "❅"],
};

const CUP: Record<Season, { body: string; drink: string; steam: boolean }> = {
  spring: { body: "#F7DCE4", drink: "#E89BB4", steam: false },
  summer: { body: "#D8ECF6", drink: "#7FBCD6", steam: false },
  autumn: { body: "#F5EDDF", drink: "#C96F4A", steam: true },
  winter: { body: "#EFE6DA", drink: "#8B5E3C", steam: true },
};

export default function SeasonalArt() {
  const [season, setSeason] = useState<Season | null>(null);

  useEffect(() => {
    setSeason(getSeason(new Date()));
  }, []);

  const particles = useMemo(() => {
    if (!season) return [];
    return PARTICLE_TEXT[season].map((text, i) => ({
      text,
      left: `${6 + i * 11.5}%`,
      delay: `${(i * 0.9) % 5}s`,
      duration: `${5.5 + ((i * 1.3) % 4)}s`,
      sway: `${i % 2 === 0 ? 24 : -24}px`,
      size: season === "summer" ? 14 : 18,
    }));
  }, [season]);

  if (!season) {
    return <div className="w-full" style={{ aspectRatio: "320 / 240" }} aria-hidden />;
  }

  const cup = CUP[season];
  const meta = SEASON_META[season];

  return (
    <div className="season-art" aria-hidden>
      <svg viewBox="0 0 320 240" className="w-full drop-shadow-xl" role="img">
        <ellipse cx="160" cy="212" rx="110" ry="14" fill="#8B5E3C" opacity="0.15" />
        <rect x="70" y="30" width="180" height="150" rx="18" fill="#FFFDF8" stroke="#EADDC6" strokeWidth="3" />
        <rect x="70" y="30" width="180" height="34" rx="18" fill="#2F5D50" />
        <circle cx="92" cy="47" r="4" fill="#FBF7F0" />
        <circle cx="104" cy="47" r="4" fill="#FBF7F0" opacity="0.6" />
        <path d="M120 100 h60 a22 22 0 0 1 0 44 h-60 z" fill="none" stroke="#8B5E3C" strokeWidth="8" strokeLinecap="round" />
        <path d="M96 92 h84 v52 a26 26 0 0 1 -26 26 h-32 a26 26 0 0 1 -26 -26 z" fill={cup.body} stroke="#8B5E3C" strokeWidth="6" />
        <path d="M104 92 q6 -14 12 0 q6 14 12 0 q6 -14 12 0" stroke={cup.drink} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
        {cup.steam && (
          <g stroke={cup.drink} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.55">
            <path d="M140 78 q5 -8 0 -16 q-5 -8 0 -16" />
            <path d="M160 78 q5 -8 0 -16 q-5 -8 0 -16" />
          </g>
        )}
        <text x="160" y="205" textAnchor="middle" fontSize="13" fill="#8B5E3C" fontFamily="Georgia, serif">
          {meta.caption}
        </text>
      </svg>
      <div className="season-particles">
        {particles.map((p, i) => (
          <span
            key={i}
            className="season-particle"
            style={{
              left: p.left,
              fontSize: p.size,
              animationDelay: p.delay,
              animationDuration: p.duration,
              ["--sway" as string]: p.sway,
            }}
          >
            {p.text}
          </span>
        ))}
      </div>
    </div>
  );
}

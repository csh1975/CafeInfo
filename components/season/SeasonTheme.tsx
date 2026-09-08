"use client";

import { useEffect } from "react";
import { getSeason } from "@/lib/season";

export default function SeasonTheme() {
  useEffect(() => {
    const season = getSeason(new Date());
    document.body.dataset.season = season;
    return () => {
      delete document.body.dataset.season;
    };
  }, []);

  return null;
}

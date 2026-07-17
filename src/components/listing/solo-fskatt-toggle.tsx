"use client";

import { useQueryParam } from "@/lib/use-query-param";

export function SoloFSkattToggle() {
  const [fskatt, setFskatt] = useQueryParam("fskatt");
  const checked = fskatt === "1";

  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => setFskatt(e.target.checked ? "1" : null)}
        className="h-4 w-4 rounded border-card-border accent-accent"
      />
      Endast uppdrag öppna för enskild firma med F-skatt
    </label>
  );
}

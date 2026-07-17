"use client";

import { useQueryParam } from "@/lib/use-query-param";

const options = [
  { value: "nyast", label: "Nyast" },
  { value: "deadline", label: "Sista ansökningsdag" },
  { value: "foretag", label: "Företag A–Ö" },
] as const;

export function SortSelect() {
  const [sortering, setSortering] = useQueryParam("sortering");

  return (
    <select
      value={sortering ?? "nyast"}
      onChange={(e) => setSortering(e.target.value === "nyast" ? null : e.target.value)}
      className="h-10 rounded-full border border-card-border bg-card px-4 text-sm"
      aria-label="Sortera"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { useQueryParam } from "@/lib/use-query-param";

export function CityCombobox({
  cities,
}: {
  cities: { slug: string; name: string }[];
}) {
  const [citySlug, setCitySlug] = useQueryParam("ort");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selectedCity = cities.find((city) => city.slug === citySlug);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((city) => city.name.toLowerCase().includes(q));
  }, [cities, query]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full min-w-[180px] items-center justify-between gap-2 rounded-full border border-card-border bg-card px-4 text-sm"
      >
        <span className={selectedCity ? "" : "text-muted"}>
          {selectedCity?.name ?? "Alla orter"}
        </span>
        <span className="flex items-center gap-1">
          {selectedCity && (
            <X
              className="h-3.5 w-3.5 text-muted hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setCitySlug(null);
                setOpen(false);
              }}
            />
          )}
          <ChevronDown className="h-4 w-4 text-muted" strokeWidth={1.75} />
        </span>
      </button>

      {open && (
        <button
          type="button"
          aria-label="Stäng"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-10 cursor-default"
        />
      )}

      {open && (
        <div className="absolute z-20 mt-1 w-full min-w-[220px] rounded-xl border border-card-border bg-card p-2 shadow-lg">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sök ort…"
            className="mb-2 h-9 w-full rounded-lg border border-card-border bg-background px-3 text-sm outline-none focus:border-accent"
          />
          <div className="max-h-60 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setCitySlug(null);
                setOpen(false);
                setQuery("");
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-background"
            >
              Alla orter
            </button>
            {filtered.map((city) => (
              <button
                key={city.slug}
                type="button"
                onClick={() => {
                  setCitySlug(city.slug);
                  setOpen(false);
                  setQuery("");
                }}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-background"
              >
                {city.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted">Ingen ort hittades</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

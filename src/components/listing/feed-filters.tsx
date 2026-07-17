"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { TradeChips } from "@/components/listing/trade-chips";
import { CityCombobox } from "@/components/listing/city-combobox";
import { EmploymentTypeToggle } from "@/components/listing/employment-type-toggle";
import { SoloFSkattToggle } from "@/components/listing/solo-fskatt-toggle";
import { SortSelect } from "@/components/listing/sort-select";
import { useQueryParam } from "@/lib/use-query-param";

type FeedFiltersProps = {
  trades: { slug: string; nameSv: string }[];
  cities: { slug: string; name: string }[];
  mode: "jobb" | "uppdrag";
  resultCount: number;
};

const employmentTypeLabels: Record<string, string> = {
  anstallning: "Anställning",
  larling: "Lärling",
};

function ActiveFilterChips({
  trades,
  cities,
  mode,
}: Pick<FeedFiltersProps, "trades" | "cities" | "mode">) {
  const searchParams = useSearchParams();
  const [, setTrade] = useQueryParam("yrke");
  const [, setCity] = useQueryParam("ort");
  const [, setTyp] = useQueryParam("typ");
  const [, setFskatt] = useQueryParam("fskatt");

  const tradeSlug = searchParams.get("yrke");
  const citySlug = searchParams.get("ort");
  const typ = searchParams.get("typ");
  const fskatt = searchParams.get("fskatt");

  const chips: { label: string; onRemove: () => void }[] = [];

  if (tradeSlug) {
    const trade = trades.find((t) => t.slug === tradeSlug);
    if (trade) chips.push({ label: trade.nameSv, onRemove: () => setTrade(null) });
  }
  if (citySlug) {
    const city = cities.find((c) => c.slug === citySlug);
    if (city) chips.push({ label: city.name, onRemove: () => setCity(null) });
  }
  if (mode === "jobb" && typ) {
    chips.push({ label: employmentTypeLabels[typ] ?? typ, onRemove: () => setTyp(null) });
  }
  if (mode === "uppdrag" && fskatt === "1") {
    chips.push({ label: "Öppna för F-skatt", onRemove: () => setFskatt(null) });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent"
        >
          {chip.label}
          <X className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

function FilterControls({ trades, cities, mode }: Pick<FeedFiltersProps, "trades" | "cities" | "mode">) {
  return (
    <div className="flex flex-col gap-4">
      <TradeChips trades={trades} />
      <div className="flex flex-wrap items-center gap-3">
        <CityCombobox cities={cities} />
        {mode === "jobb" && <EmploymentTypeToggle />}
      </div>
      {mode === "uppdrag" && <SoloFSkattToggle />}
    </div>
  );
}

export function FeedFilters({ trades, cities, mode, resultCount }: FeedFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* Desktop: inline sticky filter bar */}
      <div className="sticky top-0 z-10 hidden flex-col gap-4 border-b border-card-border bg-background/95 py-4 backdrop-blur md:flex">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <FilterControls trades={trades} cities={cities} mode={mode} />
          <SortSelect />
        </div>
        <ActiveFilterChips trades={trades} cities={cities} mode={mode} />
      </div>

      {/* Mobile: trigger + sort, opens bottom sheet */}
      <div className="flex items-center justify-between gap-3 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-card-border bg-card px-4 text-sm font-medium"
        >
          <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} />
          Filter
        </button>
        <SortSelect />
      </div>
      <div className="md:hidden">
        <ActiveFilterChips trades={trades} cities={cities} mode={mode} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Stäng filter"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col gap-4 rounded-t-2xl border-t border-card-border bg-card p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filter</h2>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Stäng">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto">
              <FilterControls trades={trades} cities={cities} mode={mode} />
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="mt-auto inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 font-medium text-accent-foreground"
            >
              Visa {resultCount} {mode === "jobb" ? "jobb" : "uppdrag"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

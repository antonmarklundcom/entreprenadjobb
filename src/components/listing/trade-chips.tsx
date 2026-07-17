"use client";

import { useQueryParam } from "@/lib/use-query-param";

export function TradeChips({
  trades,
}: {
  trades: { slug: string; nameSv: string }[];
}) {
  const [tradeSlug, setTradeSlug] = useQueryParam("yrke");

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setTradeSlug(null)}
        className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
          !tradeSlug
            ? "bg-accent text-accent-foreground"
            : "border border-card-border bg-card hover:border-accent"
        }`}
      >
        Alla yrken
      </button>
      {trades.map((trade) => (
        <button
          key={trade.slug}
          type="button"
          onClick={() => setTradeSlug(tradeSlug === trade.slug ? null : trade.slug)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            tradeSlug === trade.slug
              ? "bg-accent text-accent-foreground"
              : "border border-card-border bg-card hover:border-accent"
          }`}
        >
          {trade.nameSv}
        </button>
      ))}
    </div>
  );
}

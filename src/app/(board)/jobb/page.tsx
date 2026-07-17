import type { Metadata } from "next";
import { FeedFilters } from "@/components/listing/feed-filters";
import { ListingCard } from "@/components/listing/listing-card";
import { getAllTrades, getListings, getSeoTargetCities, sortValues } from "@/lib/listings";
import type { EmploymentType } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Jobb inom bygg",
  description:
    "Bläddra bland anställningar och lärlingsplatser inom el, tak och solceller i hela Sverige.",
};

export const revalidate = 60;

type SearchParams = { [key: string]: string | string[] | undefined };

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function JobbPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const tradeSlug = firstValue(params.yrke);
  const citySlug = firstValue(params.ort);
  const typ = firstValue(params.typ);
  const sortParam = firstValue(params.sortering);
  const sort = sortValues.includes(sortParam as (typeof sortValues)[number])
    ? (sortParam as (typeof sortValues)[number])
    : "nyast";

  const employmentTypes: EmploymentType[] =
    typ === "anstallning"
      ? ["ANSTALLNING"]
      : typ === "larling"
        ? ["LARLING"]
        : ["ANSTALLNING", "LARLING"];

  const [trades, cities, { listings, total }] = await Promise.all([
    getAllTrades(),
    getSeoTargetCities(),
    getListings({ employmentTypes, tradeSlug, citySlug, sort }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10 sm:px-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Jobb</h1>
        <p className="text-muted">
          Anställningar och lärlingsplatser inom el, tak och solceller.
        </p>
      </div>

      <FeedFilters
        trades={trades.map((t) => ({ slug: t.slug, nameSv: t.nameSv }))}
        cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
        mode="jobb"
        resultCount={total}
      />

      {listings.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-card-border py-16 text-center">
          <p className="text-lg font-medium">Inga jobb hittades</p>
          <p className="text-muted">Prova att ta bort något filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </main>
  );
}

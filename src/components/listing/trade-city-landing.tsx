import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getListings } from "@/lib/listings";
import { ListingCard } from "@/components/listing/listing-card";
import { buildPseoIntro, buildPseoTitle, employmentTypeForSection } from "@/lib/pseo-copy";

type Section = "jobb" | "larlingsplatser" | "uppdrag";

// larlingsplatser has no standalone interactive feed — it's a filtered
// view of /jobb (employmentType=LARLING vs ANSTALLNING share one feed).
const seeAllHref: Record<Section, string> = {
  jobb: "/jobb",
  larlingsplatser: "/jobb?typ=larling",
  uppdrag: "/uppdrag",
};

export async function TradeCityLanding({
  section,
  tradeSlug,
  citySlug,
}: {
  section: Section;
  tradeSlug: string;
  citySlug?: string;
}) {
  const trade = await db.trade.findUnique({ where: { slug: tradeSlug, isActive: true } });
  if (!trade) notFound();

  const city = citySlug
    ? await db.city.findUnique({ where: { slug: citySlug, isSeoTarget: true } })
    : null;
  if (citySlug && !city) notFound();

  const [{ listings, total }, otherCities, otherTrades] = await Promise.all([
    getListings({
      employmentTypes: [employmentTypeForSection(section)],
      tradeSlug,
      citySlug,
      sort: "nyast",
    }),
    db.city.findMany({
      where: { isSeoTarget: true, ...(city ? { NOT: { id: city.id } } : {}) },
      orderBy: { population: "desc" },
      take: 12,
    }),
    db.trade.findMany({
      where: { isActive: true, NOT: { id: trade.id } },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const title = buildPseoTitle(section, trade.nameSv, city?.name);
  const intro = buildPseoIntro(section, trade.nameSv, city?.name);
  const basePath = `/${section}/${trade.slug}`;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 sm:px-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-muted">{intro}</p>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-card-border py-16 text-center">
          <p className="text-lg font-medium">Inga annonser just nu</p>
          <p className="text-muted">
            Prova{" "}
            <Link href={seeAllHref[section]} className="text-accent hover:underline">
              hela listan
            </Link>{" "}
            utan filter, eller kolla in en annan ort nedan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {total > 0 && (
        <p className="text-sm text-muted">
          Visar {listings.length} av {total} annonser.{" "}
          <Link href={seeAllHref[section]} className="text-accent hover:underline">
            Se alla och filtrera
          </Link>
        </p>
      )}

      {otherCities.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-card-border pt-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
            {trade.nameSv} i andra städer
          </h2>
          <div className="flex flex-wrap gap-2">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                href={`${basePath}/${c.slug}`}
                className="rounded-full border border-card-border bg-card px-3.5 py-1.5 text-sm hover:border-accent"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {otherTrades.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
            Andra yrkesområden{city ? ` i ${city.name}` : ""}
          </h2>
          <div className="flex flex-wrap gap-2">
            {otherTrades.map((t) => (
              <Link
                key={t.slug}
                href={`/${section}/${t.slug}${city ? `/${city.slug}` : ""}`}
                className="rounded-full border border-card-border bg-card px-3.5 py-1.5 text-sm hover:border-accent"
              >
                {t.nameSv}
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

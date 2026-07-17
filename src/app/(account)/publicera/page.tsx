import type { Metadata } from "next";
import { getAllTrades, getSeoTargetCities } from "@/lib/listings";
import { PostJobWizard } from "@/components/forms/post-job-wizard";

export const metadata: Metadata = {
  title: "Publicera jobb eller uppdrag",
  description: "Publicera ett jobb, en lärlingsplats eller ett uppdrag helt gratis.",
};

type SearchParams = { typ?: string };

export default async function PubliceraPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { typ } = await searchParams;
  const [trades, cities] = await Promise.all([getAllTrades(), getSeoTargetCities()]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10 sm:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Publicera gratis</h1>
        <p className="mt-2 text-muted">
          Det tar två minuter. Vi skickar en bekräftelselänk till din e-post
          innan annonsen publiceras.
        </p>
      </div>
      <PostJobWizard
        trades={trades.map((t) => ({ slug: t.slug, nameSv: t.nameSv }))}
        cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
        initialListingType={typ === "uppdrag" ? "uppdrag" : "jobb"}
      />
    </main>
  );
}

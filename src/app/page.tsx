import Link from "next/link";
import { BentoGrid } from "@/components/listing/bento-grid";
import { sv } from "@/copy/sv";
import { getTradeSummaries } from "@/lib/trades";

export const revalidate = 60;

export default async function Home() {
  const trades = await getTradeSummaries();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-6 py-16 sm:px-8">
      <section className="flex flex-col gap-6 text-center sm:text-left">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {sv.home.heroTitle}
        </h1>
        <p className="max-w-2xl text-lg text-muted sm:text-xl">
          {sv.home.heroSubtitle}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/publicera?typ=jobb"
            className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 font-medium text-accent-foreground shadow-sm transition-transform hover:-translate-y-0.5"
          >
            {sv.home.ctaPostJob}
          </Link>
          <Link
            href="/publicera?typ=uppdrag"
            className="inline-flex h-12 items-center justify-center rounded-full border border-card-border bg-card px-6 font-medium transition-transform hover:-translate-y-0.5"
          >
            {sv.home.ctaPostAssignment}
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
          {sv.home.categoriesTitle}
        </h2>
        <BentoGrid trades={trades} />
      </section>
    </main>
  );
}

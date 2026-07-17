import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Mail, MapPin, Phone, ExternalLink } from "lucide-react";
import { getListingBySlug } from "@/lib/listings";
import { buildJobPostingJsonLd } from "@/lib/seo";

export const revalidate = 60;

const employmentTypeLabel: Record<string, string> = {
  ANSTALLNING: "Anställning",
  LARLING: "Lärling",
  UNDERENTREPRENOR: "Uppdrag (underentreprenör)",
};

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return { title: "Annons hittades inte – Entreprenadjobb" };

  return {
    title: `${listing.title} – ${listing.employerName} | Entreprenadjobb`,
    description: listing.description.slice(0, 155),
    robots: listing.source === "JOBTECH" ? { index: false, follow: true } : undefined,
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  const location = listing.city?.name ?? listing.locationText;
  const jsonLd = listing.source === "NATIVE" ? buildJobPostingJsonLd(listing) : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10 sm:px-8">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {listing.source === "JOBTECH" && (
        <div className="flex items-center gap-2 rounded-xl border border-card-border bg-card px-4 py-3 text-sm text-muted">
          <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Den här annonsen kommer från Platsbanken (Arbetsförmedlingen). Ansök
          via länken nedan.
        </div>
      )}

      <div className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
          {employmentTypeLabel[listing.employmentType]}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight">{listing.title}</h1>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-muted">
          <span className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4" strokeWidth={1.75} />
            {listing.employerName}
          </span>
          {location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" strokeWidth={1.75} />
              {location}
            </span>
          )}
        </div>
      </div>

      <div className="whitespace-pre-wrap text-base leading-relaxed">
        {listing.description}
      </div>

      {listing.employmentType === "UNDERENTREPRENOR" && (
        <dl className="grid grid-cols-1 gap-4 rounded-2xl border border-card-border bg-card p-5 sm:grid-cols-2">
          {listing.scopeText && (
            <div>
              <dt className="text-sm text-muted">Omfattning</dt>
              <dd className="font-medium">{listing.scopeText}</dd>
            </div>
          )}
          {listing.durationText && (
            <div>
              <dt className="text-sm text-muted">Tidsplan</dt>
              <dd className="font-medium">{listing.durationText}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm text-muted">Enskild firma med F-skatt</dt>
            <dd className="font-medium">
              {listing.openToSoloFSkatt ? "Välkommen att ansöka" : "Endast företag"}
            </dd>
          </div>
        </dl>
      )}

      {listing.employmentType !== "UNDERENTREPRENOR" && listing.salaryText && (
        <div className="rounded-2xl border border-card-border bg-card p-5">
          <p className="text-sm text-muted">Lön</p>
          <p className="font-medium">{listing.salaryText}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-card-border pt-6 sm:flex-row">
        {listing.applyUrl && (
          <a
            href={listing.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 font-medium text-accent-foreground"
          >
            <ExternalLink className="h-4 w-4" />
            Ansök här
          </a>
        )}
        {listing.applyEmail && (
          <a
            href={`mailto:${listing.applyEmail}`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-card-border bg-card px-6 font-medium"
          >
            <Mail className="h-4 w-4" />
            {listing.applyEmail}
          </a>
        )}
        {listing.applyPhone && (
          <a
            href={`tel:${listing.applyPhone}`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-card-border bg-card px-6 font-medium"
          >
            <Phone className="h-4 w-4" />
            {listing.applyPhone}
          </a>
        )}
      </div>

      <Link
        href={listing.employmentType === "UNDERENTREPRENOR" ? "/uppdrag" : "/jobb"}
        className="text-sm text-muted hover:text-accent"
      >
        ← Tillbaka till alla annonser
      </Link>
    </main>
  );
}

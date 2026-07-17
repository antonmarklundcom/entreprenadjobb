import Link from "next/link";
import { MapPin, Building2 } from "lucide-react";
import type { ListingCardData } from "@/lib/listings";

const employmentTypeLabel: Record<ListingCardData["employmentType"], string> = {
  ANSTALLNING: "Anställning",
  LARLING: "Lärling",
  UNDERENTREPRENOR: "Uppdrag",
};

const employmentTypeColor: Record<ListingCardData["employmentType"], string> = {
  ANSTALLNING: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  LARLING: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  UNDERENTREPRENOR: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

function relativeTime(date: Date | null): string | null {
  if (!date) return null;
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Idag";
  if (days === 1) return "1 dag sedan";
  if (days < 30) return `${days} dagar sedan`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 månad sedan" : `${months} månader sedan`;
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const location = listing.cityName ?? listing.locationText;
  const posted = relativeTime(listing.publishedAt);

  return (
    <Link
      href={`/annons/${listing.slug}`}
      className="group flex flex-col gap-3 rounded-2xl border border-card-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${employmentTypeColor[listing.employmentType]}`}
        >
          {employmentTypeLabel[listing.employmentType]}
        </span>
        <div className="flex gap-1.5">
          {listing.isNew && (
            <span className="inline-flex items-center rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
              Nytt
            </span>
          )}
          {listing.source === "JOBTECH" && (
            <span className="inline-flex items-center rounded-full border border-card-border px-2.5 py-1 text-xs text-muted">
              via Platsbanken
            </span>
          )}
        </div>
      </div>

      <h3 className="text-lg font-semibold leading-snug group-hover:text-accent">
        {listing.title}
      </h3>

      <div className="mt-auto flex flex-col gap-1 text-sm text-muted">
        <span className="flex items-center gap-1.5">
          <Building2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          {listing.employerName}
        </span>
        {location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {location}
          </span>
        )}
      </div>

      {posted && <span className="text-xs text-muted">{posted}</span>}
    </Link>
  );
}

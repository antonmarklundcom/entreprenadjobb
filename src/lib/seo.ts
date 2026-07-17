import type { ListingDetail } from "@/lib/listings";

const SITE_URL = "https://entreprenadjobb.se";

const employmentTypeToSchema: Record<string, string> = {
  ANSTALLNING: "FULL_TIME",
  LARLING: "INTERN",
  UNDERENTREPRENOR: "CONTRACTOR",
};

// https://schema.org/JobPosting — built only for NATIVE listings (external
// JOBTECH ads stay noindex and link out instead, see PLAN.md §10).
export function buildJobPostingJsonLd(listing: ListingDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: listing.title,
    description: listing.description,
    datePosted: listing.publishedAt?.toISOString(),
    validThrough: listing.expiresAt?.toISOString(),
    employmentType: employmentTypeToSchema[listing.employmentType],
    hiringOrganization: {
      "@type": "Organization",
      name: listing.employerName,
    },
    jobLocation: listing.city
      ? {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: listing.city.name,
            addressRegion: listing.city.county,
            addressCountry: "SE",
          },
        }
      : undefined,
    directApply: false,
    url: `${SITE_URL}/annons/${listing.slug}`,
  };
}

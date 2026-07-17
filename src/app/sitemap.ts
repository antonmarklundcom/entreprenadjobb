import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const SITE_URL = "https://entreprenadjobb.se";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [trades, cities, listings] = await Promise.all([
    db.trade.findMany({ where: { isActive: true }, select: { slug: true } }),
    db.city.findMany({ where: { isSeoTarget: true }, select: { slug: true } }),
    db.listing.findMany({
      where: {
        status: "PUBLISHED",
        source: "NATIVE",
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/jobb`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/uppdrag`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/publicera`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const pseoSections = ["jobb", "larlingsplatser", "uppdrag"];
  const pseoPages: MetadataRoute.Sitemap = pseoSections.flatMap((section) => [
    ...trades.map((trade) => ({
      url: `${SITE_URL}/${section}/${trade.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...trades.flatMap((trade) =>
      cities.map((city) => ({
        url: `${SITE_URL}/${section}/${trade.slug}/${city.slug}`,
        changeFrequency: "daily" as const,
        priority: 0.6,
      })),
    ),
  ]);

  const listingPages: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `${SITE_URL}/annons/${listing.slug}`,
    lastModified: listing.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticPages, ...pseoPages, ...listingPages];
}

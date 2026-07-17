import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { EmploymentType } from "@/generated/prisma/enums";

export const sortValues = ["nyast", "deadline", "foretag"] as const;
export type SortValue = (typeof sortValues)[number];

export type ListingFilters = {
  employmentTypes: EmploymentType[];
  tradeSlug?: string;
  citySlug?: string;
  onlyOpenToSoloFSkatt?: boolean;
  sort?: SortValue;
};

export type ListingCardData = {
  id: string;
  slug: string;
  title: string;
  employerName: string;
  employmentType: EmploymentType;
  source: "NATIVE" | "JOBTECH";
  tradeSlug: string;
  tradeName: string;
  cityName: string | null;
  locationText: string | null;
  publishedAt: Date | null;
  expiresAt: Date | null;
  openToSoloFSkatt: boolean;
  isNew: boolean;
};

const orderByForSort: Record<SortValue, Prisma.ListingOrderByWithRelationInput[]> = {
  nyast: [{ publishedAt: "desc" }],
  deadline: [{ expiresAt: "asc" }, { publishedAt: "desc" }],
  foretag: [{ employerName: "asc" }],
};

export async function getListings(filters: ListingFilters): Promise<{
  listings: ListingCardData[];
  total: number;
}> {
  const where: Prisma.ListingWhereInput = {
    status: "PUBLISHED",
    employmentType: { in: filters.employmentTypes },
    OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    ...(filters.tradeSlug ? { trade: { slug: filters.tradeSlug } } : {}),
    ...(filters.citySlug ? { city: { slug: filters.citySlug } } : {}),
    ...(filters.onlyOpenToSoloFSkatt ? { openToSoloFSkatt: true } : {}),
  };

  try {
    const [rows, total] = await Promise.all([
      db.listing.findMany({
        where,
        orderBy: [
          { source: "asc" }, // NATIVE before JOBTECH at equal sort weight
          ...orderByForSort[filters.sort ?? "nyast"],
        ],
        take: 60,
        include: { trade: true, city: true },
      }),
      db.listing.count({ where }),
    ]);

    const now = Date.now();
    const listings: ListingCardData[] = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      employerName: row.employerName,
      employmentType: row.employmentType,
      source: row.source,
      tradeSlug: row.trade.slug,
      tradeName: row.trade.nameSv,
      cityName: row.city?.name ?? null,
      locationText: row.locationText,
      publishedAt: row.publishedAt,
      expiresAt: row.expiresAt,
      openToSoloFSkatt: row.openToSoloFSkatt,
      isNew: row.publishedAt
        ? now - row.publishedAt.getTime() < 48 * 60 * 60 * 1000
        : false,
    }));

    return { listings, total };
  } catch (error) {
    console.error("getListings: falling back to empty list", error);
    return { listings: [], total: 0 };
  }
}

export type ListingDetail = NonNullable<Awaited<ReturnType<typeof fetchListingBySlug>>>;

async function fetchListingBySlug(slug: string) {
  return db.listing.findUnique({
    where: { slug },
    include: { trade: true, city: true, company: true },
  });
}

export async function getListingBySlug(slug: string) {
  try {
    const listing = await fetchListingBySlug(slug);
    if (!listing || listing.status !== "PUBLISHED") return null;
    if (listing.expiresAt && listing.expiresAt.getTime() < Date.now()) return null;
    return listing;
  } catch (error) {
    console.error("getListingBySlug: failed", error);
    return null;
  }
}

export async function countPublishedListings(
  employmentTypes: EmploymentType[],
): Promise<number> {
  try {
    return await db.listing.count({
      where: {
        status: "PUBLISHED",
        employmentType: { in: employmentTypes },
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
    });
  } catch (error) {
    console.error("countPublishedListings: falling back to 0", error);
    return 0;
  }
}

export async function getAllTrades() {
  try {
    return await db.trade.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  } catch (error) {
    console.error("getAllTrades: falling back to empty list", error);
    return [];
  }
}

export async function getSeoTargetCities() {
  try {
    return await db.city.findMany({
      where: { isSeoTarget: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("getSeoTargetCities: falling back to empty list", error);
    return [];
  }
}

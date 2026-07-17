import { db } from "@/lib/db";

export type TradeSummary = {
  slug: string;
  nameSv: string;
  icon: string | null;
  listingCount: number;
};

// Falls back to an empty list rather than throwing, so the home page still
// renders (with zero-count cards) if the database isn't reachable yet —
// e.g. before DATABASE_URL is configured in a fresh environment.
export async function getTradeSummaries(): Promise<TradeSummary[]> {
  try {
    const trades = await db.trade.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { listings: { where: { status: "PUBLISHED" } } },
        },
      },
    });

    return trades.map((trade) => ({
      slug: trade.slug,
      nameSv: trade.nameSv,
      icon: trade.icon,
      listingCount: trade._count.listings,
    }));
  } catch (error) {
    console.error("getTradeSummaries: falling back to empty list", error);
    return [];
  }
}

import { db } from "@/lib/db";

export async function userOwnsListing(userId: string, listingId: string): Promise<boolean> {
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { companyId: true },
  });
  if (!listing?.companyId) return false;

  const membership = await db.companyMember.findFirst({
    where: { userId, companyId: listing.companyId },
    select: { id: true },
  });
  return Boolean(membership);
}

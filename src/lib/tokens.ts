import { randomBytes, createHash } from "node:crypto";
import { db } from "@/lib/db";
import type { TokenPurpose } from "@/generated/prisma/enums";

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export async function createListingToken(
  listingId: string,
  purpose: TokenPurpose,
  ttlHours: number,
): Promise<string> {
  const rawToken = randomBytes(32).toString("base64url");
  await db.listingToken.create({
    data: {
      listingId,
      purpose,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
    },
  });
  return rawToken;
}

// Consumes the token (marks it used) only when it is valid, unexpired, and
// unused — returns the associated listing, or null.
export async function consumeListingToken(rawToken: string, purpose: TokenPurpose) {
  const tokenHash = hashToken(rawToken);
  const token = await db.listingToken.findUnique({
    where: { tokenHash },
    include: { listing: true },
  });

  if (
    !token ||
    token.purpose !== purpose ||
    token.usedAt ||
    token.expiresAt.getTime() < Date.now()
  ) {
    return null;
  }

  await db.listingToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  });

  return token.listing;
}

// EDIT_LISTING tokens are long-lived manage links, meant to be reused for
// the listing's lifetime — unlike consumeListingToken, this does not mark
// the token as used.
export async function verifyEditToken(rawToken: string, listingId: string) {
  const tokenHash = hashToken(rawToken);
  const token = await db.listingToken.findUnique({ where: { tokenHash } });

  if (
    !token ||
    token.purpose !== "EDIT_LISTING" ||
    token.listingId !== listingId ||
    token.expiresAt.getTime() < Date.now()
  ) {
    return false;
  }

  return true;
}

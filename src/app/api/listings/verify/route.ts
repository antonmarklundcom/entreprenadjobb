import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { consumeListingToken, createListingToken } from "@/lib/tokens";
import { sendListingPublishedEmail } from "@/lib/email";

const SITE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${SITE_URL}/publicera?fel=saknad-token`);
  }

  const listing = await consumeListingToken(token, "VERIFY_PUBLISH");
  if (!listing) {
    return NextResponse.redirect(`${SITE_URL}/publicera?fel=ogiltig-token`);
  }

  const updated = await db.listing.update({
    where: { id: listing.id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
    include: { company: true },
  });

  const editToken = await createListingToken(listing.id, "EDIT_LISTING", 24 * 365);
  const listingUrl = `${SITE_URL}/annons/${updated.slug}`;
  const editUrl = `${SITE_URL}/konto/annons/${updated.id}?token=${editToken}`;

  const contactEmail = updated.company?.contactEmail ?? updated.applyEmail;
  if (contactEmail) {
    await sendListingPublishedEmail({
      to: contactEmail,
      listingTitle: updated.title,
      listingUrl,
      editUrl,
    });
  }

  return NextResponse.redirect(`${listingUrl}?publicerad=1`);
}

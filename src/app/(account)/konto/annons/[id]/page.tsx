import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createListingToken, verifyEditToken } from "@/lib/tokens";
import { userOwnsListing } from "@/lib/authz";
import { ManageListingForm } from "@/components/forms/manage-listing-form";

type Params = { id: string };
type SearchParams = { token?: string };

async function resolveToken(id: string, tokenFromUrl: string | undefined) {
  if (tokenFromUrl && (await verifyEditToken(tokenFromUrl, id))) {
    return tokenFromUrl;
  }

  const session = await auth();
  if (session?.user?.id && (await userOwnsListing(session.user.id, id))) {
    // Signed-in owner: mint a fresh short-lived manage token so the page
    // can reuse the same token-gated PATCH/close endpoints as the emailed
    // manage link, without exposing a raw session-based API surface.
    return createListingToken(id, "EDIT_LISTING", 24);
  }

  return null;
}

export default async function ManageListingPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const { token: tokenFromUrl } = await searchParams;

  const token = await resolveToken(id, tokenFromUrl);
  if (!token) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold">Länken är ogiltig eller har gått ut</h1>
        <p className="text-muted">
          Kontrollera att du klickade på hela länken från e-postmeddelandet, eller
          logga in för att hantera dina annonser.
        </p>
      </main>
    );
  }

  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10 sm:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hantera din annons</h1>
        <p className="text-muted">{listing.title}</p>
      </div>
      <ManageListingForm listing={listing} token={token} />
    </main>
  );
}

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { verifyEditToken } from "@/lib/tokens";
import { ManageListingForm } from "@/components/forms/manage-listing-form";

type Params = { id: string };
type SearchParams = { token?: string };

export default async function ManageListingPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!token) notFound();

  const valid = await verifyEditToken(token, id);
  if (!valid) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold">Länken är ogiltig eller har gått ut</h1>
        <p className="text-muted">
          Kontrollera att du klickade på hela länken från e-postmeddelandet.
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

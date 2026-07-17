import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Mitt konto – Entreprenadjobb",
};

const statusLabel: Record<string, string> = {
  DRAFT: "Väntar på bekräftelse",
  PENDING_VERIFICATION: "Väntar på granskning",
  PUBLISHED: "Publicerad",
  CLOSED: "Avslutad",
  EXPIRED: "Utgången",
  REMOVED: "Borttagen",
};

export default async function KontoPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/logga-in");

  const memberships = await db.companyMember.findMany({
    where: { userId: session.user.id },
    include: { company: { include: { listings: { orderBy: { createdAt: "desc" } } } } },
  });

  const listings = memberships.flatMap((m) => m.company.listings);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10 sm:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mina annonser</h1>
        <p className="text-muted">Inloggad som {session.user.email}</p>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-card-border py-16 text-center">
          <p className="text-lg font-medium">Du har inga annonser än</p>
          <Link
            href="/publicera"
            className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 font-medium text-accent-foreground"
          >
            Publicera din första annons
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/konto/annons/${listing.id}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-card-border bg-card p-4 hover:border-accent"
            >
              <div>
                <p className="font-medium">{listing.title}</p>
                <p className="text-sm text-muted">
                  {statusLabel[listing.status] ?? listing.status}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

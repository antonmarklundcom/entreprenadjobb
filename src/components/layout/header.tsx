import Link from "next/link";
import { auth, signOut } from "@/auth";
import { sv } from "@/copy/sv";

export async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-card-border">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {sv.site.name}
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href="/jobb" className="hover:text-accent">
            Jobb
          </Link>
          <Link href="/uppdrag" className="hover:text-accent">
            Uppdrag
          </Link>
          <Link
            href="/publicera"
            className="hidden rounded-full bg-accent px-4 py-2 text-accent-foreground sm:inline-flex"
          >
            Publicera gratis
          </Link>
          {session?.user ? (
            <div className="flex items-center gap-3">
              <Link href="/konto" className="hover:text-accent">
                Mitt konto
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className="text-muted hover:text-accent">
                  Logga ut
                </button>
              </form>
            </div>
          ) : (
            <Link href="/logga-in" className="hover:text-accent">
              Logga in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

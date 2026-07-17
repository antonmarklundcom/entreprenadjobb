import type { Metadata } from "next";
import { signIn } from "@/auth";

export const metadata: Metadata = {
  title: "Logga in",
};

type SearchParams = { type?: string };

export default async function LoggaInPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Auth.js redirects here with ?provider=resend&type=email after the
  // magic-link email is sent (see pages.verifyRequest in src/auth.ts).
  const { type } = await searchParams;
  const skickad = type === "email";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16 sm:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Logga in</h1>
        <p className="mt-2 text-muted">
          Ingen lösenord behövs — vi skickar en inloggningslänk till din e-post.
        </p>
      </div>

      {skickad ? (
        <div className="rounded-2xl border border-card-border bg-card p-5">
          <p className="font-medium">Kolla din inkorg!</p>
          <p className="text-sm text-muted">
            Vi har skickat en inloggningslänk till din e-postadress.
          </p>
        </div>
      ) : (
        <form
          action={async (formData: FormData) => {
            "use server";
            const email = String(formData.get("email") ?? "");
            await signIn("resend", { email, redirectTo: "/konto" });
          }}
          className="flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">E-postadress</span>
            <input
              type="email"
              name="email"
              required
              className="h-11 rounded-xl border border-card-border bg-card px-3"
              placeholder="du@exempel.se"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 font-medium text-accent-foreground"
          >
            Skicka inloggningslänk
          </button>
        </form>
      )}
    </main>
  );
}

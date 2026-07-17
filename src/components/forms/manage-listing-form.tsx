"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Listing } from "@/generated/prisma/client";

const statusLabel: Record<string, string> = {
  DRAFT: "Väntar på bekräftelse",
  PENDING_VERIFICATION: "Väntar på granskning",
  PUBLISHED: "Publicerad",
  CLOSED: "Avslutad",
  EXPIRED: "Utgången",
  REMOVED: "Borttagen",
};

export function ManageListingForm({ listing, token }: { listing: Listing; token: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: listing.title,
    description: listing.description,
    salaryText: listing.salaryText ?? "",
    scopeText: listing.scopeText ?? "",
    durationText: listing.durationText ?? "",
    applyEmail: listing.applyEmail ?? "",
    applyUrl: listing.applyUrl ?? "",
    applyPhone: listing.applyPhone ?? "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [closing, setClosing] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...form }),
      });
      if (!res.ok) throw new Error();
      setStatus("saved");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  async function handleClose() {
    if (!confirm("Vill du avsluta annonsen? Den går inte att återpublicera.")) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/listings/${listing.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("Kunde inte avsluta annonsen. Försök igen.");
    } finally {
      setClosing(false);
    }
  }

  const isClosed = listing.status === "CLOSED" || listing.status === "REMOVED";

  return (
    <div className="flex flex-col gap-6">
      <span className="inline-flex w-fit items-center rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
        {statusLabel[listing.status] ?? listing.status}
      </span>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Titel</span>
          <input
            value={form.title}
            disabled={isClosed}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="h-11 rounded-xl border border-card-border bg-card px-3 disabled:opacity-60"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Beskrivning</span>
          <textarea
            value={form.description}
            disabled={isClosed}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={6}
            className="rounded-xl border border-card-border bg-card px-3 py-2 disabled:opacity-60"
          />
        </label>

        {listing.employmentType === "UNDERENTREPRENOR" ? (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Omfattning</span>
              <input
                value={form.scopeText}
                disabled={isClosed}
                onChange={(e) => setForm((f) => ({ ...f, scopeText: e.target.value }))}
                className="h-11 rounded-xl border border-card-border bg-card px-3 disabled:opacity-60"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Tidsplan</span>
              <input
                value={form.durationText}
                disabled={isClosed}
                onChange={(e) => setForm((f) => ({ ...f, durationText: e.target.value }))}
                className="h-11 rounded-xl border border-card-border bg-card px-3 disabled:opacity-60"
              />
            </label>
          </>
        ) : (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Lön</span>
            <input
              value={form.salaryText}
              disabled={isClosed}
              onChange={(e) => setForm((f) => ({ ...f, salaryText: e.target.value }))}
              className="h-11 rounded-xl border border-card-border bg-card px-3 disabled:opacity-60"
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">E-post för ansökan</span>
          <input
            value={form.applyEmail}
            disabled={isClosed}
            onChange={(e) => setForm((f) => ({ ...f, applyEmail: e.target.value }))}
            className="h-11 rounded-xl border border-card-border bg-card px-3 disabled:opacity-60"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Länk för ansökan</span>
          <input
            value={form.applyUrl}
            disabled={isClosed}
            onChange={(e) => setForm((f) => ({ ...f, applyUrl: e.target.value }))}
            className="h-11 rounded-xl border border-card-border bg-card px-3 disabled:opacity-60"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Telefon för ansökan</span>
          <input
            value={form.applyPhone}
            disabled={isClosed}
            onChange={(e) => setForm((f) => ({ ...f, applyPhone: e.target.value }))}
            className="h-11 rounded-xl border border-card-border bg-card px-3 disabled:opacity-60"
          />
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isClosed || status === "saving"}
            className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 font-medium text-accent-foreground disabled:opacity-50"
          >
            {status === "saving" ? "Sparar…" : "Spara ändringar"}
          </button>
          {status === "saved" && <span className="text-sm text-success">Sparat!</span>}
          {status === "error" && (
            <span className="text-sm text-red-600">Något gick fel, försök igen.</span>
          )}
        </div>
      </form>

      {!isClosed && (
        <button
          type="button"
          onClick={handleClose}
          disabled={closing}
          className="inline-flex h-11 w-fit items-center justify-center rounded-full border border-card-border px-6 font-medium text-red-600 disabled:opacity-50"
        >
          {closing ? "Avslutar…" : "Avsluta annonsen"}
        </button>
      )}
    </div>
  );
}

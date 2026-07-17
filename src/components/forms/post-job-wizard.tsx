"use client";

import { useMemo, useState } from "react";
import {
  createListingSchema,
  listingApplySchema,
  listingCompanySchema,
  listingDetailsSchema,
  type ListingType,
} from "@/lib/validators";

type Trade = { slug: string; nameSv: string };
type City = { slug: string; name: string };

type FormState = {
  listingType: ListingType;
  details: {
    title: string;
    description: string;
    tradeSlug: string;
    citySlug: string;
    employmentType: "ANSTALLNING" | "LARLING" | "UNDERENTREPRENOR";
    salaryText: string;
    startDate: string;
    scopeText: string;
    durationText: string;
    openToSoloFSkatt: boolean;
  };
  company: {
    companyName: string;
    orgNumber: string;
    contactEmail: string;
    contactPhone: string;
  };
  apply: {
    applyEmail: string;
    applyUrl: string;
    applyPhone: string;
  };
};

const steps = ["typ", "detaljer", "foretag", "ansokan", "granska"] as const;
type Step = (typeof steps)[number];

const stepTitles: Record<Step, string> = {
  typ: "Vad vill du publicera?",
  detaljer: "Detaljer",
  foretag: "Om företaget",
  ansokan: "Hur ansöker man?",
  granska: "Granska och skicka",
};

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const map: Record<string, string> = {};
  for (const issue of issues) {
    map[issue.path.map(String).join(".")] = issue.message;
  }
  return map;
}

export function PostJobWizard({
  trades,
  cities,
  initialListingType,
}: {
  trades: Trade[];
  cities: City[];
  initialListingType: ListingType;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [form, setForm] = useState<FormState>({
    listingType: initialListingType,
    details: {
      title: "",
      description: "",
      tradeSlug: "",
      citySlug: "",
      employmentType: initialListingType === "uppdrag" ? "UNDERENTREPRENOR" : "ANSTALLNING",
      salaryText: "",
      startDate: "",
      scopeText: "",
      durationText: "",
      openToSoloFSkatt: true,
    },
    company: { companyName: "", orgNumber: "", contactEmail: "", contactPhone: "" },
    apply: { applyEmail: "", applyUrl: "", applyPhone: "" },
  });

  const step = steps[stepIndex];

  const isUppdrag = form.listingType === "uppdrag";

  function setListingType(listingType: ListingType) {
    setForm((f) => ({
      ...f,
      listingType,
      details: {
        ...f.details,
        employmentType: listingType === "uppdrag" ? "UNDERENTREPRENOR" : "ANSTALLNING",
      },
    }));
  }

  function goNext() {
    setErrors({});
    if (step === "detaljer") {
      const result = listingDetailsSchema.safeParse(form.details);
      if (!result.success) return setErrors(fieldErrors(result.error.issues));
    }
    if (step === "foretag") {
      const result = listingCompanySchema.safeParse(form.company);
      if (!result.success) return setErrors(fieldErrors(result.error.issues));
    }
    if (step === "ansokan") {
      const result = listingApplySchema.safeParse(form.apply);
      if (!result.success) return setErrors(fieldErrors(result.error.issues));
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  function goBack() {
    setErrors({});
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function handleSubmit() {
    setErrors({});
    const payload = {
      listingType: form.listingType,
      details: form.details,
      company: form.company,
      apply: form.apply,
    };
    const result = createListingSchema.safeParse(payload);
    if (!result.success) {
      setErrors(fieldErrors(result.error.issues));
      return;
    }

    setSubmitState("submitting");
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (!res.ok) {
        setSubmitState("error");
        return;
      }
      setSubmitState("done");
    } catch {
      setSubmitState("error");
    }
  }

  const selectedTrade = useMemo(
    () => trades.find((t) => t.slug === form.details.tradeSlug),
    [trades, form.details.tradeSlug],
  );
  const selectedCity = useMemo(
    () => cities.find((c) => c.slug === form.details.citySlug),
    [cities, form.details.citySlug],
  );

  if (submitState === "done") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-card-border bg-card p-8 text-center">
        <h2 className="text-xl font-semibold">Kolla din inkorg!</h2>
        <p className="text-muted">
          Vi har skickat en bekräftelselänk till{" "}
          <strong>{form.company.contactEmail}</strong>. Klicka på länken för
          att publicera annonsen.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-accent" : "bg-card-border"}`}
          />
        ))}
      </div>
      <h2 className="text-xl font-semibold">{stepTitles[step]}</h2>

      {step === "typ" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setListingType("jobb")}
            className={`rounded-2xl border p-5 text-left transition-colors ${
              form.listingType === "jobb"
                ? "border-accent bg-accent/10"
                : "border-card-border bg-card"
            }`}
          >
            <h3 className="font-semibold">Jobb</h3>
            <p className="mt-1 text-sm text-muted">
              Anställning eller lärlingsplats för en enskild person.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setListingType("uppdrag")}
            className={`rounded-2xl border p-5 text-left transition-colors ${
              form.listingType === "uppdrag"
                ? "border-accent bg-accent/10"
                : "border-card-border bg-card"
            }`}
          >
            <h3 className="font-semibold">Uppdrag</h3>
            <p className="mt-1 text-sm text-muted">
              Ett uppdrag som ett annat företag eller en F-skattare kan ta sig an.
            </p>
          </button>
        </div>
      )}

      {step === "detaljer" && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Titel</span>
            <input
              value={form.details.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, details: { ...f.details, title: e.target.value } }))
              }
              className="h-11 rounded-xl border border-card-border bg-card px-3"
              placeholder={isUppdrag ? "T.ex. Takomläggning 400 m² – Malmö" : "T.ex. Elektriker till nyproduktion"}
            />
            {errors.title && <span className="text-sm text-red-600">{errors.title}</span>}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Beskrivning</span>
            <textarea
              value={form.details.description}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  details: { ...f.details, description: e.target.value },
                }))
              }
              rows={5}
              className="rounded-xl border border-card-border bg-card px-3 py-2"
            />
            {errors.description && (
              <span className="text-sm text-red-600">{errors.description}</span>
            )}
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Yrkesområde</span>
              <select
                value={form.details.tradeSlug}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    details: { ...f.details, tradeSlug: e.target.value },
                  }))
                }
                className="h-11 rounded-xl border border-card-border bg-card px-3"
              >
                <option value="">Välj yrkesområde</option>
                {trades.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.nameSv}
                  </option>
                ))}
              </select>
              {errors.tradeSlug && (
                <span className="text-sm text-red-600">{errors.tradeSlug}</span>
              )}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Ort</span>
              <select
                value={form.details.citySlug}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    details: { ...f.details, citySlug: e.target.value },
                  }))
                }
                className="h-11 rounded-xl border border-card-border bg-card px-3"
              >
                <option value="">Välj ort</option>
                {cities.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!isUppdrag && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Anställningsform</span>
                <div className="inline-flex w-fit rounded-full border border-card-border bg-card p-1">
                  {(["ANSTALLNING", "LARLING"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          details: { ...f.details, employmentType: value },
                        }))
                      }
                      className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
                        form.details.employmentType === value
                          ? "bg-accent text-accent-foreground"
                          : ""
                      }`}
                    >
                      {value === "ANSTALLNING" ? "Anställning" : "Lärling"}
                    </button>
                  ))}
                </div>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Lön (valfritt)</span>
                <input
                  value={form.details.salaryText}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      details: { ...f.details, salaryText: e.target.value },
                    }))
                  }
                  className="h-11 rounded-xl border border-card-border bg-card px-3"
                  placeholder="T.ex. Enligt kollektivavtal"
                />
              </label>
            </>
          )}

          {isUppdrag && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Omfattning</span>
                <input
                  value={form.details.scopeText}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      details: { ...f.details, scopeText: e.target.value },
                    }))
                  }
                  className="h-11 rounded-xl border border-card-border bg-card px-3"
                  placeholder="T.ex. Takomläggning 400 m², totalentreprenad"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Tidsplan</span>
                <input
                  value={form.details.durationText}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      details: { ...f.details, durationText: e.target.value },
                    }))
                  }
                  className="h-11 rounded-xl border border-card-border bg-card px-3"
                  placeholder="T.ex. 6 veckor, start augusti"
                />
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.details.openToSoloFSkatt}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      details: { ...f.details, openToSoloFSkatt: e.target.checked },
                    }))
                  }
                  className="h-4 w-4 rounded border-card-border accent-accent"
                />
                Öppet även för enskild firma med F-skatt
              </label>
            </>
          )}
        </div>
      )}

      {step === "foretag" && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Företagsnamn</span>
            <input
              value={form.company.companyName}
              onChange={(e) =>
                setForm((f) => ({ ...f, company: { ...f.company, companyName: e.target.value } }))
              }
              className="h-11 rounded-xl border border-card-border bg-card px-3"
            />
            {errors.companyName && (
              <span className="text-sm text-red-600">{errors.companyName}</span>
            )}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Org.nr (valfritt)</span>
            <input
              value={form.company.orgNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, company: { ...f.company, orgNumber: e.target.value } }))
              }
              placeholder="XXXXXX-XXXX"
              className="h-11 rounded-xl border border-card-border bg-card px-3"
            />
            {errors.orgNumber && (
              <span className="text-sm text-red-600">{errors.orgNumber}</span>
            )}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Din e-postadress</span>
            <input
              type="email"
              value={form.company.contactEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, company: { ...f.company, contactEmail: e.target.value } }))
              }
              className="h-11 rounded-xl border border-card-border bg-card px-3"
            />
            <span className="text-xs text-muted">
              Vi skickar en bekräftelselänk hit innan annonsen publiceras.
            </span>
            {errors.contactEmail && (
              <span className="text-sm text-red-600">{errors.contactEmail}</span>
            )}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Telefon (valfritt)</span>
            <input
              value={form.company.contactPhone}
              onChange={(e) =>
                setForm((f) => ({ ...f, company: { ...f.company, contactPhone: e.target.value } }))
              }
              className="h-11 rounded-xl border border-card-border bg-card px-3"
            />
          </label>
        </div>
      )}

      {step === "ansokan" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Ange minst ett sätt för sökande att komma i kontakt.
          </p>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">E-post för ansökan</span>
            <input
              value={form.apply.applyEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, apply: { ...f.apply, applyEmail: e.target.value } }))
              }
              className="h-11 rounded-xl border border-card-border bg-card px-3"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Länk till ansökan</span>
            <input
              value={form.apply.applyUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, apply: { ...f.apply, applyUrl: e.target.value } }))
              }
              placeholder="https://…"
              className="h-11 rounded-xl border border-card-border bg-card px-3"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Telefonnummer</span>
            <input
              value={form.apply.applyPhone}
              onChange={(e) =>
                setForm((f) => ({ ...f, apply: { ...f.apply, applyPhone: e.target.value } }))
              }
              className="h-11 rounded-xl border border-card-border bg-card px-3"
            />
          </label>
          {errors[""] && <span className="text-sm text-red-600">{errors[""]}</span>}
        </div>
      )}

      {step === "granska" && (
        <div className="flex flex-col gap-4 rounded-2xl border border-card-border bg-card p-5">
          <div>
            <p className="text-sm text-muted">Titel</p>
            <p className="font-medium">{form.details.title}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Yrkesområde / ort</p>
            <p className="font-medium">
              {selectedTrade?.nameSv ?? "–"} {selectedCity ? `· ${selectedCity.name}` : ""}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted">Företag</p>
            <p className="font-medium">{form.company.companyName}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Kontakt</p>
            <p className="font-medium">{form.company.contactEmail}</p>
          </div>
          {submitState === "error" && (
            <p className="text-sm text-red-600">
              Något gick fel. Kontrollera uppgifterna och försök igen.
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0}
          className="inline-flex h-11 items-center justify-center rounded-full border border-card-border px-6 font-medium disabled:opacity-40"
        >
          Tillbaka
        </button>
        {step === "granska" ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitState === "submitting"}
            className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 font-medium text-accent-foreground disabled:opacity-50"
          >
            {submitState === "submitting" ? "Skickar…" : "Skicka in annons"}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 font-medium text-accent-foreground"
          >
            Nästa
          </button>
        )}
      </div>
    </div>
  );
}

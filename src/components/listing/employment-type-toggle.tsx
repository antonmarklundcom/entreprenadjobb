"use client";

import { useQueryParam } from "@/lib/use-query-param";

const options = [
  { value: null, label: "Alla" },
  { value: "anstallning", label: "Anställning" },
  { value: "larling", label: "Lärling" },
] as const;

export function EmploymentTypeToggle() {
  const [typ, setTyp] = useQueryParam("typ");

  return (
    <div className="inline-flex rounded-full border border-card-border bg-card p-1">
      {options.map((option) => {
        const active = (typ ?? null) === option.value;
        return (
          <button
            key={option.label}
            type="button"
            onClick={() => setTyp(option.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active ? "bg-accent text-accent-foreground" : "hover:bg-background"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

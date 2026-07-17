export const sv = {
  site: {
    name: "Entreprenadjobb",
    tagline: "Jobb och uppdrag inom bygg – för hantverkare och företag",
  },
  home: {
    heroTitle: "Hitta jobbet. Hitta uppdraget. Helt gratis.",
    heroSubtitle:
      "Entreprenadjobb.se samlar anställningar, lärlingsplatser och uppdrag mellan företag inom el, tak och solceller.",
    ctaPostJob: "Publicera jobb",
    ctaPostAssignment: "Publicera uppdrag",
    categoriesTitle: "Bläddra per kategori",
    apprenticeshipsLabel: "Lärlingsplatser",
    assignmentsLabel: "Uppdrag mellan företag",
    listingsCount: (n: number) => `${n} ${n === 1 ? "annons" : "annonser"}`,
  },
} as const;

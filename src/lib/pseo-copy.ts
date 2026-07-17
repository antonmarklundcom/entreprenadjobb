import type { EmploymentType } from "@/generated/prisma/enums";

type Section = "jobb" | "larlingsplatser" | "uppdrag";

const sectionEmploymentType: Record<Section, EmploymentType> = {
  jobb: "ANSTALLNING",
  larlingsplatser: "LARLING",
  uppdrag: "UNDERENTREPRENOR",
};

const sectionNoun: Record<Section, { singular: string; plural: string }> = {
  jobb: { singular: "jobb", plural: "jobb" },
  larlingsplatser: { singular: "lärlingsplats", plural: "lärlingsplatser" },
  uppdrag: { singular: "uppdrag", plural: "uppdrag" },
};

export function employmentTypeForSection(section: Section): EmploymentType {
  return sectionEmploymentType[section];
}

export function buildPseoTitle(section: Section, tradeName: string, cityName?: string): string {
  const noun = sectionNoun[section].plural;
  if (cityName) {
    return `${capitalize(noun)} inom ${tradeName.toLowerCase()} i ${cityName}`;
  }
  return `${capitalize(noun)} inom ${tradeName.toLowerCase()} i hela Sverige`;
}

export function buildPseoIntro(section: Section, tradeName: string, cityName?: string): string {
  const trade = tradeName.toLowerCase();

  if (section === "jobb") {
    return cityName
      ? `Letar du efter jobb inom ${trade} i ${cityName}? Här hittar du aktuella anställningar hos företag som söker just nu. Alla annonser är gratis att söka – ansök direkt hos arbetsgivaren.`
      : `Här samlar vi lediga jobb inom ${trade} från hela Sverige. Filtrera på ort för att hitta anställningar nära dig.`;
  }

  if (section === "larlingsplatser") {
    return cityName
      ? `Vill du bli lärling inom ${trade} i ${cityName}? Här listar vi företag som just nu tar emot lärlingar inom ${trade}.`
      : `Söker du en lärlingsplats inom ${trade}? Här hittar du företag i hela Sverige som utbildar nya lärlingar inom ${trade}.`;
  }

  return cityName
    ? `Söker du uppdrag inom ${trade} i ${cityName}? Här listar vi uppdrag som andra företag lägger ut – öppet för underentreprenörer och, i många fall, enskilda firmor med F-skatt.`
    : `Här hittar du uppdrag inom ${trade} från hela Sverige, lagda av företag som söker en underentreprenör att samarbeta med.`;
}

export function buildPseoMetaDescription(
  section: Section,
  tradeName: string,
  cityName?: string,
): string {
  const noun = sectionNoun[section].plural;
  const trade = tradeName.toLowerCase();
  const location = cityName ? `i ${cityName}` : "i hela Sverige";
  return `Bläddra bland ${noun} inom ${trade} ${location}. Gratis att söka, inga konton krävs.`.slice(
    0,
    155,
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

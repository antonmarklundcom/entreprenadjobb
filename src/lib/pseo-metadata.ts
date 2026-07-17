import type { Metadata } from "next";
import { db } from "@/lib/db";
import { buildPseoMetaDescription, buildPseoTitle } from "@/lib/pseo-copy";

type Section = "jobb" | "larlingsplatser" | "uppdrag";

export async function buildPseoMetadata(
  section: Section,
  tradeSlug: string,
  citySlug?: string,
): Promise<Metadata> {
  const trade = await db.trade.findUnique({ where: { slug: tradeSlug, isActive: true } });
  if (!trade) return { title: "Sidan hittades inte" };

  const city = citySlug
    ? await db.city.findUnique({ where: { slug: citySlug, isSeoTarget: true } })
    : null;
  if (citySlug && !city) return { title: "Sidan hittades inte" };

  return {
    title: buildPseoTitle(section, trade.nameSv, city?.name),
    description: buildPseoMetaDescription(section, trade.nameSv, city?.name),
    alternates: {
      canonical: `/${section}/${trade.slug}${city ? `/${city.slug}` : ""}`,
    },
  };
}

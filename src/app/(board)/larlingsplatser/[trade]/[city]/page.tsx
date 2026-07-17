import type { Metadata } from "next";
import { db } from "@/lib/db";
import { buildPseoMetadata } from "@/lib/pseo-metadata";
import { TradeCityLanding } from "@/components/listing/trade-city-landing";

export const revalidate = 3600;

type Params = { trade: string; city: string };

export async function generateStaticParams() {
  const [trades, cities] = await Promise.all([
    db.trade.findMany({ where: { isActive: true }, select: { slug: true } }),
    db.city.findMany({ where: { isSeoTarget: true }, select: { slug: true } }),
  ]);
  return trades.flatMap((t) => cities.map((c) => ({ trade: t.slug, city: c.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { trade, city } = await params;
  return buildPseoMetadata("larlingsplatser", trade, city);
}

export default async function LarlingsplatserTradeCityPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { trade, city } = await params;
  return <TradeCityLanding section="larlingsplatser" tradeSlug={trade} citySlug={city} />;
}

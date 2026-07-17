import type { Metadata } from "next";
import { db } from "@/lib/db";
import { buildPseoMetadata } from "@/lib/pseo-metadata";
import { TradeCityLanding } from "@/components/listing/trade-city-landing";

export const revalidate = 3600;

type Params = { trade: string };

export async function generateStaticParams() {
  const trades = await db.trade.findMany({ where: { isActive: true }, select: { slug: true } });
  return trades.map((t) => ({ trade: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { trade } = await params;
  return buildPseoMetadata("uppdrag", trade);
}

export default async function UppdragTradePage({ params }: { params: Promise<Params> }) {
  const { trade } = await params;
  return <TradeCityLanding section="uppdrag" tradeSlug={trade} />;
}

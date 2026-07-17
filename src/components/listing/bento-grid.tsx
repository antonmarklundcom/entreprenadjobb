import Link from "next/link";
import {
  GraduationCap,
  Handshake,
  Home as HomeIcon,
  Sun,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { sv } from "@/copy/sv";
import type { TradeSummary } from "@/lib/trades";

const tradeIcons: Record<string, LucideIcon> = {
  Zap,
  Home: HomeIcon,
  Sun,
};

function BentoCell({
  href,
  icon: Icon,
  title,
  count,
  size = "md",
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  count: number;
  size?: "md" | "lg";
}) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col justify-between rounded-2xl border border-card-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        size === "lg" ? "sm:col-span-2 sm:row-span-1" : ""
      }`}
    >
      <Icon
        className="h-8 w-8 text-accent transition-transform group-hover:scale-110"
        strokeWidth={1.75}
      />
      <div className="mt-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted">{sv.home.listingsCount(count)}</p>
      </div>
    </Link>
  );
}

export function BentoGrid({
  trades,
  assignmentCount,
  apprenticeshipCount,
}: {
  trades: TradeSummary[];
  assignmentCount: number;
  apprenticeshipCount: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {trades.map((trade) => (
        <BentoCell
          key={trade.slug}
          href={`/jobb?yrke=${trade.slug}`}
          icon={(trade.icon && tradeIcons[trade.icon]) || Zap}
          title={trade.nameSv}
          count={trade.listingCount}
        />
      ))}
      <BentoCell
        href="/jobb?typ=larling"
        icon={GraduationCap}
        title={sv.home.apprenticeshipsLabel}
        count={apprenticeshipCount}
        size="lg"
      />
      <BentoCell
        href="/uppdrag"
        icon={Handshake}
        title={sv.home.assignmentsLabel}
        count={assignmentCount}
      />
    </div>
  );
}

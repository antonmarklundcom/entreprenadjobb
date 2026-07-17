import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Runs locally only, against DIRECT_URL (see prisma.config.ts).
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const db = new PrismaClient({ adapter });

const trades = [
  { slug: "el", nameSv: "El", icon: "Zap", sortOrder: 1 },
  { slug: "tak", nameSv: "Tak", icon: "Home", sortOrder: 2 },
  { slug: "solceller", nameSv: "Solceller", icon: "Sun", sortOrder: 3 },
];

// SCB kommunkod, name, county — the ~25 largest municipalities by
// population, used as programmatic-SEO targets (Trade × City pages).
const cities: {
  slug: string;
  name: string;
  county: string;
  municipalityCode: string;
  isSeoTarget: boolean;
}[] = [
  { slug: "stockholm", name: "Stockholm", county: "Stockholms län", municipalityCode: "0180", isSeoTarget: true },
  { slug: "goteborg", name: "Göteborg", county: "Västra Götalands län", municipalityCode: "1480", isSeoTarget: true },
  { slug: "malmo", name: "Malmö", county: "Skåne län", municipalityCode: "1280", isSeoTarget: true },
  { slug: "uppsala", name: "Uppsala", county: "Uppsala län", municipalityCode: "0380", isSeoTarget: true },
  { slug: "vasteras", name: "Västerås", county: "Västmanlands län", municipalityCode: "1980", isSeoTarget: true },
  { slug: "orebro", name: "Örebro", county: "Örebro län", municipalityCode: "1880", isSeoTarget: true },
  { slug: "linkoping", name: "Linköping", county: "Östergötlands län", municipalityCode: "0580", isSeoTarget: true },
  { slug: "helsingborg", name: "Helsingborg", county: "Skåne län", municipalityCode: "1283", isSeoTarget: true },
  { slug: "jonkoping", name: "Jönköping", county: "Jönköpings län", municipalityCode: "0680", isSeoTarget: true },
  { slug: "norrkoping", name: "Norrköping", county: "Östergötlands län", municipalityCode: "0581", isSeoTarget: true },
  { slug: "lund", name: "Lund", county: "Skåne län", municipalityCode: "1281", isSeoTarget: true },
  { slug: "umea", name: "Umeå", county: "Västerbottens län", municipalityCode: "2480", isSeoTarget: true },
  { slug: "gavle", name: "Gävle", county: "Gävleborgs län", municipalityCode: "2180", isSeoTarget: true },
  { slug: "boras", name: "Borås", county: "Västra Götalands län", municipalityCode: "1490", isSeoTarget: true },
  { slug: "sodertalje", name: "Södertälje", county: "Stockholms län", municipalityCode: "0181", isSeoTarget: true },
  { slug: "eskilstuna", name: "Eskilstuna", county: "Södermanlands län", municipalityCode: "0484", isSeoTarget: true },
  { slug: "halmstad", name: "Halmstad", county: "Hallands län", municipalityCode: "1380", isSeoTarget: true },
  { slug: "vaxjo", name: "Växjö", county: "Kronobergs län", municipalityCode: "0780", isSeoTarget: true },
  { slug: "karlstad", name: "Karlstad", county: "Värmlands län", municipalityCode: "1780", isSeoTarget: true },
  { slug: "sundsvall", name: "Sundsvall", county: "Västernorrlands län", municipalityCode: "2281", isSeoTarget: true },
  { slug: "trollhattan", name: "Trollhättan", county: "Västra Götalands län", municipalityCode: "1488", isSeoTarget: true },
  { slug: "ostersund", name: "Östersund", county: "Jämtlands län", municipalityCode: "2380", isSeoTarget: true },
  { slug: "nykoping", name: "Nyköping", county: "Södermanlands län", municipalityCode: "0480", isSeoTarget: true },
  { slug: "karlskrona", name: "Karlskrona", county: "Blekinge län", municipalityCode: "1080", isSeoTarget: true },
  { slug: "skelleftea", name: "Skellefteå", county: "Västerbottens län", municipalityCode: "2482", isSeoTarget: true },
];

async function main() {
  for (const trade of trades) {
    await db.trade.upsert({
      where: { slug: trade.slug },
      update: trade,
      create: trade,
    });
  }

  for (const city of cities) {
    await db.city.upsert({
      where: { slug: city.slug },
      update: city,
      create: city,
    });
  }

  console.log(`Seeded ${trades.length} trades and ${cities.length} cities.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });

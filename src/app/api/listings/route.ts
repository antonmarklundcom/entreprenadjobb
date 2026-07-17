import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createListingSchema } from "@/lib/validators";
import { slugWithSuffix } from "@/lib/slugs";
import { createListingToken } from "@/lib/tokens";
import { sendVerifyPublishEmail } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createListingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Ogiltiga uppgifter", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { listingType, details, company, apply } = parsed.data;

  const trade = await db.trade.findUnique({ where: { slug: details.tradeSlug } });
  if (!trade || !trade.isActive) {
    return NextResponse.json(
      { ok: false, error: "Okänt yrkesområde" },
      { status: 400 },
    );
  }

  const city = details.citySlug
    ? await db.city.findUnique({ where: { slug: details.citySlug } })
    : null;

  const listing = await db.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email: company.contactEmail },
      update: {},
      create: { email: company.contactEmail, phone: company.contactPhone || null },
    });

    const createdCompany = await tx.company.create({
      data: {
        slug: slugWithSuffix(company.companyName),
        name: company.companyName,
        orgNumber: company.orgNumber || null,
        contactEmail: company.contactEmail,
        phone: company.contactPhone || null,
        cityId: city?.id,
        isHiring: listingType === "jobb",
        isOutsourcing: listingType === "uppdrag",
        trades: { connect: [{ id: trade.id }] },
        members: { create: { userId: user.id, role: "OWNER" } },
      },
    });

    return tx.listing.create({
      data: {
        slug: slugWithSuffix(details.title),
        title: details.title,
        description: details.description,
        status: "DRAFT",
        employmentType: details.employmentType,
        tradeId: trade.id,
        cityId: city?.id,
        companyId: createdCompany.id,
        employerName: createdCompany.name,
        applyEmail: apply.applyEmail || null,
        applyUrl: apply.applyUrl || null,
        applyPhone: apply.applyPhone || null,
        salaryText: details.salaryText || null,
        startDate: details.startDate ? new Date(details.startDate) : null,
        scopeText: details.scopeText || null,
        durationText: details.durationText || null,
        openToSoloFSkatt: details.openToSoloFSkatt,
      },
    });
  });

  const rawToken = await createListingToken(listing.id, "VERIFY_PUBLISH", 48);
  const verifyUrl = `${process.env.AUTH_URL ?? "http://localhost:3000"}/api/listings/verify?token=${rawToken}`;

  await sendVerifyPublishEmail({
    to: company.contactEmail,
    listingTitle: listing.title,
    verifyUrl,
  });

  return NextResponse.json({ ok: true, listingId: listing.id });
}

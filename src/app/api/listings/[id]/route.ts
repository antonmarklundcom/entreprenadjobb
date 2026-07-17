import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updateListingSchema } from "@/lib/validators";
import { verifyEditToken } from "@/lib/tokens";

type Params = { id: string };

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const { id } = await params;
  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing) {
    return NextResponse.json({ ok: false, error: "Annonsen hittades inte" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, listing });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<Params> },
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateListingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Ogiltiga uppgifter", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const valid = await verifyEditToken(parsed.data.token, id);
  if (!valid) {
    return NextResponse.json({ ok: false, error: "Ogiltig eller utgången länk" }, { status: 403 });
  }

  const fields = parsed.data;

  const listing = await db.listing.update({
    where: { id },
    data: {
      ...(fields.title !== undefined ? { title: fields.title } : {}),
      ...(fields.description !== undefined ? { description: fields.description } : {}),
      ...(fields.salaryText !== undefined ? { salaryText: fields.salaryText || null } : {}),
      ...(fields.scopeText !== undefined ? { scopeText: fields.scopeText || null } : {}),
      ...(fields.durationText !== undefined ? { durationText: fields.durationText || null } : {}),
      ...(fields.applyEmail !== undefined ? { applyEmail: fields.applyEmail || null } : {}),
      ...(fields.applyUrl !== undefined ? { applyUrl: fields.applyUrl || null } : {}),
      ...(fields.applyPhone !== undefined ? { applyPhone: fields.applyPhone || null } : {}),
    },
  });

  return NextResponse.json({ ok: true, listing });
}

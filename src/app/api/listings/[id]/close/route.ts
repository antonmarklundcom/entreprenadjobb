import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyEditToken } from "@/lib/tokens";

const closeSchema = z.object({ token: z.string().min(1) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = closeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Ogiltiga uppgifter" }, { status: 400 });
  }

  const valid = await verifyEditToken(parsed.data.token, id);
  if (!valid) {
    return NextResponse.json({ ok: false, error: "Ogiltig eller utgången länk" }, { status: 403 });
  }

  const listing = await db.listing.update({
    where: { id },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  return NextResponse.json({ ok: true, listing });
}

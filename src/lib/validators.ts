import { z } from "zod";

export const employmentTypeValues = [
  "ANSTALLNING",
  "LARLING",
  "UNDERENTREPRENOR",
] as const;

export const listingTypeValues = ["jobb", "uppdrag"] as const;
export type ListingType = (typeof listingTypeValues)[number];

// Step 2 — details (shared title/description/trade/city, plus one branch
// of employment-specific or assignment-specific fields).
export const listingDetailsSchema = z.object({
  title: z.string().min(5, "Titeln måste vara minst 5 tecken").max(120),
  description: z
    .string()
    .min(20, "Beskrivningen måste vara minst 20 tecken")
    .max(5000),
  tradeSlug: z.string().min(1, "Välj ett yrkesområde"),
  citySlug: z.string().min(1, "Välj en ort").optional().or(z.literal("")),
  employmentType: z.enum(employmentTypeValues),
  salaryText: z.string().max(200).optional().or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  scopeText: z.string().max(300).optional().or(z.literal("")),
  durationText: z.string().max(200).optional().or(z.literal("")),
  openToSoloFSkatt: z.boolean().default(true),
});

// Step 3 — employer / company info.
export const listingCompanySchema = z.object({
  companyName: z.string().min(2, "Företagsnamnet måste vara minst 2 tecken").max(160),
  orgNumber: z
    .string()
    .regex(/^\d{6}-\d{4}$/, "Ange org.nr i formatet XXXXXX-XXXX")
    .optional()
    .or(z.literal("")),
  contactEmail: z.email("Ange en giltig e-postadress"),
  contactPhone: z.string().max(40).optional().or(z.literal("")),
});

// Step 4 — how applicants/partners get in touch.
export const listingApplySchema = z
  .object({
    applyEmail: z.email("Ange en giltig e-postadress").optional().or(z.literal("")),
    applyUrl: z.url("Ange en giltig webbadress").optional().or(z.literal("")),
    applyPhone: z.string().max(40).optional().or(z.literal("")),
  })
  .refine(
    (data) => Boolean(data.applyEmail || data.applyUrl || data.applyPhone),
    { message: "Ange minst ett sätt att ansöka: e-post, länk eller telefon" },
  );

export const createListingSchema = z.object({
  listingType: z.enum(listingTypeValues),
  details: listingDetailsSchema,
  company: listingCompanySchema,
  apply: listingApplySchema,
});

export type CreateListingInput = z.infer<typeof createListingSchema>;

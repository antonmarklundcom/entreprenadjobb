import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.EMAIL_FROM ?? "Entreprenadjobb <noreply@entreprenadjobb.se>";

async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipping send to ${to}: ${subject}`);
    return;
  }
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) {
    console.error("[email] Resend send failed", error);
    throw new Error("Kunde inte skicka e-post");
  }
}

export async function sendVerifyPublishEmail(params: {
  to: string;
  listingTitle: string;
  verifyUrl: string;
}) {
  await sendEmail(
    params.to,
    "Bekräfta din annons på Entreprenadjobb",
    `<p>Hej!</p>
     <p>Bekräfta din e-postadress för att publicera annonsen <strong>${params.listingTitle}</strong> på Entreprenadjobb.se.</p>
     <p><a href="${params.verifyUrl}">Bekräfta och publicera annonsen</a></p>
     <p>Länken är giltig i 48 timmar.</p>`,
  );
}

export async function sendListingPublishedEmail(params: {
  to: string;
  listingTitle: string;
  listingUrl: string;
  editUrl: string;
}) {
  await sendEmail(
    params.to,
    "Din annons är publicerad",
    `<p>Hej!</p>
     <p>Din annons <strong>${params.listingTitle}</strong> är nu publicerad på Entreprenadjobb.se.</p>
     <p><a href="${params.listingUrl}">Visa annonsen</a></p>
     <p>Spara den här länken för att redigera eller avsluta annonsen senare:</p>
     <p><a href="${params.editUrl}">Hantera annonsen</a></p>`,
  );
}

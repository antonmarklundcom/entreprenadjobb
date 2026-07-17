import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://entreprenadjobb.se"),
  title: {
    default: "Entreprenadjobb – Jobb och uppdrag inom bygg",
    template: "%s | Entreprenadjobb",
  },
  description:
    "Gratis jobb- och uppdragsplattform för el, tak och solceller. Publicera jobb, lärlingsplatser eller uppdrag mellan företag.",
  openGraph: { type: "website", locale: "sv_SE", siteName: "Entreprenadjobb" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sv"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
      </body>
    </html>
  );
}

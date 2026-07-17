import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/konto/", "/logga-in"],
      },
    ],
    sitemap: "https://entreprenadjobb.se/sitemap.xml",
  };
}

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteName, siteUrl } from "@/lib/site";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${siteName} · 3D printed objects`,
    template: `%s · ${siteName}`,
  },
  description:
    "Depth & Dot makes custom 3D printed keychains, personal objects, and small-run printing. A studio portfolio. Inquire for a piece.",
  applicationName: siteName,
  openGraph: {
    type: "website",
    siteName,
    title: siteName,
    description: "Custom 3D printed keychains, personal objects, and small-run printing.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl(),
    description: "Custom 3D printed keychains, personalized objects, and small-run printing.",
    email: "depthanddot@gmail.com",
    telephone: "+639388528698",
  };

  return (
    <html lang="en" className={sans.variable}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <SiteHeader />
        <main id="content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

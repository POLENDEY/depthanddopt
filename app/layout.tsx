import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  contactEmail,
  contactPhone,
  facebookUrl,
  messengerUrl,
  ogImage,
  siteDescription,
  siteKeywords,
  siteName,
  siteTagline,
  siteUrl,
} from "@/lib/site";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${siteName} · ${siteTagline}`,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  keywords: siteKeywords,
  applicationName: siteName,
  authors: [{ name: siteName, url: siteUrl() }],
  creator: siteName,
  publisher: siteName,
  category: "shopping",
  alternates: { canonical: "/" },
  formatDetection: { telephone: true, email: true, address: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName,
    url: "/",
    title: `${siteName} · ${siteTagline}`,
    description: siteDescription,
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} · ${siteTagline}`,
    description: siteDescription,
    images: [ogImage.url],
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0d0d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const base = siteUrl();
  const business = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${base}/#business`,
    name: siteName,
    url: base,
    description: siteDescription,
    email: contactEmail,
    telephone: contactPhone,
    logo: `${base}/icon-512.png`,
    image: `${base}${ogImage.url}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Quezon City",
      addressRegion: "Metro Manila",
      addressCountry: "PH",
    },
    areaServed: { "@type": "Country", name: "Philippines" },
    knowsAbout: ["3D printing", "Custom keychains", "Spotify code keychains", "Personalized gifts"],
    sameAs: [facebookUrl],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: contactEmail,
      telephone: contactPhone,
      url: messengerUrl,
      areaServed: "PH",
      availableLanguage: ["English", "Filipino"],
    },
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${base}/#website`,
    name: siteName,
    url: base,
    inLanguage: "en-PH",
    publisher: { "@id": `${base}/#business` },
  };

  return (
    <html lang="en-PH" className={sans.variable}>
      <body>
        <JsonLd data={business} />
        <JsonLd data={website} />
        <SiteHeader />
        <main id="content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

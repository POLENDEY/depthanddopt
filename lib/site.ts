export const siteName = "Depth & Dot";
export const facebookUrl = "https://www.facebook.com/share/1aNFBYXzFm/";
export const messengerUrl = "https://m.me/1352682341264635";
export const contactEmail = "depthanddot@gmail.com";
export const contactPhone = "+639700981948";
export const siteTagline = "Custom 3D printed keychains and personalized gifts in the Philippines";
export const siteDescription =
  "Depth & Dot is a Quezon City 3D printing studio making custom name keychains, Spotify code keychains, articulated names, name magnets, bag charms, name plates, and event favors. Made to order and shipped across the Philippines.";
export const siteKeywords = [
  "3D printing Philippines",
  "custom keychain Philippines",
  "personalized keychain",
  "name keychain",
  "Spotify code keychain",
  "Spotify keychain Philippines",
  "articulated name keychain",
  "custom name magnet",
  "bag charm",
  "name plate",
  "event souvenirs Philippines",
  "personalized gifts Philippines",
  "3D printing Quezon City",
  "Depth & Dot",
];
export const ogImage = { url: "/og.jpg", width: 1200, height: 630, alt: "Custom 3D printed name keychains by Depth & Dot" };

export function siteUrl() {
  const configured = process.env.DD_PUBLIC_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

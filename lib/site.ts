export const siteName = "Depth & Dot";
export const facebookUrl = "https://www.facebook.com/share/1aNFBYXzFm/";

export function siteUrl() {
  return (process.env.DD_PUBLIC_URL || "http://localhost:3000").replace(/\/$/, "");
}

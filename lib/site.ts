export const siteName = "Depth & Dot";

export function siteUrl() {
  return (process.env.DD_PUBLIC_URL || "http://localhost:3000").replace(/\/$/, "");
}

import "server-only";
import { siteUrl } from "@/lib/site";

export async function submitToIndexNow(paths: string[]) {
  const key = process.env.INDEXNOW_KEY;
  const base = siteUrl();
  const host = new URL(base).hostname;
  if (!key || host === "localhost" || host.endsWith(".local")) return false;
  try {
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${base}/indexnow.txt`,
        urlList: paths.map((path) => `${base}${path}`),
      }),
      signal: AbortSignal.timeout(8000),
    });
    return response.ok;
  } catch (error) {
    console.error("IndexNow submission failed.", error);
    return false;
  }
}

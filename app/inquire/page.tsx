import type { Metadata } from "next";
import { Suspense } from "react";
import { InquiryForm } from "@/components/inquiry-form";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata({
  title: "Order a custom keychain or 3D print",
  description:
    "Ask Depth & Dot for a quote on a custom name keychain, Spotify code keychain, name magnet, event favors, or a small print run. Tell us the piece, the words on it, and how many you need.",
  path: "/inquire",
});

export default function InquirePage() {
  return (
    <section className="wrap page split">
      <div>
        <p className="eyebrow">Contact</p>
        <h1>Inquire</h1>
        <p className="lead">Tell us the piece, the words on it, and how many you need. We reply by email.</p>
      </div>
      <div className="panel">
        <Suspense fallback={<p className="note">Loading the form.</p>}>
          <InquiryForm />
        </Suspense>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { InquiryForm } from "@/components/inquiry-form";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Inquire",
  description: "Ask Depth & Dot about a custom 3D print or a small print run.",
};

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

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MessengerIcon } from "@/components/messenger-icon";
import { products } from "@/lib/products";
import { messengerUrl } from "@/lib/site";

type Sent = { name: string; email: string; interest: string; reference?: string };

export function InquiryForm() {
  const params = useSearchParams();
  const requested = params.get("interest") || "";
  const from = params.get("from") || "";
  const label = params.get("label") || "";
  const sourcePath = /^\/[a-z0-9/-]*$/.test(from) ? from : "/inquire";
  const sourceLabel = label && label.length <= 80 ? label : "Inquire form";
  const interest = products.some((product) => product.title === requested) ? requested : "Monogram keychain";
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<Sent | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const response = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    const data = (await response?.json().catch(() => ({}))) as { error?: string; reference?: string } | undefined;
    if (!response?.ok) {
      setStatus("error");
      setMessage(data?.error || "The inquiry could not be sent. Please try again.");
      return;
    }
    form.reset();
    setSent({ name: body.name, email: body.email, interest: body.interest, reference: data?.reference });
    setStatus("sent");
  }

  if (status === "sent" && sent) {
    return (
      <InquirySuccess
        sent={sent}
        onAnother={() => {
          setSent(null);
          setStatus("idle");
        }}
      />
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <p className="note">This inquiry is marked as coming from {sourceLabel}.</p>
      <input type="hidden" name="sourceLabel" value={sourceLabel} />
      <input type="hidden" name="sourcePath" value={sourcePath} />
      <label>
        Name
        <input name="name" autoComplete="name" required minLength={2} maxLength={80} />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" inputMode="email" required maxLength={120} />
      </label>
      <label>
        Phone <span className="note">(optional)</span>
        <input name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={40} />
      </label>
      <label>
        Product
        <select name="interest" required defaultValue={interest}>
          {products.map((product) => (
            <option key={product.slug}>{product.title}</option>
          ))}
          <option>Something else</option>
        </select>
      </label>
      <label>
        Message
        <textarea name="message" required minLength={10} maxLength={2000} autoComplete="off" />
      </label>
      <label className="honeypot" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      {status === "error" ? <p className="error">{message}</p> : null}
      <button className="button" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending" : "Send inquiry"}
      </button>
    </form>
  );
}

function InquirySuccess({ sent, onAnother }: { sent: Sent; onAnother: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstName = sent.name.trim().split(/\s+/)[0] || "there";

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="inquiry-success" role="status">
      <svg className="inquiry-success-mark" width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
        <circle className="inquiry-success-ring" cx="36" cy="36" r="33" />
        <path className="inquiry-success-check" d="M23 37.5l9 9 17-19" />
        <circle className="inquiry-success-dot" cx="58" cy="58" r="6" />
      </svg>

      <p className="inquiry-success-eyebrow">Inquiry received</p>
      <h2 className="inquiry-success-title" ref={headingRef} tabIndex={-1}>
        Thank you, {firstName}!
      </h2>
      <p className="inquiry-success-lead">
        Your idea is with us. We will reply to <strong>{sent.email}</strong> with a quote and any questions about your
        piece.
      </p>

      <dl className="inquiry-success-summary">
        <div>
          <dt>Product</dt>
          <dd>{sent.interest}</dd>
        </div>
        {sent.reference ? (
          <div>
            <dt>Reference</dt>
            <dd>#{sent.reference}</dd>
          </div>
        ) : null}
      </dl>

      <ol className="inquiry-success-steps">
        <li>
          <span>1</span>We read your message and check the details.
        </li>
        <li>
          <span>2</span>We email you a quote and confirm the design.
        </li>
        <li>
          <span>3</span>Once you approve, we print and prepare your piece.
        </li>
      </ol>

      <div className="inquiry-success-actions">
        <a className="button" href={messengerUrl} target="_blank" rel="noopener noreferrer">
          <MessengerIcon size={16} />
          Chat on Messenger
        </a>
        <Link className="button secondary" href="/product">
          Browse products
        </Link>
      </div>
      <button className="inquiry-success-again" type="button" onClick={onAnother}>
        Send another inquiry
      </button>
    </div>
  );
}

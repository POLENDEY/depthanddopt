"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { products } from "@/lib/products";

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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setStatus("error");
      setMessage(data.error || "The inquiry could not be sent. Please try again.");
      return;
    }
    form.reset();
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <p className="ok" role="status">
        Received. We will reply by email.
      </p>
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

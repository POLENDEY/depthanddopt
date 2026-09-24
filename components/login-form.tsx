"use client";

import { useState } from "react";

export function LoginForm() {
  const [error, setError] = useState("");
  const [qr, setQr] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string; qr?: string; ok?: boolean };
    setPending(false);
    if (data.qr) setQr(data.qr);
    if (!response.ok) {
      setError(data.error || "Could not sign in.");
      return;
    }
    if (data.ok) window.location.assign("/studio");
  }

  return (
    <form onSubmit={onSubmit}>
      <label>
        Email
        <input name="email" type="email" autoComplete="username" inputMode="email" required />
      </label>
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <label>
        Authenticator code
        <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} />
      </label>
      {qr ? (
        <p>
          <img src={qr} alt="QR code for Google Authenticator" width={220} height={220} />
        </p>
      ) : (
        <p className="note">Enter the 6-digit code from Google Authenticator. The first visit shows a QR code to scan.</p>
      )}
      {error ? <p className="error">{error}</p> : null}
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Checking" : "Continue"}
      </button>
    </form>
  );
}

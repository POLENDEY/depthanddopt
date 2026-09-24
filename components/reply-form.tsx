"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReplyForm({ id, email, subject }: { id: string; email: string; subject: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch(`/api/admin/inquiries/${id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(data.error || "The reply was not sent.");
      return;
    }
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <p className="note">Reply goes to {email} through the studio email.</p>
      <label>
        Subject
        <input name="subject" required maxLength={140} defaultValue={subject} />
      </label>
      <label>
        Message
        <textarea name="body" required minLength={2} maxLength={5000} />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Sending" : "Send reply"}
      </button>
    </form>
  );
}

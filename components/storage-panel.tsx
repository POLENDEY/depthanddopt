"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "auto" | "primary" | "atlas";
type Store = "primary" | "atlas";

export type StoragePanelStatus = {
  mode: Mode;
  active: Store | null;
  reason: string;
  primary: { online: boolean; sizeMb: number | null; capacityMb: number; count: number | null; lastPing: string | null };
  atlas: { configured: boolean; online: boolean; count: number | null; lastPing: string | null };
};

const storeNames: Record<Store, string> = { primary: "Supabase", atlas: "MongoDB Atlas" };

const modeOptions: { value: Mode; label: string; detail: string }[] = [
  { value: "auto", label: "Automatic", detail: "Supabase first, then Atlas once Supabase is full." },
  { value: "primary", label: "Supabase", detail: "Always save to Supabase. Atlas is used only if Supabase fails." },
  { value: "atlas", label: "MongoDB Atlas", detail: "Always save to Atlas. Supabase is used only if Atlas fails." },
];

function pingLabel(iso: string | null) {
  if (!iso) return "Never";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export function StoragePanel({ status }: { status: StoragePanelStatus }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(status.mode);
  const [pending, setPending] = useState<"" | "save" | "ping">("");
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const { primary, atlas } = status;
  const usage = primary.sizeMb === null ? 0 : Math.min(100, (primary.sizeMb / primary.capacityMb) * 100);

  async function send(body: object, kind: "save" | "ping") {
    setPending(kind);
    setMessage(null);
    const response = await fetch("/api/admin/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    const data = (await response?.json().catch(() => ({}))) as { error?: string; primary?: boolean; atlas?: boolean | null };
    setPending("");
    if (!response?.ok) {
      setMessage({ text: data?.error || "Something went wrong. Try again.", error: true });
      return;
    }
    if (kind === "ping") {
      const parts = [`Supabase ${data.primary ? "responded" : "did not respond"}`];
      if (data.atlas !== null) parts.push(`Atlas ${data.atlas ? "responded" : "did not respond"}`);
      setMessage({ text: `${parts.join(", ")}.`, error: !data.primary || data.atlas === false });
    } else {
      setMessage({ text: "Saved. New inquiries will follow this setting.", error: false });
    }
    router.refresh();
  }

  return (
    <section className="storage-panel" aria-labelledby="storage-heading">
      <div className="storage-head">
        <div>
          <p className="kicker" id="storage-heading">Inquiry database</p>
          <p className="storage-active">
            <span className={`storage-dot ${status.active ? "is-on" : "is-off"}`} aria-hidden="true" />
            {status.active ? (
              <>
                New inquiries are saving to <strong>{storeNames[status.active]}</strong>
              </>
            ) : (
              <strong>No database is reachable</strong>
            )}
          </p>
          <p className="note">{status.reason}</p>
        </div>
        <button className="button secondary" type="button" onClick={() => send({ action: "ping" }, "ping")} disabled={Boolean(pending)}>
          {pending === "ping" ? "Pinging" : "Ping databases now"}
        </button>
      </div>

      <div className="storage-cards">
        <article className={`storage-card${status.active === "primary" ? " is-active" : ""}`}>
          <div className="storage-card-top">
            <h2>Supabase</h2>
            <span className={`storage-badge ${primary.online ? "is-on" : "is-off"}`}>{primary.online ? "Online" : "Offline"}</span>
          </div>
          <p className="note">Main database</p>
          <div className="storage-meter" role="meter" aria-label="Supabase storage used" aria-valuemin={0} aria-valuemax={primary.capacityMb} aria-valuenow={primary.sizeMb ?? 0}>
            <span style={{ width: `${usage}%` }} className={usage >= 90 ? "is-high" : undefined} />
          </div>
          <dl className="storage-stats">
            <div><dt>Used</dt><dd>{primary.sizeMb === null ? "-" : `${primary.sizeMb} of ${primary.capacityMb} MB`}</dd></div>
            <div><dt>Inquiries</dt><dd>{primary.count ?? "-"}</dd></div>
            <div><dt>Last keep-alive</dt><dd>{pingLabel(primary.lastPing)}</dd></div>
          </dl>
        </article>

        <article className={`storage-card${status.active === "atlas" ? " is-active" : ""}`}>
          <div className="storage-card-top">
            <h2>MongoDB Atlas</h2>
            <span className={`storage-badge ${atlas.online ? "is-on" : "is-off"}`}>
              {!atlas.configured ? "Not set up" : atlas.online ? "Online" : "Offline"}
            </span>
          </div>
          <p className="note">Backup database</p>
          <dl className="storage-stats">
            <div><dt>Inquiries</dt><dd>{atlas.count ?? "-"}</dd></div>
            <div><dt>Last keep-alive</dt><dd>{pingLabel(atlas.lastPing)}</dd></div>
          </dl>
        </article>
      </div>

      <form
        className="storage-form"
        onSubmit={(event) => {
          event.preventDefault();
          send({ mode }, "save");
        }}
      >
        <fieldset>
          <legend className="kicker">Where should new inquiries go?</legend>
          <div className="storage-options">
            {modeOptions.map((option) => (
              <label key={option.value} className={`storage-option${mode === option.value ? " is-selected" : ""}`}>
                <input
                  type="radio"
                  name="mode"
                  value={option.value}
                  checked={mode === option.value}
                  disabled={option.value === "atlas" && !atlas.configured}
                  onChange={() => setMode(option.value)}
                />
                <span>
                  <strong>{option.label}</strong>
                  <span className="note">{option.detail}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="storage-actions">
          <button className="button" type="submit" disabled={Boolean(pending) || mode === status.mode}>
            {pending === "save" ? "Saving" : "Save setting"}
          </button>
          {message ? (
            <p className={message.error ? "error" : "note"} role="status">{message.text}</p>
          ) : null}
        </div>
      </form>
      <p className="note storage-foot">
        Both databases are pinged automatically once a day so the free plans never pause them. Existing inquiries stay where they were saved and always show in the list below.
      </p>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ReplyForm } from "@/components/reply-form";

export type StudioReply = {
  id: string;
  inquiry_id: string;
  subject: string;
  body: string;
  sent_at: string;
};

export type StudioInquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  interest: string;
  source_label: string | null;
  source_path: string | null;
  message: string;
  status: string;
  created_at: string;
  replies: StudioReply[];
};

export function StudioTabs({ inquiries }: { inquiries: StudioInquiry[] }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const inquiry = inquiries.find((item) => item.id === openId) ?? null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (inquiry && !dialog.open) dialog.showModal();
    if (!inquiry && dialog.open) dialog.close();
  }, [inquiry]);

  function close() {
    setOpenId(null);
    setError("");
  }

  async function open(item: StudioInquiry) {
    setError("");
    setOpenId(item.id);
    if (item.status !== "new") return;
    await fetch(`/api/admin/inquiries/${item.id}`, { method: "PATCH" });
    router.refresh();
  }

  async function remove() {
    if (!inquiry || pending) return;
    if (!window.confirm(`Delete the inquiry from ${inquiry.name}?`)) return;
    setPending(true);
    setError("");
    const response = await fetch(`/api/admin/inquiries/${inquiry.id}`, { method: "DELETE" });
    setPending(false);
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error || "The inquiry was not deleted.");
      return;
    }
    close();
    router.refresh();
  }

  return (
    <div>
      {inquiries.length === 0 ? (
        <p className="note">No inquiries yet.</p>
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>From</th>
                <th>Product</th>
                <th>Came from</th>
                <th>Status</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((item) => (
                <tr key={item.id}>
                  <td>
                    <button className="inquiry-open" type="button" onClick={() => open(item)}>
                      {item.name}
                    </button>
                    <div className="note">{item.email}</div>
                  </td>
                  <td>{item.interest}</td>
                  <td>
                    {item.source_label || "Inquire form"}
                    {item.source_path ? <div className="note">{item.source_path}</div> : null}
                  </td>
                  <td className="status">{item.status}</td>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <dialog className="lightbox inquiry-dialog" ref={dialogRef} onClose={close}>
        {inquiry ? (
          <div>
            <div className="lightbox-bar">
              <button className="button secondary" type="button" onClick={close}>
                Close
              </button>
            </div>
            <p className="kicker">{inquiry.status}</p>
            <h2>{inquiry.name}</h2>
            <p className="note">
              {inquiry.email}
              {inquiry.phone ? ` · ${inquiry.phone}` : ""}
            </p>
            <p className="kicker">Product · {inquiry.interest}</p>
            <p className="note">
              Came from {inquiry.source_label || "Inquire form"}
              {inquiry.source_path ? ` (${inquiry.source_path})` : ""}
              {" · "}
              {new Date(inquiry.created_at).toLocaleString()}
            </p>
            <p className="inquiry-message">{inquiry.message}</p>
            {inquiry.replies.map((reply) => (
              <article className="reply" key={reply.id}>
                <strong>{reply.subject}</strong>
                <p>{reply.body}</p>
                <p className="note">{new Date(reply.sent_at).toLocaleString()}</p>
              </article>
            ))}
            <ReplyForm id={inquiry.id} email={inquiry.email} subject={`Re: ${inquiry.interest}`} />
            {error ? <p className="error">{error}</p> : null}
            <button className="button secondary" type="button" onClick={remove} disabled={pending}>
              {pending ? "Deleting" : "Delete inquiry"}
            </button>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}

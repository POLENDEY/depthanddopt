import Link from "next/link";
import { notFound } from "next/navigation";
import { ReplyForm } from "@/components/reply-form";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type Inquiry = {
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
};

type Reply = { id: string; subject: string; body: string; sent_at: string };

export default async function InquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inquiryResult = await db().query<Inquiry>(
    "SELECT id, name, email, phone, interest, source_label, source_path, message, status, created_at FROM depth_dot.inquiries WHERE id = $1",
    [id],
  );
  const inquiry = inquiryResult.rows[0];
  if (!inquiry) notFound();

  if (inquiry.status === "new") {
    await db().query("UPDATE depth_dot.inquiries SET status = 'read' WHERE id = $1", [id]);
  }

  const replies = await db().query<Reply>(
    "SELECT id, subject, body, sent_at FROM depth_dot.inquiry_replies WHERE inquiry_id = $1 ORDER BY sent_at ASC",
    [id],
  );

  return (
    <section className="wrap page split">
      <div>
        <Link className="text-link" href="/studio">All inquiries</Link>
        <h1>{inquiry.name}</h1>
        <p className="note">{inquiry.email}{inquiry.phone ? ` · ${inquiry.phone}` : ""}</p>
        <p className="kicker">Product · {inquiry.interest}</p>
        <p className="note">Came from {inquiry.source_label || "Inquire form"}{inquiry.source_path ? ` (${inquiry.source_path})` : ""}</p>
        <p>{inquiry.message}</p>
        {replies.rows.map((reply) => (
          <article className="reply" key={reply.id}>
            <strong>{reply.subject}</strong>
            <p>{reply.body}</p>
            <p className="note">{new Date(reply.sent_at).toLocaleString()}</p>
          </article>
        ))}
      </div>
      <div className="panel">
        <ReplyForm id={inquiry.id} email={inquiry.email} subject={`Re: ${inquiry.interest}`} />
      </div>
    </section>
  );
}

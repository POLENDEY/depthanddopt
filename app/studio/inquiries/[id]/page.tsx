import Link from "next/link";
import { notFound } from "next/navigation";
import { ReplyForm } from "@/components/reply-form";
import { getInquiry, markInquiryRead } from "@/lib/inquiry-store";

export const dynamic = "force-dynamic";

export default async function InquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inquiry = await getInquiry(id);
  if (!inquiry) notFound();

  if (inquiry.status === "new") await markInquiryRead(id);

  return (
    <section className="wrap page split">
      <div>
        <Link className="text-link" href="/studio">All inquiries</Link>
        <h1>{inquiry.name}</h1>
        <p className="note">{inquiry.email}{inquiry.phone ? ` · ${inquiry.phone}` : ""}</p>
        <p className="kicker">Product · {inquiry.interest}</p>
        <p className="note">Came from {inquiry.source_label || "Inquire form"}{inquiry.source_path ? ` (${inquiry.source_path})` : ""}</p>
        <p>{inquiry.message}</p>
        {inquiry.store === "atlas" ? <p className="note">Saved in the backup database (Atlas).</p> : null}
        {inquiry.replies.map((reply) => (
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

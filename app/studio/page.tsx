import { StudioTabs } from "@/components/studio-tabs";
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

type Reply = {
  id: string;
  inquiry_id: string;
  subject: string;
  body: string;
  sent_at: string;
};

export default async function StudioPage() {
  const result = await db().query<Inquiry>(
    "SELECT id, name, email, phone, interest, source_label, source_path, message, status, created_at FROM depth_dot.inquiries ORDER BY created_at DESC LIMIT 100",
  );
  const replies = result.rows.length
    ? await db().query<Reply>(
        "SELECT id, inquiry_id, subject, body, sent_at FROM depth_dot.inquiry_replies WHERE inquiry_id = ANY($1::uuid[]) ORDER BY sent_at ASC",
        [result.rows.map((inquiry) => inquiry.id)],
      )
    : { rows: [] as Reply[] };

  return (
    <section className="wrap page">
      <p className="eyebrow">Private</p>
      <h1>Studio</h1>
      <form action="/api/admin/logout" method="post">
        <button className="button secondary" type="submit">Sign out</button>
      </form>
      <StudioTabs
        inquiries={result.rows.map((inquiry) => ({
          ...inquiry,
          created_at: new Date(inquiry.created_at).toISOString(),
          replies: replies.rows
            .filter((reply) => reply.inquiry_id === inquiry.id)
            .map((reply) => ({ ...reply, sent_at: new Date(reply.sent_at).toISOString() })),
        }))}
      />
    </section>
  );
}

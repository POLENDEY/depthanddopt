import { StudioTabs } from "@/components/studio-tabs";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  interest: string;
  source_label: string | null;
  source_path: string | null;
  status: string;
  created_at: string;
};

export default async function StudioPage() {
  const result = await db().query<Inquiry>(
    "SELECT id, name, email, interest, source_label, source_path, status, created_at FROM depth_dot.inquiries ORDER BY created_at DESC LIMIT 100",
  );

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
        }))}
      />
    </section>
  );
}

import Link from "next/link";
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
      <p className="eyebrow">Inquiries</p>
      <h1>Studio</h1>
      <form action="/api/admin/logout" method="post">
        <button className="button secondary" type="submit">Sign out</button>
      </form>
      {result.rows.length === 0 ? (
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
            {result.rows.map((inquiry) => (
              <tr key={inquiry.id}>
                <td>
                  <Link href={`/studio/inquiries/${inquiry.id}`}>{inquiry.name}</Link>
                  <div className="note">{inquiry.email}</div>
                </td>
                <td>{inquiry.interest}</td>
                <td>
                  {inquiry.source_label || "Inquire form"}
                  {inquiry.source_path ? <div className="note">{inquiry.source_path}</div> : null}
                </td>
                <td className="status">{inquiry.status}</td>
                <td>{new Date(inquiry.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </section>
  );
}

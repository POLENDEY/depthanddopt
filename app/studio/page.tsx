import { StoragePanel } from "@/components/storage-panel";
import { StudioTabs } from "@/components/studio-tabs";
import { listInquiries } from "@/lib/inquiry-store";
import { storageStatus } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const [{ inquiries, atlasError, primaryError }, status] = await Promise.all([listInquiries(100), storageStatus()]);

  return (
    <section className="wrap page">
      <p className="eyebrow">Private</p>
      <h1>Studio</h1>
      <form action="/api/admin/logout" method="post">
        <button className="button secondary" type="submit">Sign out</button>
      </form>
      <StoragePanel status={status} />
      {primaryError ? (
        <p className="error" role="status">
          The main database (Supabase) could not be reached, so some inquiries may be missing from this list.
        </p>
      ) : null}
      {atlasError ? (
        <p className="error" role="status">
          The backup database (Atlas) could not be reached, so some inquiries may be missing from this list.
        </p>
      ) : null}
      <StudioTabs
        inquiries={inquiries.map((inquiry) => ({
          ...inquiry,
          created_at: new Date(inquiry.created_at).toISOString(),
          replies: inquiry.replies.map((reply) => ({ ...reply, sent_at: new Date(reply.sent_at).toISOString() })),
        }))}
      />
    </section>
  );
}

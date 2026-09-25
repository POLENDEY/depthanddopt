"use client";

import Link from "next/link";
import { useState } from "react";
import { PrintPrice } from "@/components/print-price";

export type StudioInquiry = {
  id: string;
  name: string;
  email: string;
  interest: string;
  source_label: string | null;
  source_path: string | null;
  status: string;
  created_at: string;
};

export function StudioTabs({ inquiries }: { inquiries: StudioInquiry[] }) {
  const [tab, setTab] = useState<"inquiries" | "price">("inquiries");

  return (
    <div>
      <div className="studio-tabs" role="tablist" aria-label="Studio">
        <button type="button" role="tab" aria-selected={tab === "inquiries"} onClick={() => setTab("inquiries")}>
          Inquiries
        </button>
        <button type="button" role="tab" aria-selected={tab === "price"} onClick={() => setTab("price")}>
          Print price
        </button>
      </div>
      {tab === "inquiries" ? (
        <div role="tabpanel">
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
                  {inquiries.map((inquiry) => (
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
        </div>
      ) : (
        <div role="tabpanel">
          <PrintPrice />
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type GalleryPhoto = {
  id: string;
  slug: string;
  product: string;
  url: string;
  alt: string;
  style: "white" | "raw";
  published: boolean;
  bytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
};

const storageLimit = 1024 * 1024 * 1024;

function size(bytes: number) {
  if (bytes === 0) return "0 KB";
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function PhotoGallery({ photos: initial, products }: { photos: GalleryPhoto[]; products: { slug: string; title: string }[] }) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initial);
  const [product, setProduct] = useState("all");
  const [status, setStatus] = useState<"all" | "live" | "draft">("all");
  const [open, setOpen] = useState<GalleryPhoto | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => setPhotos(initial), [initial]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const visible = useMemo(
    () =>
      photos.filter(
        (photo) =>
          (product === "all" || photo.slug === product) &&
          (status === "all" || (status === "live" ? photo.published : !photo.published)),
      ),
    [photos, product, status],
  );
  const used = photos.reduce((sum, photo) => sum + photo.bytes, 0);
  const usage = Math.min(100, (used / storageLimit) * 100);

  async function remove(photo: GalleryPhoto) {
    if (!window.confirm(`Delete this photo of ${photo.product}? It is removed from the website and storage right away.`)) return;
    setBusy(true);
    const response = await fetch(`/api/admin/products/${encodeURIComponent(photo.slug)}/photos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: photo.id }),
    }).catch(() => null);
    setBusy(false);
    if (!response?.ok) {
      setMessage({ text: "The photo was not deleted. Try again.", error: true });
      return;
    }
    setPhotos((current) => current.filter((item) => item.id !== photo.id));
    setOpen(null);
    setMessage({ text: "Photo deleted.", error: false });
    router.refresh();
  }

  return (
    <section className="photo-manager" aria-labelledby="gallery-heading">
      <div className="photo-manager-head">
        <div>
          <p className="kicker" id="gallery-heading">Gallery</p>
          <p className="storage-active">
            {photos.length} {photos.length === 1 ? "photo" : "photos"} uploaded
          </p>
        </div>
        <div className="gallery-usage">
          <span className="note">
            Storage used: {size(used)} of 1 GB free plan
          </span>
          <div className="storage-meter" role="meter" aria-label="Photo storage used" aria-valuemin={0} aria-valuemax={storageLimit} aria-valuenow={used}>
            <span style={{ width: `${usage}%` }} className={usage >= 90 ? "is-high" : undefined} />
          </div>
        </div>
      </div>

      <div className="gallery-filters">
        <label className="photo-product-picker">
          <span className="note">Product</span>
          <select value={product} onChange={(event) => setProduct(event.target.value)}>
            <option value="all">All products</option>
            {products.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.title} ({photos.filter((photo) => photo.slug === item.slug).length})
              </option>
            ))}
          </select>
        </label>
        <div className="studio-tabs" role="tablist" aria-label="Status">
          {(["all", "live", "draft"] as const).map((value) => (
            <button key={value} type="button" role="tab" aria-selected={status === value} onClick={() => setStatus(value)}>
              {value === "all" ? "All" : value === "live" ? "Live" : "Drafts"}
            </button>
          ))}
        </div>
      </div>

      {message ? <p className={message.error ? "error" : "note"} role="status">{message.text}</p> : null}

      {visible.length === 0 ? (
        <p className="note">
          {photos.length === 0 ? "No photos uploaded yet. Add them from the Products tab." : "No photos match these filters."}
        </p>
      ) : (
        <ul className="photo-grid gallery-grid">
          {visible.map((photo) => (
            <li key={photo.id} className="photo-tile">
              <button type="button" className="photo-tile-image" onClick={() => setOpen(photo)} aria-label={`Preview ${photo.product} photo`}>
                <img src={photo.url} alt="" width={400} height={400} loading="lazy" />
                {!photo.published ? <span className="photo-state-badge">Draft</span> : null}
              </button>
              <div className="photo-tile-actions">
                <strong className="gallery-product">{photo.product}</strong>
                <span className="note">
                  {size(photo.bytes)} · {photo.style === "white" ? "White + watermark" : "Raw"} · {new Date(photo.createdAt).toLocaleDateString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <dialog className="lightbox photo-preview-dialog" ref={dialogRef} onClose={() => setOpen(null)} aria-label="Photo preview">
        {open ? (
          <div>
            <div className="lightbox-bar">
              <span className="kicker">{open.product}</span>
              <button className="button secondary" type="button" onClick={() => setOpen(null)}>Close</button>
            </div>
            <img className="photo-preview-image" src={open.url} alt={open.alt} />
            <dl className="gallery-meta">
              <div><dt>Status</dt><dd>{open.published ? "Live on the website" : "Draft, not on the website yet"}</dd></div>
              <div><dt>Size</dt><dd>{size(open.bytes)}{open.width && open.height ? ` · ${open.width}×${open.height}` : ""}</dd></div>
              <div><dt>Alt text</dt><dd>{open.alt || "Not set"}</dd></div>
            </dl>
            <div className="photo-preview-nav">
              <a className="button secondary" href={`/studio/products?product=${encodeURIComponent(open.slug)}`}>Edit product</a>
              <a className="text-link" href={open.url} target="_blank" rel="noreferrer">Open full size</a>
              <button className="button secondary photo-delete" type="button" onClick={() => remove(open)} disabled={busy}>
                {busy ? "Deleting" : "Delete photo"}
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </section>
  );
}

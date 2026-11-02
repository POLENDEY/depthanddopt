"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ProductPreview, type PreviewPiece } from "@/components/product-preview";
import { preparePhoto, type PhotoStyle } from "@/lib/photo-prep";

export type EditorContent = {
  title: string;
  summary: string;
  description: string;
  details: string[];
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  photos: { id: string; alt: string }[];
  pieces: { slug: string; title: string; summary: string; photoId: string | null }[];
};

export type EditorPhoto = { id: string; url: string; width: number | null; height: number | null; alt: string; published: boolean };

export type EditorProduct = {
  slug: string;
  category: string;
  categoryPhrase: string;
  store: "primary" | "atlas";
  custom: boolean;
  artwork: string;
  pieces: PreviewPiece[];
  content: EditorContent;
  photos: EditorPhoto[];
  hasUnpublished: boolean;
  publishedAt: string | null;
  draftSavedAt: string | null;
};

type Pending = {
  key: string;
  file: File;
  source: File;
  preview: string;
  original: string;
  width: number;
  height: number;
  rotation: number;
  style: PhotoStyle;
  alt: string;
  name: string;
};

type Tile = { kind: "saved"; photo: EditorPhoto } | { kind: "pending"; item: Pending };
type Limits = { title: number; summary: number; description: number; seoTitle: number; seoDescription: number; alt: number };
type EditorCategory = { slug: string; title: string; summary: string; image: string };
type DatabaseOption = {
  online: boolean;
  sizeMb: number | null;
  capacityMb: number | null;
  photoStorageMb?: number | null;
  photoCapacityMb?: number | null;
};

const brand = "Depth & Dot";
const newCategoryOption = "__new";
const newProductOption = "__create_product";

function CreateProductForm({
  categories,
  databases,
}: {
  categories: EditorCategory[];
  databases: { primary: DatabaseOption; atlas: DatabaseOption & { configured: boolean } };
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [categorySlug, setCategorySlug] = useState(categories[0]?.slug ?? newCategoryOption);
  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [newCategorySummary, setNewCategorySummary] = useState("");
  const [store, setStore] = useState<"primary" | "atlas">(() =>
    databases.primary.online ? "primary" : databases.atlas.configured && databases.atlas.online ? "atlas" : "primary",
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const chosenDatabase = databases[store];
  const isNewCategory = categorySlug === newCategoryOption;
  const mongoAvailable = databases.atlas.configured && databases.atlas.online;
  const isAtCapacity = (database: DatabaseOption) =>
    (database.capacityMb !== null && database.sizeMb !== null && database.sizeMb >= database.capacityMb) ||
    (database.photoCapacityMb != null &&
      database.photoStorageMb != null &&
      database.photoStorageMb >= database.photoCapacityMb);
  const usageLabel = (database: DatabaseOption) =>
    [
      database.sizeMb === null
        ? "Database usage unavailable"
        : database.capacityMb === null
          ? `${database.sizeMb} MB database used · limit not configured`
          : `${database.sizeMb} of ${database.capacityMb} MB database used`,
      ...(database.photoStorageMb === undefined
        ? []
        : [
            database.photoStorageMb === null
              ? "Photo usage unavailable"
              : database.photoCapacityMb
                ? `${database.photoStorageMb} of ${database.photoCapacityMb} MB photos`
                : `${database.photoStorageMb} MB photos · limit not configured`,
          ]),
    ].join(" · ");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          description,
          store,
          ...(isNewCategory
            ? { newCategory: { title: newCategoryTitle, summary: newCategorySummary } }
            : { categorySlug }),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; slug?: string };
      if (!response.ok || !data.slug) throw new Error(data.error || "Product could not be created.");
      window.location.assign(`/studio/products?product=${encodeURIComponent(data.slug)}`);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Product could not be created.", error: true });
      setBusy(false);
    }
  }

  return (
    <section className="photo-manager" id="create-product-form" aria-labelledby="create-product-heading">
      <p className="kicker" id="create-product-heading">Add a product</p>
      <p className="note">Create a new catalog item, or add a category here if it does not exist yet.</p>
      <form className="editor-fields" onSubmit={submit}>
        <label className="editor-field">
          <span>Product name</span>
          <input id="create-product-name" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} required disabled={busy} />
        </label>
        <label className="editor-field">
          <span>Category</span>
          <select value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)} disabled={busy}>
            {categories.map((category) => <option key={category.slug} value={category.slug}>{category.title}</option>)}
            <option value={newCategoryOption}>+ Add a new category</option>
          </select>
        </label>
        {isNewCategory ? (
          <>
            <label className="editor-field">
              <span>New category name</span>
              <input value={newCategoryTitle} onChange={(event) => setNewCategoryTitle(event.target.value)} maxLength={80} required disabled={busy} />
            </label>
            <label className="editor-field">
              <span>Category description</span>
              <input value={newCategorySummary} onChange={(event) => setNewCategorySummary(event.target.value)} maxLength={160} disabled={busy} />
            </label>
          </>
        ) : null}
        <label className="editor-field is-wide">
          <span>Short summary</span>
          <input value={summary} onChange={(event) => setSummary(event.target.value)} maxLength={160} required disabled={busy} />
        </label>
        <label className="editor-field is-wide">
          <span>Description</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1200} rows={3} disabled={busy} />
        </label>
        <fieldset className="editor-field is-wide editor-database-options">
          <legend className="note">Save product data and photos to</legend>
          <label className={`storage-option${store === "primary" ? " is-selected" : ""}`}>
            <input
              type="radio"
              name="product-store"
              checked={store === "primary"}
              onChange={() => setStore("primary")}
              disabled={busy || !databases.primary.online || isAtCapacity(databases.primary)}
            />
            <span className="storage-option-copy">
              <span className="storage-option-heading">
                <strong>Supabase</strong>
                <span className={`storage-option-state${databases.primary.online ? " is-online" : " is-offline"}`}>
                  {databases.primary.online ? "Online" : "Offline"}
                </span>
              </span>
              <span className="note">{usageLabel(databases.primary)}</span>
            </span>
          </label>
          <label className={`storage-option${store === "atlas" ? " is-selected" : ""}`}>
            <input
              type="radio"
              name="product-store"
              checked={store === "atlas"}
              onChange={() => setStore("atlas")}
              disabled={busy || !mongoAvailable || isAtCapacity(databases.atlas)}
            />
            <span className="storage-option-copy">
              <span className="storage-option-heading">
                <strong>MongoDB Atlas</strong>
                <span className={`storage-option-state${mongoAvailable ? " is-online" : " is-offline"}`}>
                  {mongoAvailable ? "Online" : databases.atlas.configured ? "Offline" : "Not configured"}
                </span>
              </span>
              <span className="note">{databases.atlas.configured ? usageLabel(databases.atlas) : "Not configured"}</span>
            </span>
          </label>
          {!chosenDatabase.online ? <p className="error" role="status">This database is currently offline.</p> : null}
          {isAtCapacity(chosenDatabase) ? <p className="error" role="status">This database has reached its configured capacity limit.</p> : null}
        </fieldset>
        <div className="editor-field is-wide">
          <button className="button" type="submit" disabled={busy || !title.trim() || !summary.trim() || !chosenDatabase.online || isAtCapacity(chosenDatabase) || (store === "atlas" && !mongoAvailable)}>
            {busy ? "Creating product…" : "Create product"}
          </button>
          {message ? <p className={message.error ? "error" : "note"} role="status">{message.text}</p> : null}
        </div>
      </form>
    </section>
  );
}

function counter(value: string, max: number, ideal?: number) {
  const length = value.length;
  const state = length > max ? "is-over" : ideal && length > ideal ? "is-warn" : "";
  return (
    <span className={`field-count ${state}`}>
      {length}/{max}
    </span>
  );
}

function when(iso: string | null) {
  return iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";
}

async function upload(slug: string, item: Pending, publish: boolean, onPercent: (percent: number) => void) {
  let file = item.file;
  let width = item.width;
  let height = item.height;
  if (item.rotation) {
    const prepared = await preparePhoto(item.source, item.style, (update) => onPercent(Math.round(update.percent * 0.8)), item.rotation);
    file = prepared.file;
    width = prepared.width;
    height = prepared.height;
  }
  return new Promise<EditorPhoto>((resolve, reject) => {
    const form = new FormData();
    form.set("file", file);
    form.set("style", item.style);
    form.set("width", String(width));
    form.set("height", String(height));
    form.set("alt", item.alt);
    form.set("publish", String(publish));
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/admin/products/${encodeURIComponent(slug)}/photos`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const ratio = event.loaded / event.total;
        onPercent(Math.round(item.rotation ? 80 + ratio * 20 : ratio * 100));
      }
    };
    xhr.onload = () => {
      let data: { photo?: EditorPhoto & { alt: string | null }; error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && data.photo) resolve({ ...data.photo, alt: data.photo.alt ?? "" });
      else reject(new Error(data.error || "Upload failed."));
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection."));
    xhr.send(form);
  });
}

export function ProductEditor({
  products,
  siteBase,
  limits,
  initialSlug,
  categories,
  databases,
}: {
  products: EditorProduct[];
  siteBase: string;
  limits: Limits;
  initialSlug?: string;
  categories: EditorCategory[];
  databases: { primary: DatabaseOption; atlas: DatabaseOption & { configured: boolean } };
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(
    products.some((item) => item.slug === initialSlug) ? (initialSlug as string) : (products[0]?.slug ?? ""),
  );
  const product = products.find((item) => item.slug === slug) ?? products[0];
  const [content, setContent] = useState<EditorContent>(product.content);
  const [saved, setSaved] = useState<EditorPhoto[]>(product.photos);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dirty, setDirty] = useState(false);
  const [style, setStyle] = useState<PhotoStyle>("white");
  const [busy, setBusy] = useState<"" | "prepare" | "save" | "delete">("");
  const [progress, setProgress] = useState<{ label: string; percent: number } | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [preview, setPreview] = useState<{ index: number; before: boolean } | null>(null);
  const [pagePreview, setPagePreview] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  useEffect(() => () => pendingRef.current.forEach((item) => {
    URL.revokeObjectURL(item.preview);
    URL.revokeObjectURL(item.original);
  }), []);

  const unsaved = dirty || pending.length > 0;
  useEffect(() => {
    if (!unsaved && !busy) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved, busy]);

  const tiles: Tile[] = useMemo(
    () => [...saved.map((photo) => ({ kind: "saved" as const, photo })), ...pending.map((item) => ({ kind: "pending" as const, item }))],
    [saved, pending],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (preview && !dialog.open) dialog.showModal();
    if (!preview && dialog.open) dialog.close();
  }, [preview]);

  function edit<K extends keyof EditorContent>(key: K, value: EditorContent[K]) {
    setContent((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  function updatePiece(index: number, key: "title" | "summary" | "photoId", value: string | null) {
    setContent((current) => ({
      ...current,
      pieces: current.pieces.map((piece, pieceIndex) => (pieceIndex === index ? { ...piece, [key]: value } : piece)),
    }));
    setDirty(true);
  }

  function addPiece() {
    if (content.pieces.length >= 30) return;
    edit("pieces", [...content.pieces, { slug: crypto.randomUUID(), title: "", summary: "", photoId: null }]);
  }

  function removePiece(index: number) {
    edit("pieces", content.pieces.filter((_, pieceIndex) => pieceIndex !== index));
  }

  function clearPending() {
    pending.forEach((item) => {
      URL.revokeObjectURL(item.preview);
      URL.revokeObjectURL(item.original);
    });
    setPending([]);
  }

  function switchProduct(next: string) {
    if (unsaved && !window.confirm("You have changes that are not saved. Discard them and switch product?")) return;
    const nextProduct = products.find((item) => item.slug === next);
    if (!nextProduct) return;
    clearPending();
    setMessage(null);
    setSlug(next);
    setContent(nextProduct.content);
    setSaved(nextProduct.photos);
    setDirty(false);
  }

  async function onFiles(files: File[]) {
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (!images.length) return;
    setBusy("prepare");
    setMessage(null);
    const failures: string[] = [];
    for (const [index, file] of images.entries()) {
      const prefix = images.length > 1 ? `Photo ${index + 1} of ${images.length} · ` : "";
      try {
        const prepared = await preparePhoto(file, style, (update) =>
          setProgress({ label: `${prefix}${update.text}`, percent: Math.round(((index + update.percent / 100) / images.length) * 100) }),
        );
        const item: Pending = {
          key: `${Date.now()}-${index}-${file.name}`,
          file: prepared.file,
          source: file,
          preview: URL.createObjectURL(prepared.file),
          original: URL.createObjectURL(file),
          width: prepared.width,
          height: prepared.height,
          rotation: 0,
          style,
          alt: "",
          name: file.name,
        };
        setPending((current) => [...current, item]);
      } catch (error) {
        failures.push(`${file.name}: ${error instanceof Error ? error.message : "failed"}`);
      }
    }
    setBusy("");
    setProgress(null);
    setMessage(
      failures.length
        ? { text: `Could not prepare ${failures.join("; ")}`, error: true }
        : { text: "Ready. Nothing is uploaded yet. Check the previews, then Save as draft or Publish.", error: false },
    );
  }

  function moveSaved(index: number, to: number) {
    if (to < 0 || to >= saved.length) return;
    const next = [...saved];
    const [photo] = next.splice(index, 1);
    next.splice(to, 0, photo);
    setSaved(next);
    setDirty(true);
  }

  function setAlt(tile: Tile, alt: string) {
    if (tile.kind === "saved") setSaved((current) => current.map((photo) => (photo.id === tile.photo.id ? { ...photo, alt } : photo)));
    else setPending((current) => current.map((item) => (item.key === tile.item.key ? { ...item, alt } : item)));
    setDirty(true);
  }

  function rotatePending(item: Pending, degrees: number) {
    setPending((current) => current.map((entry) =>
      entry.key === item.key
        ? { ...entry, rotation: (entry.rotation + degrees + 360) % 360 }
        : entry,
    ));
  }

  function discard(item: Pending) {
    URL.revokeObjectURL(item.preview);
    URL.revokeObjectURL(item.original);
    setPending((current) => current.filter((entry) => entry.key !== item.key));
  }

  async function removeSaved(photo: EditorPhoto) {
    if (!window.confirm("Delete this photo? It is removed from storage right away.")) return;
    setBusy("delete");
    const response = await fetch(`/api/admin/products/${encodeURIComponent(product.slug)}/photos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: photo.id }),
    }).catch(() => null);
    setBusy("");
    if (!response?.ok) {
      setMessage({ text: "The photo was not deleted. Try again.", error: true });
      return;
    }
    setSaved((current) => current.filter((item) => item.id !== photo.id));
    if (content.pieces.some((piece) => piece.photoId === photo.id)) {
      setContent((current) => ({
        ...current,
        pieces: current.pieces.map((piece) => (piece.photoId === photo.id ? { ...piece, photoId: null } : piece)),
      }));
      setDirty(true);
    }
    setMessage({ text: "Photo deleted.", error: false });
    router.refresh();
  }

  async function removeProduct() {
    if (!window.confirm(`Delete “${content.title}” and all of its uploaded photos? This cannot be undone.`)) return;
    setBusy("delete");
    setMessage(null);
    const response = await fetch(`/api/admin/products/${encodeURIComponent(product.slug)}`, { method: "DELETE" }).catch(() => null);
    const data = (await response?.json().catch(() => ({}))) as { error?: string } | undefined;
    if (!response?.ok) {
      setBusy("");
      setMessage({ text: data?.error || "The product was not deleted. Try again.", error: true });
      return;
    }
    window.location.assign("/studio/products");
  }

  async function save(action: "draft" | "publish") {
    if (content.pieces.some((piece) => !piece.title.trim())) {
      setMessage({ text: "Give every variation a name or remove the empty variation before saving.", error: true });
      return;
    }
    setBusy("save");
    setMessage(null);
    const uploaded: EditorPhoto[] = [];
    try {
      for (const [index, item] of pending.entries()) {
        const label = `${item.rotation ? "Preparing and uploading" : "Uploading"} photo ${index + 1} of ${pending.length}`;
        const photo = await upload(product.slug, item, action === "publish", (percent) =>
          setProgress({ label, percent: Math.round(((index + percent / 100) / pending.length) * 100) }),
        );
        uploaded.push({ ...photo, alt: item.alt });
        discard(item);
      }
      setProgress(pending.length ? { label: "Saving details", percent: 100 } : null);
      const photos = [...saved, ...uploaded];
      const response = await fetch(`/api/admin/products/${encodeURIComponent(product.slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, content: { ...content, photos: photos.map((photo) => ({ id: photo.id, alt: photo.alt })) } }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; notified?: boolean };
      if (!response.ok) throw new Error(data.error || "Saving failed.");
      setSaved(action === "publish" ? photos.map((photo) => ({ ...photo, published: true })) : photos);
      setDirty(false);
      setMessage({
        text:
          action === "publish"
            ? `Published. The live product page updates within a few seconds${data.notified ? ", and search engines were notified" : ""}.`
            : "Draft saved. Visitors still see the published version until you click Publish.",
        error: false,
      });
      router.refresh();
    } catch (error) {
      if (uploaded.length) setSaved((current) => [...current, ...uploaded]);
      setMessage({ text: error instanceof Error ? error.message : "Saving failed.", error: true });
    } finally {
      setBusy("");
      setProgress(null);
    }
  }

  const pageTitle = content.seoTitle || `${content.title} · ${product.categoryPhrase}`;
  const pageDescription = content.seoDescription || content.description;
  const snippet = pageDescription.length > 158 ? `${pageDescription.slice(0, 155).trimEnd()}...` : pageDescription;
  const previewPieces = content.pieces.map((piece, index) => ({
    ...piece,
    image:
      saved.find((photo) => photo.id === piece.photoId)?.url ??
      product.pieces.find((savedPiece) => savedPiece.slug === piece.slug)?.image ??
      saved[index]?.url ??
      product.artwork,
  }));
  const current = preview ? tiles[preview.index] : null;
  const status = unsaved
    ? { text: "Unsaved changes", tone: "is-warn" }
    : product.hasUnpublished
      ? { text: `Draft saved ${when(product.draftSavedAt)}, not published yet`, tone: "is-warn" }
      : product.publishedAt
        ? { text: `Live · published ${when(product.publishedAt)}`, tone: "is-on" }
        : { text: "Live · built-in text", tone: "is-on" };

  return (
    <div className="product-editor">
      <CreateProductForm categories={categories} databases={databases} />
      <section className="photo-manager" aria-labelledby="editor-heading">
        <div className="photo-manager-head">
          <div>
            <p className="kicker" id="editor-heading">Product</p>
            <label className="photo-product-picker">
              <span className="note">Choose a product to edit</span>
              <select
                value={product.slug}
                onChange={(event) => {
                  if (event.target.value === newProductOption) {
                    document.getElementById("create-product-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
                    document.getElementById("create-product-name")?.focus({ preventScroll: true });
                    return;
                  }
                  switchProduct(event.target.value);
                }}
                disabled={Boolean(busy)}
              >
                {[...new Set(products.map((item) => item.category))].map((category) => (
                  <optgroup key={category} label={category}>
                    {products
                      .filter((item) => item.category === category)
                      .map((item) => (
                        <option key={item.slug} value={item.slug}>
                          {item.content.title} ({item.photos.length} {item.photos.length === 1 ? "photo" : "photos"})
                          {item.hasUnpublished ? " · draft" : ""}
                        </option>
                      ))}
                  </optgroup>
                ))}
                <option value={newProductOption}>+ Create a new product...</option>
              </select>
            </label>
            <div className="product-picker-actions">
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  document.getElementById("product-details-editor")?.scrollIntoView({ behavior: "smooth", block: "center" });
                  document.getElementById("product-title-editor")?.focus({ preventScroll: true });
                }}
                disabled={Boolean(busy)}
              >
                Edit selected
              </button>
              <button className="button secondary photo-delete" type="button" onClick={removeProduct} disabled={Boolean(busy)}>
                Delete selected
              </button>
            </div>
          </div>
          <div className="editor-status-block">
            <span className={`storage-badge ${status.tone}`}>{status.text}</span>
            <span className="note">Stored in {product.store === "atlas" ? "MongoDB Atlas" : "Supabase"}</span>
            <div className="editor-status-links">
              <button className="button secondary" type="button" onClick={() => setPagePreview(true)}>
                Preview
              </button>
              <a className="text-link" href={`/product/${product.slug}`} target="_blank" rel="noreferrer">
                View live page &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="photo-manager" aria-labelledby="photos-heading">
        <p className="kicker" id="photos-heading">Photos</p>
        <fieldset className="photo-style" disabled={Boolean(busy)}>
          <legend className="note">Style for the next photos you add</legend>
          <label className={`storage-option${style === "white" ? " is-selected" : ""}`}>
            <input type="radio" name="photo-style" checked={style === "white"} onChange={() => setStyle("white")} />
            <span>
              <strong>White background + logo watermark</strong>
              <span className="note">Removes the background, centers the product on white, and adds the Depth &amp; Dot logo.</span>
            </span>
          </label>
          <label className={`storage-option${style === "raw" ? " is-selected" : ""}`}>
            <input type="radio" name="photo-style" checked={style === "raw"} onChange={() => setStyle("raw")} />
            <span>
              <strong>Raw photo</strong>
              <span className="note">Keeps the original background. Resized and saved as WebP.</span>
            </span>
          </label>
        </fieldset>

        <label
          className={`photo-drop${busy ? " is-busy" : ""}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (!busy) onFiles(Array.from(event.dataTransfer.files));
          }}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={Boolean(busy)}
            onChange={(event) => {
              const picked = Array.from(event.target.files ?? []);
              event.target.value = "";
              onFiles(picked);
            }}
          />
          <strong>{busy === "prepare" ? "Preparing previews" : "Choose photos or drop them here"}</strong>
          <span className="note">Published photos appear in Variations &amp; Pieces in order; the cover fills any remaining pieces. Nothing uploads until you save.</span>
        </label>

        {progress ? (
          <div className="photo-progress" role="status">
            <div className="photo-progress-label">
              <span>{progress.label}</span>
              <span>{progress.percent}%</span>
            </div>
            <div className="storage-meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent} aria-label={progress.label}>
              <span style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
        ) : null}

        {tiles.length === 0 ? (
          <div className="photo-empty">
            <img src={product.artwork} alt="" width={96} height={96} />
            <p className="note">No photos yet. The site shows this placeholder artwork until you publish one.</p>
          </div>
        ) : (
          <ol className="photo-grid">
            {tiles.map((tile, index) => {
              const src = tile.kind === "saved" ? tile.photo.url : tile.item.preview;
              const alt = tile.kind === "saved" ? tile.photo.alt : tile.item.alt;
              const key = tile.kind === "saved" ? tile.photo.id : tile.item.key;
              return (
                <li key={key} className={`photo-tile${tile.kind === "pending" ? " is-pending" : ""}`}>
                  <button type="button" className="photo-tile-image" onClick={() => setPreview({ index, before: false })} aria-label={`Preview photo ${index + 1}`}>
                    <img
                      src={src}
                      alt=""
                      width={400}
                      height={400}
                      loading="lazy"
                      style={tile.kind === "pending" && tile.item.rotation ? { transform: `rotate(${tile.item.rotation}deg)` } : undefined}
                    />
                    {index === 0 ? <span className="photo-cover-badge">Cover</span> : null}
                    {tile.kind === "pending" ? (
                      <span className="photo-state-badge">Not uploaded</span>
                    ) : !tile.photo.published ? (
                      <span className="photo-state-badge">Draft</span>
                    ) : null}
                  </button>
                  <div className="photo-tile-actions">
                    <label className="photo-alt">
                      <span className="note">Alt text (describes the photo for Google)</span>
                      <input
                        value={alt}
                        maxLength={limits.alt}
                        placeholder={`${content.title}, photo ${index + 1}`}
                        onChange={(event) => setAlt(tile, event.target.value)}
                        disabled={Boolean(busy)}
                      />
                    </label>
                    <div className="photo-tile-row">
                      {tile.kind === "saved" ? (
                        <>
                          <button type="button" onClick={() => moveSaved(index, index - 1)} disabled={Boolean(busy) || index === 0} aria-label="Move earlier">&larr;</button>
                          <button type="button" onClick={() => moveSaved(index, index + 1)} disabled={Boolean(busy) || index >= saved.length - 1} aria-label="Move later">&rarr;</button>
                          {index > 0 ? (
                            <button type="button" onClick={() => moveSaved(index, 0)} disabled={Boolean(busy)}>Cover</button>
                          ) : null}
                          <button type="button" className="photo-delete" onClick={() => removeSaved(tile.photo)} disabled={Boolean(busy)}>Delete</button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => rotatePending(tile.item, -90)} disabled={Boolean(busy)} aria-label="Rotate photo counterclockwise" title="Rotate counterclockwise">↶</button>
                          <button type="button" onClick={() => rotatePending(tile.item, 90)} disabled={Boolean(busy)} aria-label="Rotate photo clockwise" title="Rotate clockwise">↷</button>
                          <button type="button" className="photo-delete" onClick={() => discard(tile.item)} disabled={Boolean(busy)}>Remove</button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="photo-manager" aria-labelledby="variations-heading">
        <p className="kicker" id="variations-heading">Variations &amp; Pieces</p>
        <p className="note">Add one entry for each style. Upload photos above and save them first, then assign a photo to each variation here.</p>
        <div className="editor-variation-list">
          {content.pieces.map((piece, index) => (
            <div className="editor-variation-row" key={piece.slug}>
              <label className="editor-field">
                <span>Variation name</span>
                <input value={piece.title} maxLength={80} onChange={(event) => updatePiece(index, "title", event.target.value)} disabled={Boolean(busy)} />
              </label>
              <label className="editor-field">
                <span>Short description</span>
                <input value={piece.summary} maxLength={160} onChange={(event) => updatePiece(index, "summary", event.target.value)} disabled={Boolean(busy)} />
              </label>
              <label className="editor-field is-wide">
                <span>Variation photo</span>
                <select
                  value={piece.photoId ?? ""}
                  onChange={(event) => updatePiece(index, "photoId", event.target.value || null)}
                  disabled={Boolean(busy)}
                >
                  <option value="">Use the next available photo or product cover</option>
                  {saved.map((photo) => (
                    <option key={photo.id} value={photo.id}>
                      {photo.alt || `Photo ${saved.indexOf(photo) + 1}`}{photo.published ? "" : " · draft"}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button secondary photo-delete" type="button" onClick={() => removePiece(index)} disabled={Boolean(busy)}>
                Remove variation
              </button>
            </div>
          ))}
        </div>
        <button className="button secondary" type="button" onClick={addPiece} disabled={Boolean(busy) || content.pieces.length >= 30}>
          Add variation
        </button>
      </section>

      <section className="photo-manager" id="product-details-editor" aria-labelledby="details-heading">
        <p className="kicker" id="details-heading">Product details</p>
        <div className="editor-fields">
          <label className="editor-field">
            <span>Product name {counter(content.title, limits.title)}</span>
            <input id="product-title-editor" value={content.title} maxLength={limits.title} onChange={(event) => edit("title", event.target.value)} disabled={Boolean(busy)} />
          </label>
          <label className="editor-field">
            <span>Short summary, shown on catalog cards {counter(content.summary, limits.summary)}</span>
            <input value={content.summary} maxLength={limits.summary} onChange={(event) => edit("summary", event.target.value)} disabled={Boolean(busy)} />
          </label>
          <label className="editor-field is-wide">
            <span>Description {counter(content.description, limits.description)}</span>
            <textarea rows={5} value={content.description} maxLength={limits.description} onChange={(event) => edit("description", event.target.value)} disabled={Boolean(busy)} />
          </label>
          <label className="editor-field is-wide">
            <span>Highlights, one per line (up to 8)</span>
            <textarea
              rows={4}
              value={content.details.join("\n")}
              onChange={(event) => edit("details", event.target.value.split("\n").slice(0, 8))}
              disabled={Boolean(busy)}
            />
          </label>
        </div>
      </section>

      <section className="photo-manager" aria-labelledby="seo-heading">
        <p className="kicker" id="seo-heading">Search engines (SEO)</p>
        <div className="editor-fields">
          <label className="editor-field">
            <span>Google title {counter(content.seoTitle, limits.seoTitle, 55)}</span>
            <input
              value={content.seoTitle}
              maxLength={limits.seoTitle}
              placeholder={`${content.title} · ${product.categoryPhrase}`}
              onChange={(event) => edit("seoTitle", event.target.value)}
              disabled={Boolean(busy)}
            />
            <small className="note">Leave empty to use the product name. Put the words people search first, for example &ldquo;Custom name keychain&rdquo;.</small>
          </label>
          <label className="editor-field">
            <span>Keywords, separated by commas</span>
            <input
              value={content.keywords.join(", ")}
              placeholder="name keychain, personalized gift, Philippines"
              onChange={(event) => edit("keywords", event.target.value.split(",").map((word) => word.trimStart()))}
              disabled={Boolean(busy)}
            />
            <small className="note">Phrases customers type, like &ldquo;customized keychain Philippines&rdquo;.</small>
          </label>
          <label className="editor-field is-wide">
            <span>Google description {counter(content.seoDescription, limits.seoDescription, 155)}</span>
            <textarea
              rows={3}
              value={content.seoDescription}
              maxLength={limits.seoDescription}
              placeholder="Leave empty to use the product description."
              onChange={(event) => edit("seoDescription", event.target.value)}
              disabled={Boolean(busy)}
            />
          </label>
        </div>
        <div className="serp-preview" aria-label="Google search result preview">
          <p className="note">Preview in Google</p>
          <div className="serp-card">
            <span className="serp-site">
              <img src="/icon.png" alt="" width={18} height={18} />
              <span>
                {brand}
                <small>{`${siteBase.replace(/^https?:\/\//, "")} › product › ${product.slug}`}</small>
              </span>
            </span>
            <span className="serp-title">{`${pageTitle} · ${brand}`}</span>
            <span className="serp-text">{snippet}</span>
          </div>
        </div>
      </section>

      <div className="editor-savebar" role="region" aria-label="Save changes">
        <div>
          {message ? <p className={message.error ? "error" : "note"} role="status">{message.text}</p> : (
            <p className="note">
              {pending.length
                ? `${pending.length} ${pending.length === 1 ? "photo is" : "photos are"} waiting. Nothing is uploaded yet.`
                : unsaved
                  ? "You have unsaved changes."
                  : "Everything is saved."}
            </p>
          )}
        </div>
        <div className="editor-savebar-actions">
          <button className="button secondary" type="button" onClick={() => setPagePreview(true)}>
            Preview
          </button>
          <button className="button secondary" type="button" onClick={() => save("draft")} disabled={Boolean(busy) || !unsaved}>
            {busy === "save" ? "Saving" : "Save as draft"}
          </button>
          <button className="button" type="button" onClick={() => save("publish")} disabled={Boolean(busy) || (!unsaved && !product.hasUnpublished)}>
            {busy === "save" ? "Saving" : "Publish"}
          </button>
        </div>
      </div>

      <dialog className="lightbox photo-preview-dialog" ref={dialogRef} onClose={() => setPreview(null)} aria-label="Photo preview">
        {current && preview ? (
          <div>
            <div className="lightbox-bar">
              {current.kind === "pending" ? (
                <div className="studio-tabs" role="tablist" aria-label="Compare">
                  <button type="button" role="tab" aria-selected={!preview.before} onClick={() => setPreview({ ...preview, before: false })}>After</button>
                  <button type="button" role="tab" aria-selected={preview.before} onClick={() => setPreview({ ...preview, before: true })}>Before</button>
                </div>
              ) : <span />}
              <button className="button secondary" type="button" onClick={() => setPreview(null)}>Close</button>
            </div>
            <img
              className="photo-preview-image"
              src={current.kind === "saved" ? current.photo.url : preview.before ? current.item.original : current.item.preview}
              alt={current.kind === "saved" ? current.photo.alt : current.item.alt}
              style={current.kind === "pending" && !preview.before && current.item.rotation ? { transform: `rotate(${current.item.rotation}deg)` } : undefined}
            />
            <div className="photo-preview-nav">
              <button type="button" className="button secondary" onClick={() => setPreview({ index: (preview.index - 1 + tiles.length) % tiles.length, before: false })} disabled={tiles.length < 2}>Previous</button>
              <span className="note">
                {preview.index + 1} of {tiles.length}
                {current.kind === "pending" ? ` · ${current.item.name} · not uploaded yet` : current.photo.published ? " · live" : " · draft"}
              </span>
              <button type="button" className="button secondary" onClick={() => setPreview({ index: (preview.index + 1) % tiles.length, before: false })} disabled={tiles.length < 2}>Next</button>
            </div>
          </div>
        ) : null}
      </dialog>

      <ProductPreview
        open={pagePreview}
        onClose={() => setPagePreview(false)}
        title={content.title || product.content.title}
        summary={content.summary}
        description={content.description}
        details={content.details}
        category={product.category}
        artwork={product.artwork}
        pieces={previewPieces}
        photos={tiles.map((tile, index) =>
          tile.kind === "saved"
            ? { ...tile.photo, alt: tile.photo.alt || `${content.title}, photo ${index + 1}` }
            : {
                id: tile.item.key,
                url: tile.item.preview,
                width: tile.item.width,
                height: tile.item.height,
                alt: tile.item.alt || `${content.title}, photo ${index + 1}`,
              },
        )}
        note={unsaved ? "Preview with unsaved changes" : product.hasUnpublished ? "Preview of the saved draft" : "Matches the live page"}
      />
    </div>
  );
}

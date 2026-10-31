import { PhotoGallery } from "@/components/photo-gallery";
import { StudioNav } from "@/components/studio-nav";
import { allPhotos } from "@/lib/product-photos";
import { products } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function StudioGalleryPage() {
  const photos = await allPhotos().catch(() => null);
  const titles = new Map(products.map((product) => [product.slug, product.title]));

  return (
    <section className="wrap page">
      <p className="eyebrow">Private</p>
      <h1>Studio</h1>
      <StudioNav current="/studio/gallery" />
      {photos === null ? (
        <p className="error" role="status">The gallery could not load because the database is unreachable. Refresh to try again.</p>
      ) : (
        <PhotoGallery
          products={products.map((product) => ({ slug: product.slug, title: product.title }))}
          photos={photos.map((photo) => ({
            id: photo.id,
            slug: photo.product_slug,
            product: titles.get(photo.product_slug) ?? photo.product_slug,
            url: photo.url,
            alt: photo.alt ?? "",
            style: photo.style,
            published: photo.published,
            bytes: photo.bytes ?? 0,
            width: photo.width,
            height: photo.height,
            createdAt: new Date(photo.created_at).toISOString(),
          }))}
        />
      )}
    </section>
  );
}

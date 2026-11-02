import { ProductEditor } from "@/components/product-editor";
import { StudioNav } from "@/components/studio-nav";
import { editorData, limits } from "@/lib/product-content";
import { phraseForCategory } from "@/lib/seo";
import { listCatalogCategories } from "@/lib/product-catalog";
import { storageStatus } from "@/lib/storage";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function StudioProductsPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const [data, { product: initialSlug }, categories, status] = await Promise.all([
    editorData(),
    searchParams,
    listCatalogCategories(),
    storageStatus(),
  ]);

  return (
    <section className="wrap page">
      <p className="eyebrow">Private</p>
      <h1>Studio</h1>
      <StudioNav current="/studio/products" />
      <ProductEditor
        siteBase={siteUrl()}
        initialSlug={initialSlug}
        limits={limits}
        categories={categories}
        databases={{
          primary: {
            online: status.primary.online,
            sizeMb: status.primary.sizeMb,
            capacityMb: status.primary.capacityMb,
            photoStorageMb: status.primary.photoStorageMb,
            photoCapacityMb: status.primary.photoCapacityMb,
          },
          atlas: {
            configured: status.atlas.configured,
            online: status.atlas.online,
            sizeMb: status.atlas.sizeMb,
            capacityMb: status.atlas.capacityMb,
          },
        }}
        products={data.map(({ product, content, photos, hasUnpublished, publishedAt, draftSavedAt }) => ({
          slug: product.slug,
          category: product.category,
          categoryPhrase: phraseForCategory(product.category),
          store: product.store ?? "primary",
          custom: Boolean(product.custom),
          artwork: product.image,
          pieces: product.pieces.map(({ slug, title, summary, image }) => ({ slug, title, summary, image })),
          content,
          photos,
          hasUnpublished,
          publishedAt,
          draftSavedAt,
        }))}
      />
    </section>
  );
}

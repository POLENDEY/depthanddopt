import { ProductEditor } from "@/components/product-editor";
import { StudioNav } from "@/components/studio-nav";
import { editorData, limits } from "@/lib/product-content";
import { categoryPhrase } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function StudioProductsPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const [data, { product: initialSlug }] = await Promise.all([editorData(), searchParams]);

  return (
    <section className="wrap page">
      <p className="eyebrow">Private</p>
      <h1>Studio</h1>
      <StudioNav current="/studio/products" />
      <ProductEditor
        siteBase={siteUrl()}
        initialSlug={initialSlug}
        limits={limits}
        products={data.map(({ product, content, photos, hasUnpublished, publishedAt, draftSavedAt }) => ({
          slug: product.slug,
          category: product.category,
          categoryPhrase: categoryPhrase[product.category],
          artwork: product.image,
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

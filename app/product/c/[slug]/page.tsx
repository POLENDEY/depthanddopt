import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categories, getCategory, productsInCategory } from "@/lib/products";

export const dynamic = "force-static";

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => {
    const category = getCategory(slug);
    if (!category) return { title: "Product" };
    return { title: category.title, description: category.summary };
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const items = productsInCategory(category.title);

  return (
    <section className="wrap page">
      <Link className="text-link" href="/product">All products</Link>
      <p className="eyebrow">Product</p>
      <h1>{category.title}</h1>
      <p className="lead">{category.summary}</p>
      <div className="grid store">
        {items.map((item) => (
          <Link className="card" href={`/product/${item.slug}`} key={item.slug}>
            <img src={item.image} alt="" width={800} height={800} loading="lazy" />
            <div>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </div>
          </Link>
        ))}
      </div>
      <p>
        <Link className="button" href={`/inquire?interest=${encodeURIComponent(items[0]?.title || "Something else")}&from=${encodeURIComponent(`/product/c/${category.slug}`)}&label=${encodeURIComponent(`Product · ${category.title}`)}`}>
          Inquire about this group
        </Link>
      </p>
    </section>
  );
}

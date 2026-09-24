import type { Metadata } from "next";
import Link from "next/link";
import { categories } from "@/lib/products";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Product",
  description: "3D printed keychains, personal objects, and print work from Depth & Dot.",
};

export default function ProductIndexPage() {
  return (
    <section className="wrap page">
      <p className="eyebrow">Catalog</p>
      <h1>Product</h1>
      <p className="lead">Choose a group. The pieces inside belong to that card.</p>
      <div className="grid">
        {categories.map((category) => (
          <Link className="card" href={`/product/c/${category.slug}`} key={category.slug}>
            <img src={category.image} alt="" width={800} height={800} loading="lazy" />
            <div>
              <span className="kicker">Group</span>
              <h3>{category.title}</h3>
              <p>{category.summary}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

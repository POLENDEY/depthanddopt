import Link from "next/link";
import { BannerSlider } from "@/components/banner-slider";
import { categories } from "@/lib/products";

export const dynamic = "force-static";

export default function HomePage() {
  return (
    <>
      <section className="wrap hero">
        <div>
          <p className="eyebrow">3D print studio</p>
          <h1>Depth &amp; Dot</h1>
          <p className="lead">
            Custom keychains, personal objects, and small-run printing. Each piece is made from a name, a date, or a short idea.
          </p>
          <div className="actions">
            <Link className="button" href="/product">View products</Link>
            <Link className="button secondary" href="/inquire">Start an inquiry</Link>
          </div>
        </div>
        <div className="stage" aria-hidden="true">
          <div className="tag">
            <i className="ring" />
            <span>D&amp;D</span>
          </div>
        </div>
      </section>
      <BannerSlider />
      <section className="wrap band">
        <h2>Product groups</h2>
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
    </>
  );
}

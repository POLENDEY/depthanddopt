import Link from "next/link";
import { BannerSlider } from "@/components/banner-slider";
import { Keychain } from "@/components/keychain";
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
            Custom keychains, personal objects, and small-run printing. A name, a date, a piece made to keep.
          </p>
          <div className="actions">
            <Link className="button" href="/product">View products</Link>
            <Link className="button secondary" href="/inquire">Start an inquiry</Link>
          </div>
        </div>
        <Keychain />
      </section>
      <BannerSlider />
      <section className="wrap band">
        <div className="band-head">
          <h2>Product groups</h2>
          <div className="marks" aria-label="Studio notes">
            <p><span>01</span>Named pieces</p>
            <p><span>02</span>Solid color</p>
            <p><span>03</span>Short runs</p>
          </div>
        </div>
        <div className="grid groups">
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

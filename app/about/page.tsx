import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About",
  description: "Depth & Dot is a small studio for custom 3D prints and other printing.",
};

export default function AboutPage() {
  return (
    <section className="page">
      <img
        className="about-banner"
        src="/images/cover.webp"
        alt=""
        width={1600}
        height={640}
        fetchPriority="high"
      />
      <div className="wrap split">
      <div>
        <p className="eyebrow">Studio</p>
        <h1>About</h1>
        <p className="lead">
          Depth &amp; Dot makes small objects that carry a name. Keychains, charms, desk pieces, and the paper that goes with them.
        </p>
      </div>
      <div className="panel">
        <p>Most pieces start as a short brief: a name, a date, a color, and where it will live. We print in solid colors and keep the forms simple enough to hold every day.</p>
        <p>Printing beyond the objects includes cards, stickers, tags, and small signs. The page is a portfolio. A quote comes back by email after an inquiry.</p>
        <Link className="text-link" href="/inquire">Write to the studio</Link>
      </div>
      </div>
      <div className="wrap steps">
        <article>
          <span>01</span>
          <h2>Brief</h2>
          <p>A name, a date, a color, and where the piece will live.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Make</h2>
          <p>Printed in a solid color, simple enough to hold every day.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Reply</h2>
          <p>A quote comes back by email. Nothing is priced on the page.</p>
        </article>
      </div>
      <p className="wrap about-links">
        <Link href="/product/c/3d-print">3D print</Link>
        <Link href="/product/c/personal">Personal</Link>
        <Link href="/product/c/print">Print</Link>
      </p>
    </section>
  );
}

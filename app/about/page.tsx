import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About",
  description: "Depth & Dot is a small studio for custom 3D prints and other printing.",
};

export default function AboutPage() {
  return (
    <section className="wrap page">
      <img
        className="about-banner"
        src="/images/about-banner.svg"
        alt=""
        width={1600}
        height={640}
        fetchPriority="high"
      />
      <div className="split">
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
    </section>
  );
}

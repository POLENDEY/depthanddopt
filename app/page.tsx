import Link from "next/link";
import { BannerSlider } from "@/components/banner-slider";
import { BusinessCard } from "@/components/business-card";
import { FacebookIcon } from "@/components/facebook-icon";
import { categories } from "@/lib/products";
import { MessengerIcon } from "@/components/messenger-icon";
import { facebookUrl, messengerUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <h1 className="hero-brand">
              <img src="/depth%26dot-text-light.svg" alt="Depth & Dot" width={505} height={66} />
            </h1>
            <p className="hero-lead">
              We design. We print. You keep. Custom keychains, personal objects, and small-run printing in Quezon City.
            </p>
            <div className="hero-actions">
              <Link className="hero-discover" href="/product">
                <span>Discover</span>
                <span className="hero-discover-dots" aria-hidden="true" />
              </Link>
              <span className="hero-actions-rule" aria-hidden="true" />
              <a className="hero-connect" href={facebookUrl} target="_blank" rel="noopener noreferrer">
                <span className="hero-round">
                  <FacebookIcon size={18} />
                </span>
                <span>Connect with us</span>
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <BusinessCard />
          </div>
        </div>

        <div className="hero-bar">
          <div className="wrap hero-bar-inner">
            <Link className="hero-play" href="/product">
              <span className="hero-play-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 4.5v15l12-7.5z" />
                </svg>
              </span>
              <span>View in 3D</span>
            </Link>
            <p className="hero-note">
              <span className="hero-note-index">1</span>
              Every piece starts from a name, a date, or a short line, and is printed to order.
            </p>
            <p className="hero-note">
              <span className="hero-note-index">2</span>
              Solid colors and short runs for gifts, events, and small shops across the Philippines.
            </p>
            <Link className="hero-round hero-next" href="/inquire" aria-label="Start an inquiry">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <div className="hero-socials">
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Depth & Dot on Facebook (opens in a new tab)">
                <FacebookIcon size={20} />
              </a>
              <a href={messengerUrl} target="_blank" rel="noopener noreferrer" aria-label="Chat with Depth & Dot on Messenger (opens in a new tab)">
                <MessengerIcon size={20} />
              </a>
              <a href="mailto:depthanddot@gmail.com" aria-label="Email Depth & Dot">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3.5 6.5 8.5 6 8.5-6" />
                </svg>
              </a>
            </div>
          </div>
        </div>
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

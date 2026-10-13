import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="skip" href="#content">Skip to content</a>
      <nav className="wrap" aria-label="Primary">
        <Link className="wordmark" href="/">
          <img src="/depth%26dot.svg" alt="Depth & Dot" width={595} height={595} />
        </Link>
        <div className="nav-links">
          <Link href="/product">Product</Link>
          <Link href="/about">About</Link>
          <Link href="/inquire">Inquire</Link>
        </div>
      </nav>
    </header>
  );
}

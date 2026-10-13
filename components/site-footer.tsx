"use client";

import Link from "next/link";

export function SiteFooter() {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="wrap site-footer-inner">
        {/* Top Grid */}
        <div className="footer-grid">
          {/* Brand & Studio Mission */}
          <div className="footer-brand-col">
            <Link href="/" className="footer-wordmark">
              <img src="/depth%26dot.svg" alt="Depth & Dot" width={595} height={595} />
            </Link>
            <p className="footer-tagline">
              Custom 3D printed objects, personal tags, and short-run craft goods. Made to order with solid pigments and typographic care.
            </p>
            <div className="footer-status-pill">
              <span className="status-indicator-dot" aria-hidden="true" />
              <span>Accepting custom orders</span>
            </div>
          </div>

          {/* Collections Directory */}
          <div className="footer-col">
            <p className="footer-col-title">Collections</p>
            <ul className="footer-nav-list">
              <li>
                <Link href="/product/c/3d-print">3D Print Objects</Link>
              </li>
              <li>
                <Link href="/product/c/personal">Personal &amp; Monograms</Link>
              </li>
              <li>
                <Link href="/product/c/print">Studio Print Goods</Link>
              </li>
              <li>
                <Link href="/product" className="footer-accent-link">
                  Full Catalog &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Studio Navigation */}
          <div className="footer-col">
            <p className="footer-col-title">Studio</p>
            <ul className="footer-nav-list">
              <li>
                <Link href="/about">About Studio</Link>
              </li>
              <li>
                <Link href="/inquire">Start an Inquiry</Link>
              </li>
              <li>
                <Link href="/studio">Studio Login</Link>
              </li>
            </ul>
          </div>

          {/* Direct Inquiries & Contact */}
          <div className="footer-col">
            <p className="footer-col-title">Inquiries</p>
            <address className="footer-contact-address">
              <a href="mailto:depthanddot@gmail.com" className="footer-contact-link">
                depthanddot@gmail.com
              </a>
              <a href="tel:+639388528698" className="footer-contact-link">
                +63 938 852 8698
              </a>
              <p className="footer-contact-note">
                Quotes sent by email. Bespoke lettering, one-offs, and batch runs welcome.
              </p>
            </address>
          </div>
        </div>

        {/* Bottom Editorial Bar */}
        <div className="footer-bottom-bar">
          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} Depth &amp; Dot Studio. All rights reserved.
          </p>

          <div className="footer-bottom-meta">
            <span className="footer-craft-pill">Solid Filament &bull; Tactile Typography</span>
            <button
              type="button"
              className="footer-back-to-top"
              onClick={scrollToTop}
              aria-label="Back to top of page"
            >
              <span>Back to top</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

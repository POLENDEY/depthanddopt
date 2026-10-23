"use client";

import Link from "next/link";
import { FacebookIcon } from "@/components/facebook-icon";
import { facebookUrl } from "@/lib/site";

export function SiteFooter() {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="wrap site-footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/" className="footer-wordmark">
              <img src="/depth%26dot-light.svg" alt="Depth & Dot" width={595} height={595} />
            </Link>
            <p className="footer-tagline">Custom 3D printed objects and personal pieces, made to order.</p>
          </div>

          <nav className="footer-col" aria-label="Footer menu">
            <p className="footer-col-title">Menu</p>
            <Link href="/product">Product</Link>
            <Link href="/about">About</Link>
            <Link href="/inquire">Inquire</Link>
          </nav>

          <nav className="footer-col" aria-label="Collections">
            <p className="footer-col-title">Collections</p>
            <Link href="/product/c/3d-print">3D print</Link>
            <Link href="/product/c/personal">Personal</Link>
            <Link href="/product/c/print">Print</Link>
          </nav>

          <address className="footer-col">
            <p className="footer-col-title">Contact</p>
            <a href="mailto:depthanddot@gmail.com">depthanddot@gmail.com</a>
            <a href="tel:+639700981948">+63 970 098 1948</a>
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer">Facebook</a>
          </address>
        </div>

        <div className="footer-bottom-bar">
          <p className="footer-copyright">
            Copyright &copy; {new Date().getFullYear()} Depth &amp; Dot. All rights reserved.
          </p>
          <div className="footer-bottom-actions">
            <button type="button" className="footer-back-to-top" onClick={scrollToTop}>
              Back to top
            </button>
            <a
              className="footer-social"
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Depth & Dot on Facebook (opens in a new tab)"
            >
              <FacebookIcon size={20} />
            </a>
          </div>
        </div>
      </div>

      <div className="footer-giant" aria-hidden="true">
        <img src="/depth%26dot-text-light.svg" alt="" width={505} height={66} />
        {[0, 1, 2, 3, 4, 5].map((layer) => (
          <span className="footer-giant-blur" key={layer} />
        ))}
      </div>
    </footer>
  );
}

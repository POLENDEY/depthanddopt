import Link from "next/link";

const links = [
  { href: "/studio", label: "Inquiries" },
  { href: "/studio/products", label: "Products" },
  { href: "/studio/gallery", label: "Gallery" },
];

export function StudioNav({ current }: { current: string }) {
  return (
    <nav className="studio-nav" aria-label="Studio sections">
      {links.map((link) => (
        <Link key={link.href} href={link.href} aria-current={link.href === current ? "page" : undefined}>
          {link.label}
        </Link>
      ))}
      <form action="/api/admin/logout" method="post">
        <button className="button secondary" type="submit">Sign out</button>
      </form>
    </nav>
  );
}

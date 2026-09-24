export type Product = {
  slug: string;
  title: string;
  category: "3D print" | "Personal" | "Print";
  summary: string;
  description: string;
  image: string;
  details: string[];
};

export const products: Product[] = [
  {
    slug: "monogram-keychain",
    title: "Monogram keychain",
    category: "3D print",
    summary: "A small tag with a name, initial, or short date.",
    description:
      "Printed as a single solid piece with a metal ring. We set the letters, the thickness, and the color around how you actually carry it.",
    image: "/images/keychain.svg",
    details: ["Names, initials, or a short date", "Matte or solid color", "Sized for keys, bags, and zippers"],
  },
  {
    slug: "bag-charm",
    title: "Bag charm",
    category: "Personal",
    summary: "A lighter charm for bags, pouches, and lanyards.",
    description:
      "The same care as a keychain, with a shape that sits flatter against fabric. Good for a shop, a team, or a gift set.",
    image: "/images/charm.svg",
    details: ["Custom silhouette", "Soft edges", "Works as a favor or a retail charm"],
  },
  {
    slug: "desk-object",
    title: "Desk object",
    category: "3D print",
    summary: "A quiet object for a desk, shelf, or counter.",
    description:
      "Holders, small sculptures, and marks that belong in a room. We design them to be picked up, not just looked at.",
    image: "/images/desk.svg",
    details: ["One-off or a short run", "Stable base", "Color matched to a room or a brand"],
  },
  {
    slug: "name-plate",
    title: "Name plate",
    category: "Personal",
    summary: "A standing plate for a desk, a door, or a gift.",
    description:
      "Raised letters on a low base. Useful for a studio desk, a reception counter, or a personal gift with a name and a line underneath.",
    image: "/images/plate.svg",
    details: ["Raised type", "One or two lines", "Stands on its own"],
  },
  {
    slug: "event-favor",
    title: "Event favor",
    category: "3D print",
    summary: "A small run of the same object, each one named.",
    description:
      "Weddings, launches, and team gifts. One form, many names. We keep the pieces consistent and the type easy to read.",
    image: "/images/favor.svg",
    details: ["Short production runs", "Individual names", "Packed as a set"],
  },
  {
    slug: "printed-card",
    title: "Printed card",
    category: "Print",
    summary: "Cards, tags, and small paper pieces that match the object.",
    description:
      "When the printed piece should sit with the 3D work: a card, a hang tag, a thank-you, or a simple insert.",
    image: "/images/card.svg",
    details: ["Cards and hang tags", "Short copy", "Paired with a printed object"],
  },
  {
    slug: "sticker-set",
    title: "Sticker set",
    category: "Print",
    summary: "A small set of marks, icons, or names.",
    description:
      "Die-cut or simple sheet stickers for packaging, laptops, and event kits. Drawn to match the objects, not as a separate style.",
    image: "/images/sticker.svg",
    details: ["Sheets or singles", "Names and simple marks", "Made to travel with the product"],
  },
  {
    slug: "mini-sign",
    title: "Mini sign",
    category: "Print",
    summary: "A small sign for a shelf, a stall, or a door.",
    description:
      "Short words, clear type, and a size that fits a counter. Printed flat or built up as a small 3D plate.",
    image: "/images/sign.svg",
    details: ["Counter and door scale", "Flat print or raised letters", "One message, set clearly"],
  },
];

export const categories = [
  {
    slug: "3d-print",
    title: "3D print",
    summary: "Keychains, desk objects, and short runs printed as solid pieces.",
    image: "/images/keychain.svg",
  },
  {
    slug: "personal",
    title: "Personal",
    summary: "Charms and plates made around a name.",
    image: "/images/plate.svg",
  },
  {
    slug: "print",
    title: "Print",
    summary: "Cards, stickers, and small signs.",
    image: "/images/card.svg",
  },
] as const;

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function productsInCategory(title: Product["category"]) {
  return products.filter((product) => product.category === title);
}

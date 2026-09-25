export type Piece = {
  slug: string;
  title: string;
  summary: string;
  image: string;
};

export type Product = {
  slug: string;
  title: string;
  category: "3D print" | "Personal" | "Print";
  summary: string;
  description: string;
  image: string;
  details: string[];
  pieces: Piece[];
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
    pieces: [
      { slug: "initial-tag", title: "Initial tag", summary: "One letter, cut as a small tag.", image: "/images/keychain.svg" },
      { slug: "name-tag", title: "Name tag", summary: "A short name across the face.", image: "/images/charm.svg" },
      { slug: "date-tag", title: "Date tag", summary: "A day, set in a few numbers.", image: "/images/plate.svg" },
      { slug: "two-line-tag", title: "Two-line tag", summary: "A name, and one line under it.", image: "/images/favor.svg" },
    ],
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
    pieces: [
      { slug: "round-charm", title: "Round charm", summary: "A circle with a short name.", image: "/images/charm.svg" },
      { slug: "flat-charm", title: "Flat charm", summary: "Sits close against a bag or pouch.", image: "/images/keychain.svg" },
      { slug: "set-charm", title: "Charm set", summary: "A few of the same charm, each named.", image: "/images/favor.svg" },
    ],
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
    pieces: [
      { slug: "holder", title: "Holder", summary: "A low piece for a pen or a card.", image: "/images/desk.svg" },
      { slug: "mark", title: "Desk mark", summary: "A small form that sits on a shelf.", image: "/images/plate.svg" },
      { slug: "block", title: "Block", summary: "A solid shape with one word.", image: "/images/sign.svg" },
    ],
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
    pieces: [
      { slug: "desk-plate", title: "Desk plate", summary: "A name on a low standing base.", image: "/images/plate.svg" },
      { slug: "door-plate", title: "Door plate", summary: "One line, meant to be read in passing.", image: "/images/sign.svg" },
      { slug: "gift-plate", title: "Gift plate", summary: "A name and a short line underneath.", image: "/images/card.svg" },
    ],
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
    pieces: [
      { slug: "guest-tag", title: "Guest tag", summary: "One name on each piece in the set.", image: "/images/favor.svg" },
      { slug: "place-tag", title: "Place tag", summary: "A name for a table or a seat.", image: "/images/plate.svg" },
      { slug: "team-tag", title: "Team tag", summary: "The same form, a different name.", image: "/images/keychain.svg" },
    ],
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
    pieces: [
      { slug: "note-card", title: "Note card", summary: "A short message on a single card.", image: "/images/card.svg" },
      { slug: "hang-tag", title: "Hang tag", summary: "A tag that travels with the object.", image: "/images/keychain.svg" },
      { slug: "thank-you", title: "Thank-you card", summary: "A few words, set simply.", image: "/images/sticker.svg" },
    ],
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
    pieces: [
      { slug: "name-sticker", title: "Name sticker", summary: "A name, cut as a single mark.", image: "/images/sticker.svg" },
      { slug: "icon-sticker", title: "Icon sticker", summary: "A small mark, repeated on a sheet.", image: "/images/charm.svg" },
      { slug: "set-sticker", title: "Sticker sheet", summary: "A few marks together.", image: "/images/card.svg" },
    ],
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
    pieces: [
      { slug: "counter-sign", title: "Counter sign", summary: "A short word for a stall or a desk.", image: "/images/sign.svg" },
      { slug: "door-sign", title: "Door sign", summary: "One message, large enough to read.", image: "/images/plate.svg" },
      { slug: "shelf-sign", title: "Shelf sign", summary: "A small sign that sits with the objects.", image: "/images/desk.svg" },
    ],
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

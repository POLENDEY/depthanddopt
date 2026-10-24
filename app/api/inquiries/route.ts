import { NextResponse } from "next/server";
import { z } from "zod";
import { createInquiry } from "@/lib/inquiry-store";
import { sendMail } from "@/lib/mail";
import { products } from "@/lib/products";
import { limit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  interest: z.string().trim().min(2).max(80),
  message: z.string().trim().min(10).max(2000),
  sourceLabel: z.string().trim().min(2).max(80),
  sourcePath: z.string().trim().min(1).max(120).regex(/^\/[a-z0-9/-]*$/),
  website: z.string().optional(),
});

const allowed = new Set([...products.map((product) => product.title), "Something else"]);

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!limit(`inquiry:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Please wait before sending another inquiry." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the form and try again." }, { status: 400 });
  }
  if (parsed.data.website) return NextResponse.json({ ok: true });
  if (!allowed.has(parsed.data.interest)) {
    return NextResponse.json({ error: "Choose a piece from the list." }, { status: 400 });
  }

  const phone = parsed.data.phone || null;
  let id: string;
  try {
    ({ id } = await createInquiry({
      name: parsed.data.name,
      email: parsed.data.email,
      phone,
      interest: parsed.data.interest,
      message: parsed.data.message,
      sourceLabel: parsed.data.sourceLabel,
      sourcePath: parsed.data.sourcePath,
    }));
  } catch (error) {
    console.error("Inquiry could not be saved.", error);
    return NextResponse.json(
      { error: "We could not save your inquiry right now. Please try again, or message us on Messenger." },
      { status: 503 },
    );
  }

  const notify = process.env.INQUIRY_NOTIFY_TO || process.env.SMTP_USER;
  if (notify) {
    await sendMail({
      to: notify,
      replyTo: parsed.data.email,
      subject: `New inquiry from ${parsed.data.name}`,
      text: `${parsed.data.name} <${parsed.data.email}>${phone ? `\n${phone}` : ""}\nProduct: ${parsed.data.interest}\nCame from: ${parsed.data.sourceLabel} (${parsed.data.sourcePath})\n\n${parsed.data.message}`,
    }).catch((error) => console.error("Inquiry notification email failed.", error));
  }

  return NextResponse.json({ ok: true, reference: id.slice(0, 8).toUpperCase() });
}

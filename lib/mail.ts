import "server-only";
import nodemailer from "nodemailer";

function transport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) throw new Error("SMTP is not configured");
  return {
    user,
    mailer: nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || "gmail",
      auth: { user, pass },
    }),
  };
}

export async function sendMail(input: { to: string; subject: string; text: string; replyTo?: string }) {
  const { user, mailer } = transport();
  await mailer.sendMail({
    from: `Depth & Dot <${user}>`,
    to: input.to,
    replyTo: input.replyTo || user,
    subject: input.subject,
    text: input.text,
  });
}

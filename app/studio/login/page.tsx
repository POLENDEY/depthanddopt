import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <section className="wrap page" style={{ maxWidth: 560 }}>
      <p className="eyebrow">Private</p>
      <h1>Studio</h1>
      <div className="panel">
        <LoginForm />
      </div>
    </section>
  );
}

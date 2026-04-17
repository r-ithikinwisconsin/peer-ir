"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";

function LoginForm() {
  const search = useSearchParams();
  const next = search.get("next") ?? "/feed";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    const supabase = createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (err) {
      setStatus("error");
      setError(err.message);
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg bg-surface p-8 text-center shadow-card">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary-soft-fg">
          <Mail size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Check your inbox</h2>
          <p className="mt-1 text-sm text-text-muted">
            We sent a sign-in link to <strong>{email}</strong>. It expires in
            one hour.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => setStatus("idle")}
          className="mt-2"
        >
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg bg-surface p-6 shadow-card"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-text-muted">
          We&apos;ll email you a one-time sign-in link.
        </p>
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@hospital.org"
        />
      </div>
      {error && (
        <p className="text-sm text-[#b91c1c]">{error}</p>
      )}
      <Button
        type="submit"
        block
        size="lg"
        disabled={status === "sending" || !email}
      >
        {status === "sending" ? "Sending…" : "Send magic link"}
      </Button>
      <p className="text-center text-xs text-text-subtle">
        For educational purposes only. Not clinical advice. Do not enter PHI.
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-5 py-10">
      <Suspense
        fallback={<div className="h-40 rounded-lg bg-surface shadow-card" />}
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}

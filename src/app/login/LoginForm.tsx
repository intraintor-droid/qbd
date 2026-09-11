"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { PasswordInput } from "@/components/auth/PasswordInput";

function getSafeRedirect(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/dashboard";
  }
  return value;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(getSafeRedirect(searchParams.get("redirectTo")));
    router.refresh();
  }

  return (
    <div className="min-h-screen flex bg-paper">
      <AuthBrandPanel />

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <p className="font-mono text-xs tracking-wide text-primary lg:hidden mb-1">QbD Preformulation</p>
          <h1 className="font-display text-3xl">Selamat datang kembali</h1>
          <p className="text-sm text-ink/55 mt-2 mb-8">Masuk untuk melanjutkan penelitian preformulasi Anda.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1.5 text-ink/80" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="peneliti@institusi.ac.id"
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5 text-ink/80" htmlFor="password">Kata sandi</label>
              <PasswordInput id="password" value={password} onChange={setPassword} required />
            </div>
            {error && (
              <p className="text-sm text-risk-critical bg-risk-critical/5 border border-risk-critical/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="text-sm text-ink/55 mt-6">
            Belum punya akun?{" "}
            <a href="/register" className="text-primary font-medium hover:text-primary-dark">
              Daftar sekarang
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

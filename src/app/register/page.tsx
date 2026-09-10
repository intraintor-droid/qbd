"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { PasswordInput } from "@/components/auth/PasswordInput";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setNotice("Akun dibuat. Silakan cek email untuk konfirmasi sebelum masuk.");
    }
  }

  return (
    <div className="min-h-screen flex bg-paper">
      <AuthBrandPanel />

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <p className="font-mono text-xs tracking-wide text-primary lg:hidden mb-1">QbD Preformulation</p>
          <h1 className="font-display text-3xl">Buat akun peneliti</h1>
          <p className="text-sm text-ink/55 mt-2 mb-8">Mulai studi preformulasi pertama Anda dalam hitungan menit.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1.5 text-ink/80" htmlFor="fullName">Nama lengkap</label>
              <input
                id="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5 text-ink/80" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm mb-1.5 text-ink/80" htmlFor="password">Kata sandi</label>
              <PasswordInput id="password" value={password} onChange={setPassword} required minLength={8} />
            </div>
            {error && (
              <p className="text-sm text-risk-critical bg-risk-critical/5 border border-risk-critical/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {notice && (
              <p className="text-sm text-risk-low bg-risk-low/5 border border-risk-low/20 rounded-lg px-3 py-2">
                {notice}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Daftar"}
            </button>
          </form>

          <p className="text-sm text-ink/55 mt-6">
            Sudah punya akun?{" "}
            <a href="/login" className="text-primary font-medium hover:text-primary-dark">
              Masuk
            </a>
          </p>
          <p className="text-xs text-ink/45 mt-6 border-t border-line pt-4 leading-relaxed">
            Akun baru mendapat peran <span className="font-mono">researcher</span> secara default.
            Peran <span className="font-mono">reviewer</span> dan <span className="font-mono">super_admin</span> diberikan oleh admin sistem.
          </p>
        </div>
      </div>
    </div>
  );
}

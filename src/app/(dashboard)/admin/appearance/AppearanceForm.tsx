"use client";

import { useState, useTransition } from "react";
import { updateAppSettings } from "@/lib/actions/admin";
import type { AppSettings } from "@/lib/settings/types";

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

export function AppearanceForm({ initial }: { initial: AppSettings }) {
  const [form, setForm] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(formData: FormData) {
    setSaved(false);
    startTransition(async () => {
      await updateAppSettings(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="grid md:grid-cols-[1fr_260px] gap-8">
      <form action={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm mb-1.5 text-ink/80">Nama aplikasi</label>
          <input
            name="app_name"
            value={form.app_name}
            onChange={(e) => set("app_name", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5 text-ink/80">Tagline</label>
          <input
            name="tagline"
            value={form.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5 text-ink/80">Headline halaman login</label>
          <textarea
            name="hero_headline"
            rows={2}
            value={form.hero_headline}
            onChange={(e) => set("hero_headline", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5 text-ink/80">Deskripsi halaman login</label>
          <textarea
            name="hero_body"
            rows={3}
            value={form.hero_body}
            onChange={(e) => set("hero_body", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-line">
          <ColorField label="Warna utama" name="color_primary" value={form.color_primary} onChange={(v) => set("color_primary", v)} />
          <ColorField label="Warna hover/gelap" name="color_primary_dark" value={form.color_primary_dark} onChange={(v) => set("color_primary_dark", v)} />
          <ColorField label="Warna latar lembut" name="color_primary_soft" value={form.color_primary_soft} onChange={(v) => set("color_primary_soft", v)} />
          <ColorField label="Warna aksen" name="color_accent" value={form.color_accent} onChange={(v) => set("color_accent", v)} />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: form.color_primary }}
          >
            {pending ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
          {saved && <span className="text-sm text-risk-low">Tersimpan — halaman lain akan ikut update.</span>}
        </div>
      </form>

      {/* Live preview — reflects the form state before saving */}
      <div className="border border-line rounded-xl overflow-hidden h-fit sticky top-6">
        <div
          className="p-5 text-white"
          style={{
            background: `linear-gradient(155deg, ${form.color_primary_dark} 0%, ${form.color_primary} 55%, ${form.color_accent} 100%)`
          }}
        >
          <p className="font-mono text-[10px] tracking-wide text-white/70">{form.app_name}</p>
          <p className="font-display text-lg mt-1 leading-tight">{form.tagline}</p>
        </div>
        <div className="p-4 space-y-2">
          <button
            type="button"
            className="w-full rounded-lg py-2 text-xs font-medium text-white"
            style={{ backgroundColor: form.color_primary }}
          >
            Tombol utama
          </button>
          <div
            className="rounded-lg px-3 py-2 text-xs"
            style={{ backgroundColor: form.color_primary_soft, color: form.color_primary }}
          >
            Badge / highlight
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorField({
  label,
  name,
  value,
  onChange
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs mb-1.5 text-ink/70">{label}</label>
      <div className="flex items-center gap-2 border border-line rounded-xl px-2 py-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
        />
        <input
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-xs font-mono focus:outline-none bg-transparent"
        />
      </div>
    </div>
  );
}

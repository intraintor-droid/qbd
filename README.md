# QbD Preformulation Research Assistant

Aplikasi pendukung penelitian preformulasi farmasi berbasis Quality by Design (QbD).
Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres + Auth + RLS).

Ini adalah implementasi **fase 1–3** dari roadmap penuh 13-fase yang diminta: arsitektur
project, autentikasi & database, API Database (PubChem), Literature Search
(PubMed/Europe PMC/Crossref/OpenAlex), dan modul QbD inti (QTPP, CQA, CMA, Risk
Assessment/FMEA, References). Lihat bagian **Roadmap** di bawah untuk yang belum
diimplementasikan.

## 1. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan isi `supabase/schema.sql` (skema tabel).
3. Jalankan isi `supabase/rls.sql` (Row Level Security + trigger auto-create profile).
4. Di **Project Settings → API**, salin:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (jaga kerahasiaannya, jangan pernah expose ke client)

## 2. Environment variables

```bash
cp .env.example .env.local
```

Isi minimal:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `AI_PROVIDER` (`anthropic` | `openai` | `gemini`) + API key provider terkait, untuk AI Research Assistant
- `NCBI_EUTILS_EMAIL` dan `CROSSREF_MAILTO` — opsional tapi disarankan (masuk "polite pool" agar rate limit lebih tinggi di PubMed/Crossref/OpenAlex)
- `PUBCHEM_API_URL` — biarkan default

## 3. Jalankan secara lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000 — akan diarahkan ke `/login`. Daftar akun baru (role
default: `researcher`).

## 4. Deploy ke Vercel

1. Push repo ini ke GitHub.
2. Import project di [vercel.com](https://vercel.com/new).
3. Tambahkan semua environment variables dari `.env.local` di Vercel Project Settings.
4. Deploy.

## Struktur proyek

```
supabase/schema.sql       -> Skema database lengkap (17 tabel, sesuai spesifikasi)
supabase/rls.sql          -> Row Level Security per role (researcher/reviewer/super_admin)
src/lib/supabase/         -> Client & server Supabase clients
src/lib/ai/provider.ts    -> AIProvider abstraction (Anthropic/OpenAI/Gemini) + anti-hallucination prompt
src/lib/pubchem/          -> Integrasi PubChem PUG REST (data asli, tidak pernah mengarang)
src/lib/literature/       -> Client PubMed, Europe PMC, Crossref, OpenAlex + aggregator/ranking
src/app/(dashboard)/      -> Dashboard, Projects, workspace proyek, AI Assistant, Reports, Settings
src/components/workspace/ -> Tab-tab workspace: API Profile, Literature, QTPP, CQA, CMA, Risk, References
```

## Prinsip anti-halusinasi (WAJIB, lihat `src/lib/ai/provider.ts`)

- Setiap panggilan AI diberi context (literatur & evidence tersimpan) dan sistem prompt
  yang melarang AI mengarang jurnal, DOI, atau nilai eksperimen.
- Jika context tidak cukup, AI wajib menjawab `"Insufficient evidence found."`
- Data PubChem yang tidak tersedia ditandai `"TIDAK DITEMUKAN"`, bukan diestimasi diam-diam.
- Referensi tanpa DOI ditandai `"DOI not available"`, tidak pernah dibuat-buat.

## Roadmap — belum diimplementasikan di iterasi ini

Sesuai penomoran spesifikasi asli:
- **CPP module** (bagian 14) — tabel & RLS sudah ada di skema, UI belum.
- **Excipient Compatibility screening** (bagian 20) — tabel & RLS sudah ada, UI belum.
- **Preformulation Study Plan generator** (bagian 23) — tabel sudah ada, UI/AI-draft belum.
- **Evidence Extraction otomatis oleh AI dari abstrak jurnal** (bagian 9-10).
- **Literature Matrix** dengan export CSV/Excel/PDF (bagian 26).
- **Evidence Map** visual interaktif (bagian 27).
- **Search History & Favorite Paper UI** (bagian 28-29) — tabel sudah ada.
- **Report Generator** dengan export PDF/DOCX/Excel (bagian 37).
- **Research Gap Analysis** & **Novelty Checker** (bagian 38-39).
- **Traceability graph** visual (bagian 40).
- **Audit trail UI** untuk super_admin (bagian 43) — tabel `audit_log` sudah ada di skema.
- Panel admin (manajemen user, konfigurasi AI provider).

Setiap tabel untuk fitur-fitur di atas sudah dirancang di `schema.sql` dan sudah
dilindungi RLS, jadi menambah UI-nya adalah pekerjaan lanjutan tanpa perlu migrasi
skema besar-besaran.

## Disclaimer ilmiah

Aplikasi ini adalah alat bantu penelitian (decision-support), bukan pengganti keputusan
ilmiah peneliti. Semua informasi dari database, literatur, atau analisis AI harus
diverifikasi melalui sumber primer sebelum digunakan dalam keputusan formulasi,
eksperimen laboratorium, publikasi, atau dokumen regulatori.

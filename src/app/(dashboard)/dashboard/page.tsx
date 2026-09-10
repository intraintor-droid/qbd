import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";

export default async function DashboardPage() {
  const supabase = createServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const [{ count: projectCount }, { count: apiCount }, { count: literatureCount }, { data: recentLiterature }, { data: riskRows }] =
    await Promise.all([
      supabase.from("projects").select("*", { count: "exact", head: true }).is("deleted_at", null),
      supabase.from("apis").select("*", { count: "exact", head: true }),
      supabase.from("literature").select("*", { count: "exact", head: true }).is("deleted_at", null),
      supabase
        .from("literature")
        .select("id, title, journal, publication_year, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("risk_assessments").select("risk_level")
    ]);

  const riskCounts = { low: 0, medium: 0, high: 0, critical: 0, unknown: 0 };
  (riskRows ?? []).forEach((r) => {
    const level = (r.risk_level ?? "unknown") as keyof typeof riskCounts;
    riskCounts[level] = (riskCounts[level] ?? 0) + 1;
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs text-primary">Overview</p>
        <h1 className="font-display text-2xl mt-1">Dashboard Penelitian</h1>
        <p className="text-sm text-ink/60 mt-1">
          Ringkasan seluruh proyek preformulasi yang dapat Anda akses.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Proyek" value={projectCount ?? 0} />
        <StatCard label="API Dianalisis" value={apiCount ?? 0} />
        <StatCard label="Jurnal Ditemukan" value={literatureCount ?? 0} />
        <StatCard label="Risiko Tinggi/Kritis" value={riskCounts.high + riskCounts.critical} hint="Perlu perhatian" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-line bg-surface rounded-md p-4">
          <p className="text-sm font-medium mb-3">Distribusi Risiko</p>
          <div className="space-y-2">
            {(["critical", "high", "medium", "low", "unknown"] as const).map((level) => (
              <div key={level} className="flex items-center gap-3">
                <span className={`badge-risk-${level} text-[11px] px-2 py-0.5 rounded-sm w-20 text-center capitalize`}>
                  {level}
                </span>
                <div className="flex-1 h-2 bg-line/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-risk-${level === "unknown" ? "medium" : level}`}
                    style={{
                      width: `${
                        Object.values(riskCounts).reduce((a, b) => a + b, 0) > 0
                          ? (riskCounts[level] / Object.values(riskCounts).reduce((a, b) => a + b, 0)) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
                <span className="text-xs text-ink/60 w-6 text-right">{riskCounts[level]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-line bg-surface rounded-md p-4">
          <p className="text-sm font-medium mb-3">Jurnal Terbaru Ditambahkan</p>
          {(!recentLiterature || recentLiterature.length === 0) && (
            <p className="text-sm text-ink/50">Belum ada jurnal tersimpan. Mulai dari Literature Search.</p>
          )}
          <ul className="space-y-3">
            {(recentLiterature ?? []).map((lit) => (
              <li key={lit.id} className="text-sm">
                <p className="leading-snug">{lit.title}</p>
                <p className="text-xs text-ink/50">{lit.journal ?? "—"} · {lit.publication_year ?? "n.d."}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border border-line bg-surface rounded-md p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Mulai proyek preformulasi baru</p>
          <p className="text-xs text-ink/55 mt-0.5">Definisikan API, bentuk sediaan, dan tujuan terapi Anda.</p>
        </div>
        <Link href="/projects/new" className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
          + Proyek Baru
        </Link>
      </div>
    </div>
  );
}

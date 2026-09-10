export default function ReportsPage() {
  return (
    <div className="max-w-xl">
      <p className="font-mono text-xs text-primary">Roadmap</p>
      <h1 className="font-display text-2xl mt-1 mb-3">Report Generator</h1>
      <p className="text-sm text-ink/60">
        Generator laporan preformulasi (export PDF/DOCX/Excel/CSV, spec bagian 37) belum diimplementasikan
        pada iterasi ini. Data yang sudah tersimpan di setiap proyek (API profile, literature, QTPP, CQA,
        CMA, risk assessment, references) sudah terstruktur di Supabase dan siap dijadikan input laporan
        pada fase berikutnya.
      </p>
    </div>
  );
}

import { createProject } from "@/lib/actions/projects";

const inputClass =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

export default function NewProjectPage() {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-xs text-primary">Workspace</p>
      <h1 className="font-display text-2xl mt-1 mb-6">Proyek Preformulasi Baru</h1>

      <form action={createProject} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Nama penelitian" name="research_name" required />
          <Field label="Judul penelitian" name="research_title" required />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Peneliti" name="researcher_name" />
          <Field label="Institusi" name="institution" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="API / bahan aktif" name="target_api" placeholder="mis. Paracetamol" />
          <Field label="Bentuk sediaan target" name="dosage_form" placeholder="mis. Tablet" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Rute pemberian" name="route_of_administration" placeholder="mis. Oral" />
          <Field label="Tahun penelitian" name="research_year" type="number" />
        </div>
        <Field label="Tujuan formulasi" name="formulation_objective" />
        <Field label="Target terapi" name="therapeutic_target" />
        <div>
          <label className="block text-sm mb-1">Catatan</label>
          <textarea name="notes" rows={3} className={inputClass} />
        </div>
        <button type="submit" className="bg-primary text-primary-foreground text-sm px-5 py-2.5 rounded-md hover:bg-primary/90">
          Buat Proyek
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
  placeholder
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm mb-1" htmlFor={name}>
        {label}
        {required && <span className="text-risk-critical"> *</span>}
      </label>
      <input id={name} name={name} type={type} required={required} placeholder={placeholder} className={inputClass} />
    </div>
  );
}

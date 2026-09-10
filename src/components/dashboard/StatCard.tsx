export function StatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="border border-line bg-surface rounded-md p-4">
      <p className="text-xs text-ink/55">{label}</p>
      <p className="font-display text-3xl mt-1">{value}</p>
      {hint && <p className="text-[11px] text-ink/45 mt-1">{hint}</p>}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { softDeleteProject } from "@/lib/actions/admin";

export function DeleteProjectButton({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="text-xs text-risk-critical hover:underline">
        Hapus
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-ink/55">Yakin hapus "{projectTitle}"?</span>
      <button
        disabled={pending}
        onClick={() => startTransition(() => softDeleteProject(projectId))}
        className="text-xs bg-risk-critical text-white px-2 py-1 rounded disabled:opacity-60"
      >
        {pending ? "..." : "Ya, hapus"}
      </button>
      <button onClick={() => setConfirming(false)} className="text-xs text-ink/50 hover:underline">
        Batal
      </button>
    </div>
  );
}

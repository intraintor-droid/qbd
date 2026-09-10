"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/lib/actions/admin";
import type { UserRole } from "@/types/database";

export function RoleSelect({
  userId,
  currentRole,
  disabled
}: {
  userId: string;
  currentRole: UserRole;
  disabled?: boolean;
}) {
  const [role, setRole] = useState<UserRole>(currentRole);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleChange(newRole: UserRole) {
    setRole(newRole);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateUserRole(userId, newRole);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } catch {
        setRole(currentRole); // revert on failure
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        disabled={disabled || pending}
        onChange={(e) => handleChange(e.target.value as UserRole)}
        className="rounded-md border border-line px-2 py-1 text-xs font-mono disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="researcher">researcher</option>
        <option value="reviewer">reviewer</option>
        <option value="super_admin">super_admin</option>
      </select>
      {pending && <span className="text-[11px] text-ink/40">...</span>}
      {saved && <span className="text-[11px] text-risk-low">tersimpan</span>}
    </div>
  );
}

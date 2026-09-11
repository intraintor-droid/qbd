"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error);
      setLoading(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-sm border border-line px-3 py-1.5 text-sm text-ink/70 transition-colors hover:bg-primary-soft hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Logout"
    >
      <LogOut size={15} strokeWidth={1.75} />
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}

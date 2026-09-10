"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FolderKanban, MessagesSquare, FileBarChart, Settings
} from "lucide-react";

// Modul QbD (API Profile, QTPP, CQA, CMA, CPP, Literature, Risk Assessment,
// Excipient Compatibility, Preformulation, References) hidup sebagai tab di
// dalam workspace tiap proyek — lihat /projects/[id] — sesuai spesifikasi
// bagian 4. Sidebar level-atas hanya menaungi navigasi lintas-proyek.
const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/ai-assistant", label: "AI Research Assistant", icon: MessagesSquare },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-line bg-surface h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-5 border-b border-line">
        <p className="font-mono text-[11px] tracking-wide text-primary">QbD Workspace</p>
        <p className="font-display text-lg leading-tight mt-0.5">Preformulation<br />Research Assistant</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-5 py-2 text-sm transition-colors ${
                active
                  ? "bg-primary-soft text-primary font-medium border-r-2 border-primary"
                  : "text-ink/70 hover:bg-primary-soft/50 hover:text-ink"
              }`}
            >
              <Icon size={16} strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-line text-[11px] text-ink/45 leading-snug">
        Alat bantu penelitian. Verifikasi setiap keluaran dengan sumber primer sebelum
        digunakan dalam keputusan formulasi atau dokumen regulatori.
      </div>
    </aside>
  );
}

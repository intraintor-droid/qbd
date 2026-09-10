"use client";

import { useState } from "react";
import { ApiProfileTab } from "./ApiProfileTab";
import { LiteratureTab } from "./LiteratureTab";
import { QtppTab } from "./QtppTab";
import { CqaTab } from "./CqaTab";
import { CmaTab } from "./CmaTab";
import { RiskAssessmentTab } from "./RiskAssessmentTab";
import { ReferencesTab } from "./ReferencesTab";

const TABS = [
  { id: "api", label: "API Profile" },
  { id: "literature", label: "Literature" },
  { id: "qtpp", label: "QTPP" },
  { id: "cqa", label: "CQA" },
  { id: "cma", label: "CMA" },
  { id: "risk", label: "Risk Assessment" },
  { id: "references", label: "References" }
] as const;

type TabId = (typeof TABS)[number]["id"];

export function WorkspaceTabs({ projectId }: { projectId: string }) {
  const [active, setActive] = useState<TabId>("api");

  return (
    <div>
      <div className="flex gap-1 border-b border-line overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-3.5 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
              active === t.id ? "border-primary text-primary font-medium" : "border-transparent text-ink/55 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pt-5">
        {active === "api" && <ApiProfileTab projectId={projectId} />}
        {active === "literature" && <LiteratureTab projectId={projectId} />}
        {active === "qtpp" && <QtppTab projectId={projectId} />}
        {active === "cqa" && <CqaTab projectId={projectId} />}
        {active === "cma" && <CmaTab projectId={projectId} />}
        {active === "risk" && <RiskAssessmentTab projectId={projectId} />}
        {active === "references" && <ReferencesTab projectId={projectId} />}
      </div>
    </div>
  );
}

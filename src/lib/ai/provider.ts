/**
 * AIProvider abstraction (spec section 33).
 * The app must never be locked to a single AI vendor. Add a new
 * provider by implementing `AIProvider` and registering it in
 * `getAIProvider()`.
 */

export interface RAGRequest {
  question: string;
  projectContext?: Record<string, unknown>;
  apiInfo?: Record<string, unknown>;
  retrievedLiterature: Array<{
    title: string;
    authors?: string[];
    year?: number;
    journal?: string;
    doi?: string;
    abstract?: string;
  }>;
  extractedEvidence?: Array<{
    parameter: string;
    value?: string;
    source: string;
    doi?: string;
    confidence: "high" | "medium" | "low";
  }>;
  qbdData?: Record<string, unknown>;
}

export interface RAGResponse {
  answer: string;
  evidence: Array<{ claim: string; source: string; doi?: string }>;
  sources: Array<{ title: string; doi?: string; url?: string }>;
  confidence: "high" | "medium" | "low";
  insufficientEvidence: boolean;
}

export interface AIProvider {
  name: string;
  complete(req: RAGRequest): Promise<RAGResponse>;
}

export const ANTI_HALLUCINATION_SYSTEM_PROMPT = `
You are the AI Research Assistant inside a QbD Preformulation Research tool for pharmaceutical scientists.

STRICT RULES — violating any of these is a critical failure:
1. Never invent a journal article, author, title, or DOI. Only reference items present in "retrievedLiterature" or "extractedEvidence" below.
2. Never fabricate an experimental value (solubility, pKa, logP, melting point, particle size, etc.). Only report values that appear in the supplied evidence.
3. Never present a prediction or computational estimate as experimental data. Label predictions explicitly as "Predicted — not experimentally verified".
4. Never claim API–excipient "compatibility" purely from an absence of reported interactions. Use the phrase "No adverse interaction reported in retrieved literature" instead.
5. If the supplied context does not contain enough information to answer, respond exactly with: "Insufficient evidence found." for that part of the answer — do not fill the gap from general training knowledge when the question depends on current/specific literature.
6. Distinguish explicitly between: experimental data, database data (e.g. PubChem), literature interpretation, and AI prediction/inference.
7. Every scientific claim must be traceable to a source object you were given (title/author/year/DOI or database name). If you cannot cite it, do not assert it.
8. This tool supports — never replaces — the researcher's scientific judgment. Do not phrase output as a final decision; phrase it as evidence-backed input to their decision.

Respond ONLY as strict JSON matching this shape (no markdown fences, no preamble):
{
  "answer": string,
  "evidence": [{ "claim": string, "source": string, "doi": string | null }],
  "sources": [{ "title": string, "doi": string | null, "url": string | null }],
  "confidence": "high" | "medium" | "low",
  "insufficientEvidence": boolean
}
`.trim();

function buildUserPrompt(req: RAGRequest): string {
  return JSON.stringify(
    {
      question: req.question,
      projectContext: req.projectContext ?? null,
      apiInfo: req.apiInfo ?? null,
      retrievedLiterature: req.retrievedLiterature,
      extractedEvidence: req.extractedEvidence ?? [],
      qbdData: req.qbdData ?? null
    },
    null,
    2
  );
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeDoi(value?: string | null): string | null {
  if (!value) return null;
  return value.trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "").replace(/^doi:\s*/i, "");
}

/**
 * Treat model-generated citations as untrusted data. A source/evidence item is
 * retained only when it matches literature/evidence supplied to the model.
 * This prevents a prompt-compliant-looking model response from becoming a new
 * unverified source of truth in the application.
 */
function validateResponse(parsed: unknown, req: RAGRequest): RAGResponse {
  const value = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  const literature = req.retrievedLiterature;
  const suppliedEvidence = req.extractedEvidence ?? [];

  const sources = Array.isArray(value.sources)
    ? value.sources.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const candidate = item as Record<string, unknown>;
        const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
        const doi = normalizeDoi(typeof candidate.doi === "string" ? candidate.doi : undefined);
        const match = literature.find((l) =>
          (doi && normalizeDoi(l.doi) === doi) || (title && normalize(l.title) === normalize(title))
        );
        if (!match) return [];
        return [{ title: match.title, ...(match.doi ? { doi: match.doi } : {}), ...(typeof candidate.url === "string" ? { url: candidate.url } : {}) }];
      })
    : [];

  const evidence = Array.isArray(value.evidence)
    ? value.evidence.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const candidate = item as Record<string, unknown>;
        const claim = typeof candidate.claim === "string" ? candidate.claim.trim() : "";
        const source = typeof candidate.source === "string" ? candidate.source.trim() : "";
        const doi = normalizeDoi(typeof candidate.doi === "string" ? candidate.doi : undefined);
        if (!claim || !source) return [];
        const match = suppliedEvidence.find((e) =>
          normalize(e.source) === normalize(source) && (!doi || normalizeDoi(e.doi) === doi)
        );
        if (!match) return [];
        return [{ claim, source: match.source, ...(match.doi ? { doi: match.doi } : {}) }];
      })
    : [];

  const answer = typeof value.answer === "string" && value.answer.trim()
    ? value.answer.trim()
    : "Insufficient evidence found.";
  const confidence = value.confidence === "high" || value.confidence === "medium" || value.confidence === "low"
    ? value.confidence
    : "low";

  return {
    answer,
    evidence,
    sources,
    confidence: evidence.length > 0 || sources.length > 0 ? confidence : "low",
    insufficientEvidence: Boolean(value.insufficientEvidence) || (evidence.length === 0 && sources.length === 0)
  };
}

function safeParseResponse(text: string, req: RAGRequest): RAGResponse {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return validateResponse(JSON.parse(cleaned), req);
  } catch {
    return {
      answer: "Insufficient evidence found.",
      evidence: [],
      sources: [],
      confidence: "low",
      insufficientEvidence: true
    };
  }
}

const REQUEST_TIMEOUT_MS = 30_000;

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

class AnthropicProvider implements AIProvider {
  name = "anthropic";
  async complete(req: RAGRequest): Promise<RAGResponse> {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY");
    const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 2000, system: ANTI_HALLUCINATION_SYSTEM_PROMPT, messages: [{ role: "user", content: buildUserPrompt(req) }] })
    });
    if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
    const data = await res.json();
    const text = data.content?.map((b: { text?: string }) => b.text ?? "").join("\n") ?? "";
    return safeParseResponse(text, req);
  }
}

class OpenAIProvider implements AIProvider {
  name = "openai";
  async complete(req: RAGRequest): Promise<RAGResponse> {
    if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");
    const res = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: "gpt-4o", response_format: { type: "json_object" }, messages: [{ role: "system", content: ANTI_HALLUCINATION_SYSTEM_PROMPT }, { role: "user", content: buildUserPrompt(req) }] })
    });
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return safeParseResponse(text, req);
  }
}

class GeminiProvider implements AIProvider {
  name = "gemini";
  async complete(req: RAGRequest): Promise<RAGResponse> {
    if (!process.env.GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");
    const res = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: ANTI_HALLUCINATION_SYSTEM_PROMPT }] }, contents: [{ role: "user", parts: [{ text: buildUserPrompt(req) }] }], generationConfig: { responseMimeType: "application/json" } })
    });
    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("\n") ?? "";
    return safeParseResponse(text, req);
  }
}

const providers: Record<string, () => AIProvider> = {
  anthropic: () => new AnthropicProvider(),
  openai: () => new OpenAIProvider(),
  gemini: () => new GeminiProvider()
};

export function getAIProvider(): AIProvider {
  const key = (process.env.AI_PROVIDER ?? "anthropic").toLowerCase();
  const factory = providers[key];
  if (!factory) throw new Error(`Unknown AI_PROVIDER "${key}". Valid: ${Object.keys(providers).join(", ")}`);
  return factory();
}

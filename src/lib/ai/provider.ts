/**
 * AIProvider abstraction (spec section 33).
 * The app must never be locked to a single AI vendor. Add a new
 * provider by implementing `AIProvider` and registering it in
 * `getAIProvider()`.
 *
 * Every provider receives the same structured RAGRequest and must
 * return a structured RAGResponse — answer + evidence + sources +
 * confidence — never free-floating prose with invented facts.
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

/**
 * The non-negotiable anti-hallucination contract (spec section 35).
 * This is prepended to every provider call regardless of vendor.
 */
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

function safeParseResponse(text: string): RAGResponse {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      answer: parsed.answer ?? "Insufficient evidence found.",
      evidence: parsed.evidence ?? [],
      sources: parsed.sources ?? [],
      confidence: parsed.confidence ?? "low",
      insufficientEvidence: parsed.insufficientEvidence ?? true
    };
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

// --- Anthropic adapter -------------------------------------------------
class AnthropicProvider implements AIProvider {
  name = "anthropic";
  async complete(req: RAGRequest): Promise<RAGResponse> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        system: ANTI_HALLUCINATION_SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserPrompt(req) }]
      })
    });
    if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
    const data = await res.json();
    const text = data.content?.map((b: { text?: string }) => b.text ?? "").join("\n") ?? "";
    return safeParseResponse(text);
  }
}

// --- OpenAI adapter ------------------------------------------------------
class OpenAIProvider implements AIProvider {
  name = "openai";
  async complete(req: RAGRequest): Promise<RAGResponse> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: ANTI_HALLUCINATION_SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(req) }
        ]
      })
    });
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return safeParseResponse(text);
  }
}

// --- Gemini adapter --------------------------------------------------------
class GeminiProvider implements AIProvider {
  name = "gemini";
  async complete(req: RAGRequest): Promise<RAGResponse> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: ANTI_HALLUCINATION_SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: buildUserPrompt(req) }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );
    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("\n") ?? "";
    return safeParseResponse(text);
  }
}

const providers: Record<string, () => AIProvider> = {
  anthropic: () => new AnthropicProvider(),
  openai: () => new OpenAIProvider(),
  gemini: () => new GeminiProvider()
};

/** Returns the active provider based on AI_PROVIDER env var (default: anthropic). */
export function getAIProvider(): AIProvider {
  const key = (process.env.AI_PROVIDER ?? "anthropic").toLowerCase();
  const factory = providers[key];
  if (!factory) throw new Error(`Unknown AI_PROVIDER "${key}". Valid: ${Object.keys(providers).join(", ")}`);
  return factory();
}
